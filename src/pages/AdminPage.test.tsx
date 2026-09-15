import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getFunctionName } from "convex/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import AdminPage from "./AdminPage";
import { makeDebate } from "../test/factories";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  create: vi.fn(),
  phase: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useQuery: mocks.query,
  useMutation: (ref: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(ref) === "debates:create" ? mocks.create : mocks.phase,
}));
vi.mock("../context/AuthContext", () => ({ useAuth: mocks.auth }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({
    currentUser: { id: "admin", displayName: "Admin", isAdmin: true },
    loading: false,
  });
  mocks.query.mockReturnValue([
    makeDebate({
      title: "Existing Debate",
      currentPhase: "pre",
      phaseVersion: 1,
    }),
  ]);
});
it("redirects non-admins", async () => {
  mocks.auth.mockReturnValue({
    currentUser: { isAdmin: false },
    loading: false,
  });
  render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<p>Home</p>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Home")).toBeInTheDocument();
});
it("creates debates with a stable public UUID and no caller-supplied creator", async () => {
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByText("Create New Debate"));
  await userEvent.type(screen.getByLabelText("Title"), "New Debate");
  await userEvent.click(screen.getByText("Create Debate"));
  expect(mocks.create).toHaveBeenCalledWith({
    publicId: expect.stringMatching(/^[a-f0-9-]{36}$/),
    title: "New Debate",
    description: "",
  });
});
it("submits phase changes with the version observed by the admin and displays failures", async () => {
  mocks.phase.mockRejectedValue(new Error("Phase changed elsewhere"));
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: /Ongoing/ }));
  expect(mocks.phase).toHaveBeenCalledWith({
    publicId: "debate-1",
    phase: "ongoing",
    expectedVersion: 1,
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Phase changed elsewhere",
  );
});
