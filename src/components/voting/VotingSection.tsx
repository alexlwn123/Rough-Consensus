import React from "react";
import { VoteOption } from "../../types";
import VoteCard from "../ui/VoteCard";
import { useDebate } from "../../context/DebateContext";

interface VotingSectionProps {
  phase: "pre" | "post";
}

const VotingSection: React.FC<VotingSectionProps> = ({ phase }) => {
  const { debate, handleVote, userVote } = useDebate();

  // Check if this phase is active
  const isActivePhase = debate?.currentPhase === phase;
  const didPreVote = !!userVote?.pre_vote;
  const canVote = isActivePhase && (phase === "pre" || didPreVote);

  // Get user's vote for this phase
  const currentVote =
    phase === "pre" ? userVote?.pre_vote : userVote?.post_vote;

  const handleVoteSelection = async (option: VoteOption) => {
    try {
      await handleVote(option);
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const getPhaseLabel = () => {
    return phase === "pre" ? "Pre-Debate Vote" : "Post-Debate Vote";
  };

  const getPhaseDescription = () => {
    return phase === "pre"
      ? "Cast your vote before the debate begins"
      : "After hearing the arguments, what is your position now?";
  };

  return (
    <div
      className={`border rounded-xl p-6 transition-all duration-300 ${canVote ? "bg-white shadow-md" : "bg-gray-50"}`}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{getPhaseLabel()}</h2>
        <p className="text-gray-600 mt-1">{getPhaseDescription()}</p>
      </div>

      <div className="space-y-4">
        <VoteCard
          option="for"
          label="For the Motion"
          description="I support the proposition being debated"
          isSelected={currentVote === "for"}
          onVote={handleVoteSelection}
          disabled={!canVote}
        />

        <VoteCard
          option="against"
          label="Against the Motion"
          description="I oppose the proposition being debated"
          isSelected={currentVote === "against"}
          onVote={handleVoteSelection}
          disabled={!canVote}
        />

        <VoteCard
          option="undecided"
          label="Undecided"
          description="I am neutral or undecided on this matter"
          isSelected={currentVote === "undecided"}
          onVote={handleVoteSelection}
          disabled={!canVote}
        />
      </div>

      {!isActivePhase && phase === "pre" && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-blue-800 text-sm">
            The pre-debate voting phase is now closed.
          </p>
        </div>
      )}

      {phase === "post" && (!isActivePhase || !didPreVote) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-blue-800 text-sm">
            {!isActivePhase
              ? "The post-debate voting phase is now closed."
              : "You did not vote in the pre-debate phase, so you cannot vote in the post-debate phase."}
          </p>
        </div>
      )}

      {isActivePhase && currentVote && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
          <p className="text-green-800 text-sm">
            Your vote has been recorded. You can change it at any time during
            this phase.
          </p>
        </div>
      )}
    </div>
  );
};

export default VotingSection;
