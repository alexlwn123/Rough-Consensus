import React from "react";

type PostDebateResultsProps = {
  postVotes: {
    for: number | null;
    against: number | null;
    undecided: number | null;
  } | null;
  postTotalVotes: number;
  calculatePercentage: (count: number, total: number) => number;
};

const PostDebateResults: React.FC<PostDebateResultsProps> = ({
  postVotes,
  postTotalVotes,
  calculatePercentage,
}) => (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="font-medium text-gray-700 mb-2">Post-Debate</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-green-700">For:</span>
        <span className="font-medium">
          {postVotes?.for ?? 0} votes (
          {calculatePercentage(postVotes?.for ?? 0, postTotalVotes)}%)
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-red-700">Against:</span>
        <span className="font-medium">
          {postVotes?.against ?? 0} votes (
          {calculatePercentage(postVotes?.against ?? 0, postTotalVotes)}%)
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-700">Undecided:</span>
        <span className="font-medium">
          {postVotes?.undecided ?? 0} votes (
          {calculatePercentage(postVotes?.undecided ?? 0, postTotalVotes)}%)
        </span>
      </div>
      <div className="pt-2 border-t border-gray-200 mt-2">
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>{postTotalVotes} votes</span>
        </div>
      </div>
    </div>
  </div>
);

export default PostDebateResults;
