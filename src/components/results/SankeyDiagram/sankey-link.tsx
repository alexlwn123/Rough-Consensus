import type React from "react";
import { motion } from "framer-motion";
import type { SankeyLinkType } from "../../../types/sankey";

interface SankeyLinkProps {
  link: SankeyLinkType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  path: any; // d3 path generator
  color: string;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: (event: React.MouseEvent) => void;
}

export const SankeyLink: React.FC<SankeyLinkProps> = ({
  link,
  path,
  color,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
  onClick,
}) => {
  // Make sure we have a valid path
  const linkPath = path(link) || "";

  // Animation variants
  const pathVariants = {
    normal: {
      strokeOpacity: 0.6,
      stroke: color,
      filter: "drop-shadow(0px 0px 0px rgba(0, 0, 0, 0))",
    },
    highlighted: {
      strokeOpacity: 0.9,
      stroke: color,
      filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3))",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.2,
      },
    },
  };

  return (
    <motion.path
      d={linkPath}
      strokeWidth={Math.max(1, link.width || 1)}
      fill="none"
      cursor="pointer"
      initial="normal"
      animate={isHighlighted ? "highlighted" : "normal"}
      variants={pathVariants}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ touchAction: "none" }}
    />
  );
};
