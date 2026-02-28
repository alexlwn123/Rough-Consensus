import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDebate } from "../../context/DebateContext";
import Header from "../layout/Header";
import VotingSection from "../voting/VotingSection";
import ResultsPanel from "../results/ResultsPanel";
import Footer from "../layout/Footer";
import { getPhaseDisplay } from "../../lib/utils";
import DebateInfoPanel from "./DebateInfoPanel";

const DebatePageContent: React.FC<{ debateId: string }> = ({ debateId }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { debate, loading, userVote } = useDebate();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!currentUser && debate?.currentPhase !== "finished") {
    return <Navigate to="/" />;
  }

  if (!debateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-gray-800 mb-2">Debate Not Found</h2>
          <p className="text-gray-600">
            The requested debate could not be found.
          </p>
        </div>
      </div>
    );
  }

  const phase = getPhaseDisplay(debate?.currentPhase ?? null);

  const hideVotingSection =
    !currentUser ||
    debate?.currentPhase === "scheduled" ||
    (debate?.currentPhase === "finished" &&
      !(userVote?.pre_vote || userVote?.post_vote));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={debate?.title ?? ""} debateTitle={phase} />

      <DebateInfoPanel />

      <div className="container mx-auto px-4 py-8">
        {!hideVotingSection && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <VotingSection phase="pre" />
            <VotingSection phase="post" />
          </div>
        )}

        <ResultsPanel />
      </div>
      <Footer />
    </div>
  );
};

export default DebatePageContent;
