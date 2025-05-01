export type VoteOption = "for" | "against" | "undecided";

export interface Vote {
  userId: string;
  option: VoteOption;
  timestamp: number;
}

export type CastedVote = {
  preDebate: { option: VoteOption };
  postDebate: { option: VoteOption };
};

export type Tally = {
  pre: Record<VoteOption, number>;
  post: Record<VoteOption, number>;
};

export interface UserVotes {
  preDebate?: Vote;
  postDebate?: Vote;
}

export interface User {
  id: string;
  displayName: string;
  photoURL: string;
  email: string;
  isAdmin?: boolean;
}

export type Phase = "pre" | "post" | "scheduled" | "finished" | "ongoing";

export interface DebateSession {
  id: string;
  title: string;
  description: string;
  currentPhase: Phase;
  startTime: number;
  endTime?: number;
  createdBy: string;
  motion: string;
  proDescription: string;
  conDescription: string;
  isDeleted: boolean;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
