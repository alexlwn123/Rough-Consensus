import React from "react";
import SankeyDiagram from "./SankeyDiagram";
import { BarChart } from "lucide-react";
import { DbSankeyData } from "../../types";

type SankeySectionProps = {
  sankeyData: DbSankeyData;
  width: number;
  height: number;
};

const SankeySection: React.FC<SankeySectionProps> = ({
  sankeyData,
  width,
  height,
}) => {
  const hasLinks =
    sankeyData?.links &&
    sankeyData.links.some((link) => link?.value && link.value > 0);
  if (hasLinks) {
    return (
      <div className="mt-8">
        <SankeyDiagram data={sankeyData} width={width} height={height} />
      </div>
    );
  }
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
      <p className="text-blue-800 text-center">
        <BarChart className="h-5 w-5 inline-block mr-1 mb-1" />
        The Sankey diagram will appear here once users have voted in both
        phases.
      </p>
    </div>
  );
};

export default SankeySection;
