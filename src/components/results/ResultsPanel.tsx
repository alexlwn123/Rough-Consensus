import React, { useState, useEffect } from "react";
import { useDebate } from "../../context/useDebate";
import SankeyDiagram from "./SankeyDiagram";
import { BarChart, Activity } from "lucide-react";

const ResultsPanel: React.FC = () => {
  const { voteCounts, sankeyData, debate } = useDebate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize for responsive chart
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate chart dimensions based on window size
  const getChartDimensions = () => {
    if (windowWidth < 640) {
      return { width: windowWidth - 40, height: 250 };
    } else if (windowWidth < 1024) {
      return { width: windowWidth - 80, height: 300 };
    } else {
      return { width: 800, height: 400 };
    }
  };

  const { width, height } = getChartDimensions();

  // Calculate total votes for each phase
  const preTotalVotes =
    (voteCounts?.pre?.for ?? 0) +
    (voteCounts?.pre?.against ?? 0) +
    (voteCounts?.pre?.undecided ?? 0);
  const postTotalVotes =
    (voteCounts?.post?.for ?? 0) +
    (voteCounts?.post?.against ?? 0) +
    (voteCounts?.post?.undecided ?? 0);

  // Calculate percentage for vote options
  const calculatePercentage = (count: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

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

  const isFinished = debate?.currentPhase === "finished";

  if (!isFinished) {
    return (
      <div className="border rounded-xl p-6 bg-white shadow-md">
        <p className="text-gray-700 text-center">
          Results will appear here once the debate is finished.
        </p>
      </div>
    );
  }
  return (
    <div className="border rounded-xl p-6 bg-white shadow-md">
      <div className="flex items-center mb-6">
        <Activity className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Results Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">Pre-Debate</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-700">For:</span>
              <span className="font-medium">
                {voteCounts?.pre?.for} votes (
                {calculatePercentage(voteCounts?.pre?.for ?? 0, preTotalVotes)}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Against:</span>
              <span className="font-medium">
                {voteCounts?.pre?.against} votes (
                {calculatePercentage(
                  voteCounts?.pre?.against ?? 0,
                  preTotalVotes
                )}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Undecided:</span>
              <span className="font-medium">
                {voteCounts?.pre?.undecided} votes (
                {calculatePercentage(
                  voteCounts?.pre?.undecided ?? 0,
                  preTotalVotes
                )}
                %)
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

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">Post-Debate</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-700">For:</span>
              <span className="font-medium">
                {voteCounts?.post?.for} votes (
                {calculatePercentage(
                  voteCounts?.post?.for ?? 0,
                  postTotalVotes
                )}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-700">Against:</span>
              <span className="font-medium">
                {voteCounts?.post?.against} votes (
                {calculatePercentage(
                  voteCounts?.post?.against ?? 0,
                  postTotalVotes
                )}
                %)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Undecided:</span>
              <span className="font-medium">
                {voteCounts?.post?.undecided} votes (
                {calculatePercentage(
                  voteCounts?.post?.undecided ?? 0,
                  postTotalVotes
                )}
                %)
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
      </div>

      {sankeyData?.links &&
      sankeyData.links.some((link) => link?.value && link.value > 0) ? (
        <div className="mt-8">
          <SankeyDiagram data={sankeyData} width={width} height={height} />
        </div>
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
