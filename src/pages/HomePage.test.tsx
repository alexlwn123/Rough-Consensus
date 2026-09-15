import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import HomePage from "./HomePage";
import { makeDebate } from "../test/factories";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  join: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useQuery: mocks.query,
  useMutation: () => mocks.join,
}));
vi.mock("../context/AuthContext", () => ({ useAuth: mocks.auth }));
function Location() {
  return <span data-testid="url">{useLocation().search}</span>;
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.auth.mockReturnValue({
    currentUser: { id: "one", displayName: "Alex" },
  });
  mocks.join.mockResolvedValue("old-id");
  mocks.query.mockReturnValue([]);
});
it("preserves an invite before login and removes only its parameter after joining", async () => {
  mocks.auth.mockReturnValue({ currentUser: null, signIn: vi.fn() });
  const { rerender } = render(
    <MemoryRouter initialEntries={["/?id=old-id&keep=yes"]}>
      <HomePage />
      <Location />
    </MemoryRouter>,
  );
  expect(localStorage.getItem("active_debate_id")).toBe("old-id");
  expect(mocks.join).not.toHaveBeenCalled();
  mocks.auth.mockReturnValue({
    currentUser: { id: "one", displayName: "Alex" },
  });
  rerender(
    <MemoryRouter initialEntries={["/?id=old-id&keep=yes"]}>
      <HomePage />
      <Location />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(mocks.join).toHaveBeenCalledWith({ publicId: "old-id" }),
  );
  await waitFor(() =>
    expect(screen.getByTestId("url")).toHaveTextContent("?keep=yes"),
  );
});
it("renders debates from the authorized subscription", () => {
  mocks.query.mockReturnValue([
    makeDebate({ title: "Past debate", currentPhase: "finished" }),
    makeDebate({ id: "two", title: "Coming soon" }),
  ]);
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
  expect(screen.getByText("Past debate")).toBeInTheDocument();
  expect(screen.getByText("Coming soon")).toBeInTheDocument();
});
it("reports a rejected invite instead of silently hiding the error", async () => {
  mocks.join.mockRejectedValue(new Error("missing"));
  render(
    <MemoryRouter initialEntries={["/?id=missing"]}>
      <HomePage />
    </MemoryRouter>,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "invitation could not be opened",
  );
});
