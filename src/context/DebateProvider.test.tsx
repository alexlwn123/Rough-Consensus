import { act, render, screen } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import { beforeEach, expect, it, vi } from "vitest";
import { DebateProvider } from "./DebateProvider";
import { useDebate } from "./DebateContext";
import { makeDebate, makeVote } from "../test/factories";
import { aggregateVotes } from "../../shared/domain";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  mutate: vi.fn(),
  auth: vi.fn(),
  connection: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useQuery: mocks.query,
  useMutation: () => mocks.mutate,
  useConvexConnectionState: mocks.connection,
}));
vi.mock("./AuthContext", () => ({ useAuth: mocks.auth }));
let context: ReturnType<typeof useDebate>;
function Consumer() {
  context = useDebate();
  return (
    <>
      <div>{context.debate?.title}</div>
      <div>{context.userVote?.pre_vote?.option ?? "No ballot"}</div>
      <div>{context.votingPending ? "Submitting" : "Ready"}</div>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ currentUser: { id: "one" }, loading: false });
  mocks.connection.mockReturnValue({ isWebSocketConnected: true });
  mocks.query.mockImplementation((ref, args) => {
    if (args === "skip") return undefined;
    const name = getFunctionName(ref);
    if (name === "debates:get")
      return makeDebate({ currentPhase: "pre", phaseVersion: 1 });
    if (name === "votes:mine")
      return makeVote({ pre_vote: { option: "against" }, version: 2 });
    return null;
  });
});
it("keeps a vote pending until acknowledged and submits only the selected choice and versions", async () => {
  let resolve!: () => void;
  mocks.mutate.mockReturnValue(
    new Promise<void>((r) => {
      resolve = r;
    }),
  );
  render(
    <DebateProvider debateId="old-uuid">
      <Consumer />
    </DebateProvider>,
  );
  let pending!: Promise<void>;
  act(() => {
    pending = context.handleVote("for");
  });
  expect(screen.getByText("Submitting")).toBeInTheDocument();
  expect(screen.getByText("against")).toBeInTheDocument();
  expect(mocks.mutate).toHaveBeenCalledWith({
    publicId: "old-uuid",
    phase: "pre",
    phaseVersion: 1,
    expectedVoteVersion: 2,
    option: "for",
  });
  await act(async () => {
    resolve();
    await pending;
  });
  expect(screen.getByText("Ready")).toBeInTheDocument();
});
it("rejects offline voting and clears private ballot state after logout", async () => {
  mocks.connection.mockReturnValue({ isWebSocketConnected: false });
  const { rerender } = render(
    <DebateProvider debateId="one">
      <Consumer />
    </DebateProvider>,
  );
  await expect(context.handleVote("for")).rejects.toThrow("Reconnect");
  expect(mocks.mutate).not.toHaveBeenCalled();
  mocks.auth.mockReturnValue({ currentUser: null, loading: false });
  rerender(
    <DebateProvider debateId="one">
      <Consumer />
    </DebateProvider>,
  );
  expect(screen.getByText("No ballot")).toBeInTheDocument();
});
it("loads the finished results and computes the opinion shift", () => {
  mocks.query.mockImplementation((ref) => {
    const name = getFunctionName(ref);
    if (name === "debates:get") return makeDebate({ currentPhase: "finished" });
    if (name === "votes:mine") return null;
    return aggregateVotes(
      [{ preVote: "for", postVote: "against" }],
      "finished",
    );
  });
  render(
    <DebateProvider debateId="one">
      <Consumer />
    </DebateProvider>,
  );
  expect(context.voteSummary?.percentShift.for).toBe(-100);
  expect(context.sankeyData?.flows.protoagainst).toBe(1);
});
