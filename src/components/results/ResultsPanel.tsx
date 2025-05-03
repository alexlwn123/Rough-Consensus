import React, { useRef } from "react";
import { useDebate } from "../../context/DebateContext";
import { BarChart, Activity } from "lucide-react";
import PreDebateResults from "./PreDebateResults";
import PostDebateResults from "./PostDebateResults";
import OpinionShift from "./OpinionShift";
import { DebateFlow } from "./SankeyDiagram/debate-flow";
import { dummyDebateResult } from "../../utils/dummydata";
import { motion } from "framer-motion";
const ResultsPanel: React.FC = () => {
  const { voteCounts, sankeyData, debate } = useDebate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total votes for each phase
  const preTotalVotes =
    (voteCounts?.pre?.for ?? 0) +
    (voteCounts?.pre?.against ?? 0) +
    (voteCounts?.pre?.undecided ?? 0);
  const postTotalVotes =
    (voteCounts?.post?.for ?? 0) +
    (voteCounts?.post?.against ?? 0) +
    (voteCounts?.post?.undecided ?? 0);

  const isFinished = debate?.currentPhase === "finished";

  if (!isFinished) {
    return (
      <div
        ref={containerRef}
        className="border rounded-xl p-6 bg-white shadow-md"
      >
        <p className="text-gray-700 text-center">
          Results will appear here once the debate is finished.
        </p>
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      className="border rounded-xl p-6 bg-white shadow-md"
    >
      <div className="flex items-center mb-6">
        <Activity className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Results Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <PreDebateResults
          preVotes={voteCounts?.pre ?? null}
          preTotalVotes={preTotalVotes}
        />
        <PostDebateResults
          postVotes={voteCounts?.post ?? null}
          postTotalVotes={postTotalVotes}
        />
        <OpinionShift
          preTotalVotes={preTotalVotes}
          postTotalVotes={postTotalVotes}
        />
      </div>

      {sankeyData ? (
        <motion.div
        // initial={{ opacity: 0, y: -20 }}
        // animate={{ opacity: 1, y: 0 }}
        // transition={{ duration: 0.5 }}
        >
          <DebateFlow debateResults={dummyDebateResult} />
        </motion.div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
          <p className="text-blue-800 text-center">
            <BarChart className="h-5 w-5 inline-block mr-1 mb-1" />
            The Sankey diagram will appear here once users have voted in both
            phases.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
