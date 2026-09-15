import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
function AuthCallback() {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  useEffect(() => {
    if (currentUser) navigate("/", { replace: true });
  }, [currentUser, navigate]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      {loading || currentUser ? (
        <div
          aria-label="Signing in"
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"
        />
      ) : (
        <>
          <p role="alert">Sign-in could not be completed. Please try again.</p>
          <button
            className="text-blue-700 underline"
            onClick={() => navigate("/", { replace: true })}
          >
            Return to sign in
          </button>
        </>
      )}
    </div>
  );
}
export default AuthCallback;
