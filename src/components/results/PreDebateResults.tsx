import React from "react";

type PreDebateResultsProps = {
  preVotes: {
    for: number | null;
    against: number | null;
    undecided: number | null;
  } | null;
  preTotalVotes: number;
  calculatePercentage: (count: number, total: number) => number;
};

const PreDebateResults: React.FC<PreDebateResultsProps> = ({
  preVotes,
  preTotalVotes,
  calculatePercentage,
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-medium text-gray-700 mb-2">Pre-Debate</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-green-700">For:</span>
        <span className="font-medium">
          {preVotes?.for ?? 0} votes (
          {calculatePercentage(preVotes?.for ?? 0, preTotalVotes)}%)
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-red-700">Against:</span>
        <span className="font-medium">
          {preVotes?.against ?? 0} votes (
          {calculatePercentage(preVotes?.against ?? 0, preTotalVotes)}%)
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-700">Undecided:</span>
        <span className="font-medium">
          {preVotes?.undecided ?? 0} votes (
          {calculatePercentage(preVotes?.undecided ?? 0, preTotalVotes)}%)
        </span>
      </div>
      <div className="pt-2 border-t border-gray-200 mt-2">
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>{preTotalVotes} votes</span>
        </div>
      </div>
    </div>
  </div>
);

export default PreDebateResults;
