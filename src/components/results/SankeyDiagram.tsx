import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { SankeyData } from '../../types';

interface SankeyDiagramProps {
  data: SankeyData;
  width: number;
  height: number;
}

const COLORS = {
  'Pre: For': '#22c55e',      // Green
  'Pre: Against': '#ef4444',  // Red
  'Pre: Undecided': '#9ca3af', // Gray
  'Post: For': '#22c55e',     // Green
  'Post: Against': '#ef4444', // Red
  'Post: Undecided': '#9ca3af' // Gray
};

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!data || !data.nodes.length || !svgRef.current) return;
    
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Clear existing SVG
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create the Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[margin.left, margin.top], [innerWidth, innerHeight]]);
    
    // Format the data for the Sankey diagram
    const sankeyData = sankeyGenerator({
      nodes: data.nodes.map(d => Object.assign({}, d)),
      links: data.links.map(d => Object.assign({}, d))
    });
    
    // Create the SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Add links
    const link = svg.append('g')
      .selectAll('path')
      .data(sankeyData.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke', d => {
        const sourceNode = sankeyData.nodes[d.source.index];
        return d3.color(COLORS[sourceNode.name] || '#aaa')?.darker(0.5) || '#aaa';
      })
      .attr('stroke-opacity', 0.5)
      .attr('fill', 'none')
      .style('transition', 'stroke-opacity 0.3s')
      .on('mouseover', function() {
        d3.select(this).attr('stroke-opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-opacity', 0.5);
      })
      .append('title')
      .text(d => `${d.source.name} → ${d.target.name}: ${d.value} votes`);
    
    // Add nodes
    const node = svg.append('g')
      .selectAll('rect')
      .data(sankeyData.nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => COLORS[d.name] || '#aaa')
      .style('transition', 'opacity 0.3s')
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
      })
      .append('title')
      .text(d => `${d.name}: ${d.value} votes`);
    
    // Add labels
    svg.append('g')
      .selectAll('text')
      .data(sankeyData.nodes)
      .join('text')
      .attr('x', d => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .text(d => `${d.name} (${d.value})`)
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .attr('fill', 'currentColor');
    
  }, [data, width, height]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Vote Movement Analysis</h3>
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
};

export default SankeyDiagram;