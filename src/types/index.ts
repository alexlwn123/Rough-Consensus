export type VoteOption = 'for' | 'against' | 'undecided';

export interface Vote {
  userId: string;
  option: VoteOption;
  timestamp: number;
}

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

export interface DebateSession {
  id: string;
  title: string;
  description: string;
  currentPhase: 'pre' | 'post';
  startTime: number;
  endTime?: number;
  createdBy: string;
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