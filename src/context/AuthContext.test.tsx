import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  query: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("convex/react", () => ({
  useConvexAuth: mocks.auth,
  useQuery: mocks.query,
}));
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: mocks.signIn, signOut: mocks.signOut }),
}));
function Consumer() {
  const auth = useAuth();
  return (
    <>
      <span>
        {auth.loading
          ? "Loading"
          : (auth.currentUser?.displayName ?? "Signed out")}
      </span>
      <button onClick={() => void auth.signIn("google")}>Google</button>
      <button onClick={() => void auth.signOut()}>Sign out</button>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ isAuthenticated: true, isLoading: false });
  mocks.query.mockReturnValue({
    id: "one",
    displayName: "Alex",
    isAdmin: true,
  });
});
it("waits for authenticated user information and clears it on signout", () => {
  mocks.query.mockReturnValue(undefined);
  const { rerender } = render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  expect(screen.getByText("Loading")).toBeInTheDocument();
  mocks.query.mockReturnValue({
    id: "one",
    displayName: "Alex",
    isAdmin: true,
  });
  rerender(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  expect(screen.getByText("Alex")).toBeInTheDocument();
  mocks.auth.mockReturnValue({ isAuthenticated: false, isLoading: false });
  rerender(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  expect(screen.getByText("Signed out")).toBeInTheDocument();
});
it("uses the selected OAuth provider and supports signout", async () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  await userEvent.click(screen.getByText("Google"));
  expect(mocks.signIn).toHaveBeenCalledWith("google", {
    redirectTo: new URL("/auth/callback", window.location.origin).href,
  });
  await userEvent.click(screen.getByText("Sign out"));
  expect(mocks.signOut).toHaveBeenCalled();
});
