import { useState, type ReactNode } from "react";
import { useConvexConnectionState, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { emptyTally } from "../../shared/domain";
import { useAuth } from "./AuthContext";
import { DebateContext } from "./DebateContext";
import { calculatePercentage } from "../lib/utils";
import type {
  Debate,
  DbDebateResult,
  Phase,
  Tally,
  Vote,
  VoteOption,
} from "../types";
export type DebateContextType = {
  debate: Debate | null;
  loading: boolean;
  userVote: Vote | null;
  voteCounts: Tally;
  sankeyData: DbDebateResult | null;
  handleVote: (option: VoteOption) => Promise<void>;
  changePhase: (phase: Phase) => Promise<void>;
  voteSummary: ReturnType<typeof calculateVoteSummary> | null;
  votingPending: boolean;
  connected: boolean;
};
function calculateVoteSummary(counts: Tally) {
  const preTotal = counts.pre.for + counts.pre.against + counts.pre.undecided;
  const postTotal =
    counts.post.for + counts.post.against + counts.post.undecided;
  return {
    pre: { ...counts.pre, total: preTotal },
    post: { ...counts.post, total: postTotal },
    percentShift: {
      for:
        calculatePercentage(counts.post.for, postTotal) -
        calculatePercentage(counts.pre.for, preTotal),
      against:
        calculatePercentage(counts.post.against, postTotal) -
        calculatePercentage(counts.pre.against, preTotal),
      undecided:
        calculatePercentage(counts.post.undecided, postTotal) -
        calculatePercentage(counts.pre.undecided, preTotal),
    },
  };
}
export function DebateProvider({
  children,
  debateId,
}: {
  children: ReactNode;
  debateId: string;
}) {
  const { currentUser, loading: authLoading } = useAuth();
  const debate = useQuery(
    api.debates.get,
    authLoading ? "skip" : { publicId: debateId },
  );
  const ownVote = useQuery(
    api.votes.mine,
    currentUser && debate ? { publicId: debateId } : "skip",
  );
  const results = useQuery(
    api.results.get,
    debate?.currentPhase === "finished" ? { publicId: debateId } : "skip",
  );
  const cast = useMutation(api.votes.cast),
    setPhase = useMutation(api.debates.setPhase);
  const connection = useConvexConnectionState();
  const [votingPending, setVotingPending] = useState(false);
  const counts = results?.counts ?? emptyTally(debate?.currentPhase);
  const handleVote = async (option: VoteOption) => {
    if (!currentUser || !debate) throw new Error("Please sign in to vote.");
    if (!connection.isWebSocketConnected)
      throw new Error("Reconnect before submitting your vote.");
    if (ownVote === undefined) throw new Error("Your ballot is still loading.");
    if (debate.currentPhase !== "pre" && debate.currentPhase !== "post")
      throw new Error("Voting is currently closed.");
    if (votingPending) return;
    setVotingPending(true);
    try {
      await cast({
        publicId: debateId,
        phase: debate.currentPhase,
        phaseVersion: debate.phaseVersion,
        expectedVoteVersion: ownVote?.version ?? 0,
        option,
      });
    } finally {
      setVotingPending(false);
    }
  };
  const changePhase = async (phase: Phase) => {
    if (!debate) throw new Error("Debate unavailable.");
    await setPhase({
      publicId: debateId,
      phase,
      expectedVersion: debate.phaseVersion,
    });
  };
  return (
    <DebateContext.Provider
      value={{
        debate: debate ?? null,
        loading: authLoading || debate === undefined,
        userVote: currentUser ? (ownVote ?? null) : null,
        voteCounts: counts,
        sankeyData: results?.result ?? null,
        voteSummary: results ? calculateVoteSummary(counts) : null,
        handleVote,
        changePhase,
        votingPending,
        connected: connection.isWebSocketConnected,
      }}
    >
      {children}
    </DebateContext.Provider>
  );
}
