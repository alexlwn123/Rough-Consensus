import type React from "react";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface SankeyTooltipProps {
  content: React.ReactNode;
  x: number;
  y: number;
  onClose: () => void;
}

export const SankeyTooltip: React.FC<SankeyTooltipProps> = ({
  content,
  x,
  y,
  onClose,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Position the tooltip
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;

      // Position tooltip centered above the point that was clicked
      let posX = x - tooltipRect.width / 2;
      let posY = y - tooltipRect.height - 10;

      // Make sure tooltip stays within viewport bounds
      if (posX < 10) posX = 10;
      if (posX + tooltipRect.width > windowWidth - 10) {
        posX = windowWidth - tooltipRect.width - 10;
      }

      // If tooltip would go off the top, position it below the point
      if (posY < 10) {
        posY = y + 10;
      }

      tooltipRef.current.style.left = `${posX}px`;
      tooltipRef.current.style.top = `${posY}px`;
    }
  }, [x, y]);

  // Stop propagation to prevent closing when clicking inside tooltip
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      ref={tooltipRef}
      className="fixed z-50 p-3 bg-white rounded-md shadow-lg border border-gray-200 min-w-[150px] max-w-[250px]"
      onClick={handleClick}
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.2,
      }}
    >
      <motion.button
        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100"
        onClick={onClose}
        whileHover={{ scale: 1.2, backgroundColor: "#f3f4f6" }}
        whileTap={{ scale: 0.9 }}
      >
        ×
      </motion.button>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
};
