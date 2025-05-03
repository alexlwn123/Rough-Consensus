import type { SimulationNodeDatum } from "d3";

export type SankeyNodeType = SimulationNodeDatum & {
  id: string;
  name: string;
  value: number;
  index?: number;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  description?: string;
  color?: string;
  width?: number;
  height?: number;
  column?: number;
};

export type SankeyLinkType = {
  source: SankeyNodeType | number;
  target: SankeyNodeType | number;
  value: number;
  width?: number;
  index?: number;
  y0?: number;
  y1?: number;
};

export type DebateResult = {
  before: {
    pro: number;
    against: number;
    undecided: number;
  };
  after: {
    pro: number;
    against: number;
    undecided: number;
  };
  flows: {
    proToPro: number;
    proToAgainst: number;
    proToUndecided: number;
    againstToPro: number;
    againstToAgainst: number;
    againstToUndecided: number;
    undecidedToPro: number;
    undecidedToAgainst: number;
    undecidedToUndecided: number;
  };
};
