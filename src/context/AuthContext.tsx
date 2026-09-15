import { createContext, useContext, type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { OAuthProvider, User } from "../types";
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (provider?: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const actions = useAuthActions();
  const user = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const value: AuthContextType = {
    currentUser: isAuthenticated ? (user ?? null) : null,
    loading: isLoading || (isAuthenticated && user === undefined),
    signIn: async (provider: OAuthProvider = "github") => {
      await actions.signIn(provider, {
        redirectTo: new URL("/auth/callback", window.location.origin).href,
      });
    },
    signOut: actions.signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
