import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AuthCallback from "./AuthCallback";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), navigate: vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: mocks.auth }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
it("returns home only when sign-in is complete and reports a failed callback", () => {
  mocks.auth.mockReturnValue({ currentUser: null, loading: true });
  const { rerender } = render(<AuthCallback />);
  expect(screen.getByLabelText("Signing in")).toBeInTheDocument();
  mocks.auth.mockReturnValue({ currentUser: { id: "one" }, loading: false });
  rerender(<AuthCallback />);
  expect(mocks.navigate).toHaveBeenCalledWith("/", { replace: true });
  mocks.auth.mockReturnValue({ currentUser: null, loading: false });
  rerender(<AuthCallback />);
  expect(screen.getByRole("alert")).toHaveTextContent("could not be completed");
});
