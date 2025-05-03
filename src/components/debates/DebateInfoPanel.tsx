import React from "react";
import { useDebate } from "../../context/DebateContext";

const getPhaseBadge = (phase: string | null | undefined) => {
  if (!phase) return null;
  const phaseMap: Record<string, { label: string; color: string }> = {
    scheduled: { label: "Scheduled", color: "bg-gray-300 text-gray-800" },
    open: { label: "Open", color: "bg-blue-100 text-blue-800" },
    voting: { label: "Voting", color: "bg-yellow-100 text-yellow-800" },
    finished: { label: "Finished", color: "bg-green-100 text-green-800" },
    pre: { label: "Pre-Debate", color: "bg-yellow-100 text-yellow-800" },
    post: { label: "Post-Debate", color: "bg-blue-100 text-blue-800" },
    ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-800" },
  };
  const { label, color } = phaseMap[phase] || {
    label: phase,
    color: "bg-gray-200 text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}
      aria-label={`Debate phase: ${label}`}
    >
      <span className="mr-1" aria-hidden="true">
        ℹ️
      </span>
      {label}
    </span>
  );
};

const getWinnerBadge = (forVotes: number, againstVotes: number) => {
  if (forVotes > againstVotes) {
    return (
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white mb-4"
        aria-label="Winner: Pro Side"
      >
        <span className="mr-1" aria-hidden="true">
          🏆
        </span>
        Winner: Pro Side
      </span>
    );
  }
  if (againstVotes > forVotes) {
    return (
      <span
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white mb-4"
        aria-label="Winner: Con Side"
      >
        <span className="mr-1" aria-hidden="true">
          🏆
        </span>
        Winner: Con Side
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-400 text-white mb-4"
      aria-label="Result: Tie"
    >
      <span className="mr-1" aria-hidden="true">
        🤝
      </span>
      It's a tie!
    </span>
  );
};

const DebateInfoPanel: React.FC = () => {
  const { debate, voteSummary } = useDebate();

  const showWinner = debate?.currentPhase === "finished" && voteSummary;

  if (!debate) return null;

  return (
    <section
      className="container mx-auto px-4 py-6 mb-8 bg-white rounded-xl shadow flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      aria-label="Debate Information"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          {getPhaseBadge(debate.currentPhase)}
          {debate.startTime && (
            <span className="flex items-center text-sm text-gray-500 ml-2">
              <span className="mr-1" aria-hidden="true">
                📅
              </span>
              {new Date(debate.startTime).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}
        </div>
        {showWinner &&
          getWinnerBadge(voteSummary.post.for, voteSummary.post.against)}
        <h1
          className="text-2xl font-bold text-gray-900 mb-1"
          tabIndex={0}
          aria-label="Debate motion"
        >
          {debate.motion || debate.title}
        </h1>
        {debate.description && (
          <p
            className="text-gray-700 text-base mb-2"
            tabIndex={0}
            aria-label="Debate description"
          >
            {debate.description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="flex-1 bg-blue-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-blue-700 uppercase mb-1">
              Pro Side
            </div>
            <div
              className="text-gray-900 font-medium"
              tabIndex={0}
              aria-label="Pro side info"
            >
              {debate.proDescription || "N/A"}
            </div>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg p-3">
            <div className="text-xs font-semibold text-red-700 uppercase mb-1">
              Con Side
            </div>
            <div
              className="text-gray-900 font-medium"
              tabIndex={0}
              aria-label="Con side info"
            >
              {debate.conDescription || "N/A"}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:ml-8 min-w-[200px]">
        {/* Add more details here if available, e.g. participants */}
      </div>
    </section>
  );
};

export default DebateInfoPanel;
