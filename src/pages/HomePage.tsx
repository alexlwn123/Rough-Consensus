import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import GitHubLogin from "../components/auth/GitHubLogin";
import DebateList from "../components/debates/DebateList";
import { Debate } from "../types";
import { fetchDebates, registerDebateAccess } from "../services/supabase";
import { coerceDebateListFromDb } from "../lib/utils";
import bitcoinChatImage from "../assets/bitcoinchat.png";
import { useLocation, useNavigate } from "react-router-dom";
import { storeActiveDebateId, getActiveDebateId } from "../utils/storage";

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for debate ID in URL params, store it, and register access on the server
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const debateId = searchParams.get("id");

    if (!debateId) {
      console.log("no debateId");
      return;
    }

    // Store the debate ID in local storage
    storeActiveDebateId(debateId);

    if (!currentUser) {
      console.log("no current user");
      return;
    }

    // Register access on the server if user is logged in
    registerDebateAccess(debateId).then((success) => {
      if (!success) {
        console.error("Failed to register debate access");
        return;
      }
      // Remove the 'id' param from the URL, keep other params
      const newParams = new URLSearchParams(location.search);
      newParams.delete("id");
      const newSearch = newParams.toString();
      navigate(
        {
          pathname: location.pathname,
          search: newSearch ? `?${newSearch}` : "",
        },
        { replace: true }
      );
    });
  }, [location, currentUser, navigate]);

  useEffect(() => {
    // Get the active debate ID from storage
    const storedDebateId = getActiveDebateId();

    // If we have a stored debate ID and the user is logged in, ensure access is registered
    if (storedDebateId && currentUser) {
      console.log("registering debate access", storedDebateId);
      registerDebateAccess(storedDebateId).catch((err) => {
        console.error("Error registering debate access:", err);
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Fetch debates (RLS will automatically filter based on user's access)
        const data = await fetchDebates();

        // Map database column names to our interface names
        const mappedDebates = coerceDebateListFromDb(data || []);

        setDebates(mappedDebates);
      } catch (error) {
        console.error("Error fetching debates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if user is logged in
    if (currentUser) {
      fetch();
    } else {
      setIsLoading(false);
      setDebates([]);
    }

    // Re-fetch debates when the user changes
  }, [currentUser]);

  // Get ongoing debates (now filtered on server if needed)
  const ongoingDebates = debates.filter(
    (debate) =>
      debate.currentPhase === "pre" ||
      debate.currentPhase === "post" ||
      debate.currentPhase === "ongoing"
  );

  // Get scheduled debates (now filtered on server if needed)
  const scheduledDebates = debates.filter(
    (debate) => debate.currentPhase === "scheduled"
  );

  // Get past debates (always shown)
  const pastDebates = debates.filter(
    (debate) => debate.currentPhase === "finished"
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
                src={bitcoinChatImage}
                alt="Bitcoin Chat"
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
};

export default HomePage;
