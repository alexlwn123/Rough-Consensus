import React, { useState, useEffect, useRef } from "react";
import { useDebate } from "../../context/DebateContext";
import { BarChart, Activity } from "lucide-react";
import PreDebateResults from "./PreDebateResults";
import PostDebateResults from "./PostDebateResults";
import OpinionShift from "./OpinionShift";
import SankeySection from "./SankeySection";

const ResultsPanel: React.FC = () => {
  const { voteCounts, sankeyData, debate } = useDebate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Use ResizeObserver to track container width
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    };
    const observer = new window.ResizeObserver(handleResize);
    observer.observe(node);
    // Set initial width
    setContainerWidth(node.offsetWidth);
    return () => observer.disconnect();
  }, []);

  // Calculate chart dimensions based on container size
  const getChartDimensions = () => {
    if (containerWidth < 400) {
      return { width: Math.max(containerWidth, 200), height: 250 };
    } else if (containerWidth < 900) {
      return { width: containerWidth - 40, height: 300 };
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
          calculatePercentage={calculatePercentage}
        />
        <PostDebateResults
          postVotes={voteCounts?.post ?? null}
          postTotalVotes={postTotalVotes}
          calculatePercentage={calculatePercentage}
        />
        <OpinionShift shifts={shifts} winner={winner} />
      </div>

      {sankeyData?.links &&
      sankeyData.links.some((link) => link?.value && link.value > 0) ? (
        <div className="mt-8">
          <SankeySection
            sankeyData={sankeyData}
            width={width}
            height={height}
          />
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
