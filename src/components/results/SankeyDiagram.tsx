import React from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { DbLink, DbNode, DbSankeyData } from "../../types";

interface SankeyDiagramProps {
  data: DbSankeyData;
  width: number;
  height: number;
}

const COLORS: Record<string, string> = {
  "Pre: For": "#22c55e", // Green
  "Pre: Against": "#ef4444", // Red
  "Pre: Undecided": "#9ca3af", // Gray
  "Post: For": "#22c55e", // Green
  "Post: Against": "#ef4444", // Red
  "Post: Undecided": "#9ca3af", // Gray
};

type CustomNodeProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
};

type CustomLinkProps = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  width: number;
  source: number;
  target: number;
  value: number;
};

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  data,
  width,
  height,
}) => {
  // Defensive: fallback to empty arrays if null
  const nodes = (data?.nodes ?? []).map((node) => ({
    name: node.name ?? "",
  })) satisfies DbNode[];

  const links = (data?.links ?? []).map((link) => ({
    source: link.source ?? 0,
    target: link.target ?? 0,
    value: link.value ?? 0,
  })) satisfies DbLink[];

  // Custom node rendering
  const renderNode = (props: CustomNodeProps) => {
    const {
      x,
      y,
      width: nodeWidth,
      height: nodeHeight,
      name,
      value,
      ...rest
    } = props;
    return (
      <g
        tabIndex={0}
        aria-label={`${name}: ${value} votes`}
        role="graphics-symbol"
        {...rest}
      >
        <rect
          x={x}
          y={y}
          width={nodeWidth}
          height={nodeHeight}
          fill={COLORS[name] || "#aaa"}
          style={{ transition: "opacity 0.3s" }}
        />
        <title>{`${name}: ${value} votes`}</title>
        <text
          x={x + nodeWidth + 6}
          y={y + nodeHeight / 2}
          dy="0.35em"
          fontSize={10}
          fontFamily="sans-serif"
          fill="currentColor"
          textAnchor="start"
        >
          {`${name} (${value})`}
        </text>
      </g>
    );
  };

  // Custom link rendering
  const renderLink = (props: CustomLinkProps) => {
    const {
      sourceX,
      sourceY,
      targetX,
      targetY,
      width: linkWidth,
      source,
      target,
      value,
      ...rest
    } = props;
    const path = `M${sourceX},${sourceY}C${(sourceX + targetX) / 2},${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`;
    return (
      <g
        tabIndex={0}
        aria-label={`${nodes[source]?.name} → ${nodes[target]?.name}: ${value} votes`}
        role="graphics-symbol"
        {...rest}
      >
        <path
          d={path}
          stroke="#aaa"
          strokeWidth={Math.max(1, linkWidth)}
          strokeOpacity={0.5}
          fill="none"
          style={{ transition: "stroke-opacity 0.3s" }}
        />
        <title>{`${nodes[source]?.name} → ${nodes[target]?.name}: ${value} votes`}</title>
      </g>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Vote Movement Analysis
      </h3>
      <ResponsiveContainer width={width} height={height}>
        <Sankey
          width={width}
          height={height}
          data={{ nodes, links }}
          nodePadding={10}
          nodeWidth={15}
          linkCurvature={0.5}
          node={renderNode}
          link={renderLink}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const { source, target, value } = payload[0].payload;
              return (
                <div className="bg-white p-2 rounded shadow text-xs text-gray-800">
                  <div>
                    {nodes[source]?.name} → {nodes[target]?.name}:{" "}
                    <b>{value}</b> votes
                  </div>
                </div>
              );
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

export default SankeyDiagram;
