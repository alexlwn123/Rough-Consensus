import type React from "react";
import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { motion, AnimatePresence } from "framer-motion";
import { SankeyNode } from "./sankey-node";
import { SankeyLink } from "./sankey-link";
import { SankeyTooltip } from "./sankey-tooltip";
import type { SankeyNodeType, SankeyLinkType } from "../../../types/sankey";
import { DbDebateResult } from "../../../types";

export const DebateFlow: React.FC<{
  debateResults: DbDebateResult;
  title?: string;
  className?: string;
}> = ({ debateResults, title = "Audience Opinion Shift", className = "" }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    content: React.ReactNode;
    x: number;
    y: number;
  } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Create a responsive container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = isMobile ? 500 : 400;
        setDimensions({
          width: containerWidth,
          height: containerHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Convert debate results to Sankey data
  const data = useMemo(() => {
    const { before, after } = debateResults;

    // Create nodes
    const nodes = [
      { id: "pro-before", name: "Pro", value: before?.pro ?? 0, column: 0 },
      {
        id: "against-before",
        name: "Against",
        value: before?.against ?? 0,
        column: 0,
      },
      {
        id: "undecided-before",
        name: "Undecided",
        value: before?.undecided ?? 0,
        column: 0,
      },
      { id: "pro-after", name: "Pro", value: after?.pro ?? 0, column: 1 },
      {
        id: "against-after",
        name: "Against",
        value: after?.against ?? 0,
        column: 1,
      },
      {
        id: "undecided-after",
        name: "Undecided",
        value: after?.undecided ?? 0,
        column: 1,
      },
    ];

    // Create links
    const links = [
      {
        source: "pro-before",
        target: "pro-after",
        value: debateResults.flows?.protopro,
      },
      {
        source: "pro-before",
        target: "against-after",
        value: debateResults.flows?.protoagainst,
      },
      {
        source: "pro-before",
        target: "undecided-after",
        value: debateResults.flows?.protoundecided,
      },

      {
        source: "against-before",
        target: "pro-after",
        value: debateResults.flows?.againsttopro,
      },
      {
        source: "against-before",
        target: "against-after",
        value: debateResults.flows?.againsttoagainst,
      },
      {
        source: "against-before",
        target: "undecided-after",
        value: debateResults.flows?.againsttoundecided,
      },

      {
        source: "undecided-before",
        target: "pro-after",
        value: debateResults.flows?.undecidedtopro,
      },
      {
        source: "undecided-before",
        target: "against-after",
        value: debateResults.flows?.undecidedtoagainst,
      },
      {
        source: "undecided-before",
        target: "undecided-after",
        value: debateResults.flows?.undecidedtoundecided,
      },
    ].filter((link) => link.value && link.value > 0); // Remove links with zero value

    return { nodes, links };
  }, [debateResults]);

  // Process the data through D3's sankey generator
  const { nodes, links } = useMemo(() => {
    if (!data || !data.nodes || !data.links || data.nodes.length === 0) {
      return { nodes: [], links: [] };
    }

    // Create a map of node IDs to indices
    const nodeMap = new Map(data.nodes.map((node, i) => [node.id, i]));

    // Create a deep copy of the data and convert string IDs to indices
    const processedData = {
      nodes: data.nodes.map((node) => ({ ...node })),
      links: data.links.map(
        (link) =>
          ({
            source: nodeMap.get(link.source) ?? 0,
            target: nodeMap.get(link.target) ?? 0,
            value: link.value ?? 0,
          }) satisfies SankeyLinkType
      ),
    };

    // Calculate margins to ensure labels fit
    const margin = {
      left: isMobile ? 40 : 60,
      right: isMobile ? 40 : 60,
      top: 10,
      bottom: 10,
    };

    const sankeyGenerator = sankey<SankeyNodeType, SankeyLinkType>()
      .nodeWidth(isMobile ? 30 : 40)
      .nodePadding(isMobile ? 8 : 15)
      .extent([
        [margin.left, margin.top],
        [dimensions.width - margin.right, dimensions.height - margin.bottom],
      ]);

    const result = sankeyGenerator(processedData);
    return { nodes: result.nodes, links: result.links };
  }, [data, dimensions, isMobile]);

  // Generate color scale for nodes
  const nodeColorScale = useMemo(() => {
    return d3
      .scaleOrdinal<string>()
      .domain(["pro", "against", "undecided"])
      .range(["#4ade80", "#f87171", "#94a3b8"]);
  }, []);

  // Get color for a node
  const getNodeColor = (nodeId: string) => {
    if (nodeId.includes("pro")) return nodeColorScale("pro");
    if (nodeId.includes("against")) return nodeColorScale("against");
    return nodeColorScale("undecided");
  };

  // Handle node hover
  const handleNodeMouseEnter = (node: SankeyNodeType) => {
    setHoveredNode(node.id);

    // Find all connected links
    const connectedLinks = links.filter(
      (link) =>
        (link.source &&
          typeof link.source === "object" &&
          link.source.id === node.id) ||
        (link.target &&
          typeof link.target === "object" &&
          link.target.id === node.id)
    );

    // Set all connected links as hovered
    connectedLinks.forEach((link) => {
      if (typeof link.source === "object" && typeof link.target === "object") {
        const linkId = `${link.source.id}-${link.target.id}`;
        setHoveredLink(linkId);
      }
    });
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    setHoveredLink(null);
  };

  // Handle node click
  const handleNodeClick = (node: SankeyNodeType, event: React.MouseEvent) => {
    // Calculate total value for percentage
    const totalValue = data.nodes.reduce((sum, n) => {
      if (n.column === node.column) return sum + n.value;
      return sum;
    }, 0);

    const percentage =
      totalValue > 0 ? Math.round((node.value / totalValue) * 100) : 0;

    // Get node position for better tooltip placement
    const nodeX = (node.x0 || 0) + ((node.x1 || 0) - (node.x0 || 0)) / 2;
    const nodeY = (node.y0 || 0) + ((node.y1 || 0) - (node.y0 || 0)) / 2;

    // Convert to screen coordinates
    const rect = svgRef.current?.getBoundingClientRect();
    const screenX = rect ? rect.left + nodeX : event.clientX;
    const screenY = rect ? rect.top + nodeY : event.clientY;

    // Show tooltip with node details
    setTooltipData({
      content: (
        <div>
          <h3 className="font-bold">{node.name}</h3>
          <p className="text-sm">Count: {node.value}</p>
          <p className="text-sm font-medium">{percentage}% of audience</p>
          <p className="text-xs text-gray-500 mt-1">
            {node.column === 0 ? "Before debate" : "After debate"}
          </p>
        </div>
      ),
      x: screenX,
      y: screenY,
    });
  };

  // Handle link hover
  const handleLinkMouseEnter = (link: SankeyLinkType) => {
    if (typeof link.source === "object" && typeof link.target === "object") {
      const linkId = `${link.source.id}-${link.target.id}`;
      setHoveredLink(linkId);
    }
  };

  const handleLinkMouseLeave = () => {
    setHoveredLink(null);
  };

  // Handle link click
  const handleLinkClick = (link: SankeyLinkType, event: React.MouseEvent) => {
    if (typeof link.source !== "object" || typeof link.target !== "object")
      return;

    // Calculate total value for percentage
    // const totalBefore = data.nodes.reduce((sum, n) => {
    //   if (n.column === 0) return sum + n.value;
    //   return sum;
    // }, 0);

    // const sourcePercentage =
    //   totalBefore > 0 ? Math.round((link.source.value / totalBefore) * 100) : 0;
    const flowPercentage =
      link.source.value > 0
        ? Math.round((link.value / link.source.value) * 100)
        : 0;

    // Get link position for better tooltip placement
    const linkX =
      (link.source.x1 || 0) +
      ((link.target.x0 || 0) - (link.source.x1 || 0)) / 2;
    const linkY = (link.y0 || 0) + ((link.y1 || 0) - (link.y0 || 0)) / 2;

    // Convert to screen coordinates
    const rect = svgRef.current?.getBoundingClientRect();
    const screenX = rect ? rect.left + linkX : event.clientX;
    const screenY = rect ? rect.top + linkY : event.clientY;

    // Show tooltip with link details
    setTooltipData({
      content: (
        <div>
          <h3 className="font-bold">Opinion Shift</h3>
          <p className="text-sm">
            From:{" "}
            <span style={{ color: getNodeColor(link.source.id) }}>
              {link.source.name}
            </span>
          </p>
          <p className="text-sm">
            To:{" "}
            <span style={{ color: getNodeColor(link.target.id) }}>
              {link.target.name}
            </span>
          </p>
          <p className="text-sm font-medium">Count: {link.value}</p>
          <p className="text-xs mt-1">
            {flowPercentage}% of <b>{link.source.name}</b> voters{" "}
            {link.source.name === link.target.name
              ? "remained "
              : "changed to "}
            <b>{link.target.name}.</b>
          </p>
        </div>
      ),
      x: screenX,
      y: screenY,
    });
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setTooltipData(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Calculate total values for before and after
  const totalBefore = data.nodes.reduce((sum, node) => {
    if (node.column === 0) return sum + node.value;
    return sum;
  }, 0);

  const totalAfter = data.nodes.reduce((sum, node) => {
    if (node.column === 1) return sum + node.value;
    return sum;
  }, 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <h2 className="text-xl md:text-2xl font-bold text-center mb-2 md:mb-4">
        {title}
      </h2>

      <div className="flex justify-between mb-2 md:mb-4 px-4">
        <h3 className="text-sm md:text-base font-medium">Before Debate</h3>
        <h3 className="text-sm md:text-base font-medium">After Debate</h3>
      </div>

      <motion.div
        className="relative bg-white rounded-lg shadow-md p-2 md:p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        >
          {/* Links */}
          <g className="links">
            {links.map((link) => {
              if (
                typeof link.source !== "object" ||
                typeof link.target !== "object"
              )
                return null;

              const linkId = `${link.source.id}-${link.target.id}`;
              const isHighlighted =
                hoveredLink === linkId ||
                hoveredNode === link.source.id ||
                hoveredNode === link.target.id;

              // Determine link color based on source
              const linkColor = getNodeColor(link.source.id);

              return (
                <SankeyLink
                  key={linkId}
                  link={link}
                  path={sankeyLinkHorizontal()}
                  color={linkColor}
                  isHighlighted={isHighlighted}
                  onMouseEnter={() => handleLinkMouseEnter(link)}
                  onMouseLeave={handleLinkMouseLeave}
                  onClick={(e) => handleLinkClick(link, e)}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map((node) => {
              const nodeColor = getNodeColor(node.id);
              const isHighlighted = hoveredNode === node.id;

              // Calculate percentage for label
              const total = node.column === 0 ? totalBefore : totalAfter;
              const percentage =
                total > 0 ? Math.round((node.value / total) * 100) : 0;

              return (
                <SankeyNode
                  key={node.id}
                  node={node}
                  color={nodeColor}
                  isHighlighted={isHighlighted}
                  showLabel={true}
                  showPercentage={true}
                  percentage={percentage}
                  isMobile={true}
                  onClick={(e) => handleNodeClick(node, e)}
                  onMouseEnter={() => handleNodeMouseEnter(node)}
                  onMouseLeave={handleNodeMouseLeave}
                />
              );
            })}
          </g>
        </svg>
      </motion.div>

      <AnimatePresence>
        {tooltipData && (
          <SankeyTooltip
            content={tooltipData.content}
            x={tooltipData.x}
            y={tooltipData.y}
            onClose={() => setTooltipData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
