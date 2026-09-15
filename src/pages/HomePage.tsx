import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import GitHubLogin from "../components/auth/GitHubLogin";
import DebateList from "../components/debates/DebateList";
import { storeActiveDebateId, getActiveDebateId } from "../utils/storage";
import rcLogo from "../assets/rc-logo.svg";

function HomePage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const join = useMutation(api.debates.join);
  const data = useQuery(api.debates.listVisible, currentUser ? {} : "skip");
  const debates = currentUser ? (data ?? []) : [];
  const isLoading = !!currentUser && data === undefined;
  const [joinError, setJoinError] = useState<string | null>(null);
  const userId = currentUser?.id;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const invite = params.get("id");
    if (invite) storeActiveDebateId(invite);
    const debateId = invite || getActiveDebateId();
    if (!debateId || !userId) return;
    let cancelled = false;
    join({ publicId: debateId })
      .then(() => {
        if (cancelled) return;
        setJoinError(null);
        if (invite) {
          params.delete("id");
          navigate(
            {
              pathname: location.pathname,
              search: params.toString() ? `?${params}` : "",
            },
            { replace: true },
          );
        }
      })
      .catch(() => {
        if (!cancelled)
          setJoinError(
            "This invitation could not be opened. Please check the link and try again.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, userId, join, navigate]);

  // Get ongoing debates (now filtered on server if needed)
  const ongoingDebates = debates.filter(
    (debate) =>
      debate.currentPhase === "pre" ||
      debate.currentPhase === "post" ||
      debate.currentPhase === "ongoing",
  );

  // Get scheduled debates (now filtered on server if needed)
  const scheduledDebates = debates.filter(
    (debate) => debate.currentPhase === "scheduled",
  );

  // Get past debates (always shown)
  const pastDebates = debates.filter(
    (debate) => debate.currentPhase === "finished",
  );

  return (
    <div
      className={`min-h-screen flex flex-col ${
        !currentUser
          ? "bg-gradient-to-b from-blue-900 to-indigo-800"
          : "bg-gradient-to-b from-gray-50 to-white"
      }`}
    >
      {currentUser && (
        <Header title="Rough Consensus" debateTitle="Debate Voting Platform" />
      )}

      <main className={!currentUser ? "flex-grow min-h-screen" : "flex-grow"}>
        {!currentUser ? (
          <div className="h-full flex flex-col items-center px-4">
            <div className="w-full flex justify-center mt-10">
              <img
                src={rcLogo}
                alt=""
                className="w-48 md:w-80 md:h-80 object-contain drop-shadow-xl"
                aria-hidden="true"
              />
            </div>
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                  Rough Consensus
                </h1>
                <p className="text-xl font-medium text-blue-100 italic">
                  Where great minds don't think alike
                </p>
              </div>
              <div className="mt-12 max-w-md mx-auto my-auto">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 ring-1 ring-white/20 shadow-xl">
                  <GitHubLogin />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 py-4">
            {joinError && (
              <p role="alert" className="mb-4 text-red-700">
                {joinError}
              </p>
            )}
            <p className="text-md font-medium italic text-gray-800 mb-2 text-center">
              Where great minds don't think alike
            </p>
            <div className="max-w-7xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="space-y-3 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                    <p className="text-sm text-gray-600 font-medium">
                      Loading debates...
                    </p>
                  </div>
                </div>
              ) : debates.length === 0 ? (
                <div className="text-center py-16">
                  <div className="max-w-md mx-auto space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      No Debates Yet
                    </h2>
                    <p className="text-gray-600">
                      Be the first to start a meaningful discussion.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {ongoingDebates.length > 0 && (
                    <DebateList
                      title="Ongoing Debates"
                      debates={ongoingDebates}
                      emptyMessage="No ongoing debates at the moment."
                      status="ongoing"
                    />
                  )}

                  {scheduledDebates.length > 0 && (
                    <DebateList
                      title="Upcoming Debates"
                      debates={scheduledDebates}
                      emptyMessage="No upcoming debates scheduled."
                      status="upcoming"
                    />
                  )}

                  {pastDebates.length > 0 && (
                    <DebateList
                      title="Past Debates"
                      debates={pastDebates}
                      emptyMessage="No past debates available."
                      status="past"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
