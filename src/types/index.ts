import { Session } from "@supabase/supabase-js";
import { Enums, Tables } from "./Database.types";

export type VoteOption = "for" | "against" | "undecided";

export type Vote = Tables<"votes">;

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

export type SessionUser = Session["user"];

export type Phase = Enums<"Debate Phase">;

export type DebateDb = Tables<"debates">;

type CamelCase<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends object
    ? KeysToCamelCase<T[K]>
    : T[K];
};

export type Debate = KeysToCamelCase<DebateDb>;

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
