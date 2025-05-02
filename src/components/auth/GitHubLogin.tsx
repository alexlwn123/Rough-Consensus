import React from "react";
import { Github } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

const GitHubLogin: React.FC = () => {
  const { signIn, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-xl font-semibold text-white mb-3">
        Join the Discussion
      </h2>
      <p className="text-blue-100/80 mb-6 text-center text-sm">
        Sign in with GitHub to participate in debates and cast your votes.
      </p>

      <Button
        onClick={handleLogin}
        disabled={loading}
        icon={<Github className="h-5 w-5" />}
        className="w-full justify-center bg-white/90 hover:bg-white text-gray-900 hover:text-black transition-colors"
        size="lg"
      >
        {loading ? "Signing in..." : "Continue with GitHub"}
      </Button>
    </div>
  );
};

export default GitHubLogin;
