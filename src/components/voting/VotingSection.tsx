import React, { useState } from "react";
import { VoteOption } from "../../types";
import VoteCard from "../ui/VoteCard";
import { useDebate } from "../../context/DebateContext";

interface VotingSectionProps {
  phase: "pre" | "post";
}

const getVote = (vote: unknown): VoteOption | null => {
  if (
    vote &&
    typeof vote === "object" &&
    "option" in vote &&
    typeof vote.option === "string"
  ) {
    return vote.option as VoteOption;
  }
  return null;
};

const VotingSection: React.FC<VotingSectionProps> = ({ phase }) => {
  const { debate, handleVote, userVote, votingPending, connected } =
    useDebate();
  const [error, setError] = useState<string | null>(null);

  // Check if this phase is active
  const isActivePhase = debate?.currentPhase === phase;
  const didPreVote = !!userVote?.pre_vote;
  const canVote =
    isActivePhase &&
    !votingPending &&
    connected !== false &&
    (phase === "pre" || didPreVote);

  // Get user's vote for this phase
  const currentVote = getVote(
    phase === "pre" ? userVote?.pre_vote : userVote?.post_vote,
  );

  const handleVoteSelection = async (option: VoteOption) => {
    setError(null);
    try {
      await handleVote(option);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Your vote could not be recorded. Please try again.",
      );
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

      {error && (
        <p role="alert" className="mb-3 text-red-700">
          {error}
        </p>
      )}
      {connected === false && (
        <p role="status" className="mb-3 text-amber-700">
          Reconnecting. Wait for your connection before voting.
        </p>
      )}
      {votingPending && (
        <p role="status" className="mb-3 text-blue-700">
          Submitting your vote…
        </p>
      )}
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
