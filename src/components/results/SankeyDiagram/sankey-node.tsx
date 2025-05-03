import type React from "react";
import { motion } from "framer-motion";
import type { SankeyNodeType } from "../../../types/sankey";

interface SankeyNodeProps {
  node: SankeyNodeType;
  color: string;
  isHighlighted: boolean;
  showLabel?: boolean;
  showPercentage?: boolean;
  percentage?: number;
  isMobile?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const SankeyNode: React.FC<SankeyNodeProps> = ({
  node,
  color,
  isHighlighted,
  showLabel = false,
  showPercentage = false,
  percentage = 0,
  isMobile = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Position label based on column (left or right side)
  const isLeftColumn = node.column === 0;
  const labelOffset = isMobile ? 6 : 8;

  // Calculate label position to ensure it's not cut off
  const labelX = isLeftColumn
    ? (node.x0 ?? 0) - labelOffset
    : (node.x1 ?? 0) + labelOffset;

  // Animation variants
  const rectVariants = {
    normal: {
      fill: color,
      opacity: 0.85,
      stroke: color,
      strokeWidth: 0,
    },
    highlighted: {
      fill: color,
      opacity: 1,
      stroke: "#000",
      strokeWidth: 2,
      scale: 1.02,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  const textVariants = {
    normal: {
      fontWeight: 400,
      scale: 1,
    },
    highlighted: {
      fontWeight: 700,
      scale: 1.05,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
  };

  const height = Math.max(1, (node.y1 ?? 0) - (node.y0 ?? 0));
  const width = Math.max(1, (node.x1 ?? 0) - (node.x0 ?? 0));
  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <motion.rect
        x={node.x0}
        y={node.y0}
        width={width}
        height={height}
        rx={4}
        ry={4}
        initial="normal"
        animate={isHighlighted ? "highlighted" : "normal"}
        variants={rectVariants}
        style={{ cursor: "pointer" }}
      />

      {showLabel && (
        <motion.text
          x={labelX}
          y={(node.y0 ?? 0) + height / 2}
          textAnchor={isLeftColumn ? "end" : "start"}
          fontSize={isMobile ? 10 : 12}
          fill="#333"
          pointerEvents="none"
          initial="normal"
          animate={isHighlighted ? "highlighted" : "normal"}
          variants={textVariants}
        >
          {node.name}
        </motion.text>
      )}

      {showPercentage && height > 25 && (
        <motion.text
          x={(node.x0 ?? 0) + 3}
          // y={(node.y0 ?? 0) + (node.y1 ?? 0) / 2}
          // y={node.y0 ?? 0 + height / 2}
          y={(node.y0 ?? 0) + height / 2}
          dy="0.35em"
          // textAnchor="middle"
          fontSize={isMobile ? 10 : 12}
          fontWeight="bold"
          fill="#fff"
          pointerEvents="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {percentage}%
        </motion.text>
      )}
    </g>
  );
};
