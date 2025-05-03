import { createContext, useContext } from "react";
import { DebateContextType } from "./DebateProvider";
import { Tally } from "../types";

const defaultVoteCounts = {
  pre: { for: 0, against: 0, undecided: 0 },
  post: { for: 0, against: 0, undecided: 0 },
  total_voters: 0,
  current_phase: null,
} satisfies Tally;

export const DebateContext = createContext<DebateContextType>({
  debate: null,
  loading: true,
  userVote: null,
  voteCounts: defaultVoteCounts,
  sankeyData: null,
  handleVote: async () => {},
  changePhase: async () => {},
  voteSummary: null,
});

export const useDebate = () => useContext(DebateContext);
