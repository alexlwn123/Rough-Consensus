import React from "react";
import { useDebate } from "../../context/DebateContext";
import { calculatePercentage } from "../../lib/utils";

type OpinionShiftProps = {
  preTotalVotes: number;
  postTotalVotes: number;
};

const OpinionShift: React.FC<OpinionShiftProps> = ({
  preTotalVotes,
  postTotalVotes,
}) => {
  const { voteCounts } = useDebate();
  // Determine if we have pre and post votes to compare
  const hasCompleteData = preTotalVotes > 0 && postTotalVotes > 0;

  // Calculate opinion shift
  const calculateOpinionShift = () => {
    if (!hasCompleteData) return { for: 0, against: 0, undecided: 0 };

    return {
      for:
        calculatePercentage(voteCounts?.post?.for ?? 0, postTotalVotes) -
        calculatePercentage(voteCounts?.pre?.for ?? 0, preTotalVotes),
      against:
        calculatePercentage(voteCounts?.post?.against ?? 0, postTotalVotes) -
        calculatePercentage(voteCounts?.pre?.against ?? 0, preTotalVotes),
      undecided:
        calculatePercentage(voteCounts?.post?.undecided ?? 0, postTotalVotes) -
        calculatePercentage(voteCounts?.pre?.undecided ?? 0, preTotalVotes),
    };
  };

  const shifts = calculateOpinionShift();

  // Determine debate winner
  const determineWinner = () => {
    if (!hasCompleteData) return null;

    if (shifts.for > 0 && shifts.for >= shifts.against) {
      return "for";
    } else if (shifts.against > 0 && shifts.against > shifts.for) {
      return "against";
    } else if (shifts.for === shifts.against) {
      return "tie";
    } else {
      return "undecided";
    }
  };

  const winner = determineWinner();
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium text-gray-700 mb-2">Opinion Shift</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-green-700">For:</span>
          <span
            className={`font-medium ${
              shifts.for > 0
                ? "text-green-600"
                : shifts.for < 0
                  ? "text-red-600"
                  : ""
            }`}
          >
            {shifts.for > 0 ? "+" : ""}
            {shifts.for}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-700">Against:</span>
          <span
            className={`font-medium ${
              shifts.against > 0
                ? "text-green-600"
                : shifts.against < 0
                  ? "text-red-600"
                  : ""
            }`}
          >
            {shifts.against > 0 ? "+" : ""}
            {shifts.against}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-700">Undecided:</span>
          <span
            className={`font-medium ${
              shifts.undecided > 0
                ? "text-green-600"
                : shifts.undecided < 0
                  ? "text-red-600"
                  : ""
            }`}
          >
            {shifts.undecided > 0 ? "+" : ""}
            {shifts.undecided}%
          </span>
        </div>
        <div className="pt-2 border-t border-gray-200 mt-2">
          <div className="flex justify-between font-medium">
            <span>Winner:</span>
            <span
              className={
                winner === "for"
                  ? "text-green-700"
                  : winner === "against"
                    ? "text-red-700"
                    : winner === "tie"
                      ? "text-blue-700"
                      : "text-gray-700"
              }
            >
              {winner === "for"
                ? "For the Motion"
                : winner === "against"
                  ? "Against the Motion"
                  : winner === "tie"
                    ? "Tie"
                    : "Not Enough Data"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpinionShift;
