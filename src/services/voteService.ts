import { supabase } from "./supabase";
import {
  Vote,
  VoteOption,
  Debate,
  DbSankeyData,
  CastedVote,
  Phase,
  Tally,
} from "../types";

// Cast a vote
export const castVote = async (
  debateId: string,
  userId: string,
  phase: "pre" | "post",
  option: VoteOption,
) => {
  try {
    const vote: Vote = {
      user_id: userId,
      debate_id: debateId,
      post_vote: null,
      pre_vote: null,
      created_at: new Date().toISOString(),
      id: crypto.randomUUID(),
      [`${phase}_vote`]: { option },
    };

    const { error } = await supabase.from("votes").upsert({
      debate_id: debateId,
      user_id: userId,
      [`${phase}_vote`]: vote,
    });

    if (error) throw error;
    console.log("Vote casted", vote);
    return true;
  } catch (error) {
    console.error("Error casting vote:", error);
    throw error;
  }
};

// Update debate phase
export const updateDebatePhase = async (debateId: string, phase: Phase) => {
  try {
    const { error } = await supabase
      .from("debates")
      .update({ current_phase: phase })
      .eq("id", debateId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating debate phase:", error);
    throw error;
  }
};

// Subscribe to debate changes
export const subscribeToDebate = (
  debateId: string,
  callback: (debate: Debate) => void,
) => {
  const subscription = supabase
    .channel(`debate:${debateId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "debates",
        filter: `id=eq.${debateId}`,
      },
      (payload) => {
        callback(payload.new as Debate);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Get vote counts for a debate (server-side aggregation)
export const getDebateVoteCounts = async (debateId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_debate_vote_counts", {
      debate_id: debateId,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting vote counts:", error);
    // Return empty counts as fallback
    return {
      pre: { for: 0, against: 0, undecided: 0 },
      post: { for: 0, against: 0, undecided: 0 },
      total_voters: 0,
      current_phase: "scheduled",
    } satisfies Tally;
  }
};

// Get Sankey data for a debate (server-side aggregation)
export const getDebateSankeyData = async (
  debateId: string,
): Promise<DbSankeyData | null> => {
  try {
    const { data, error } = await supabase.rpc("get_debate_sankey_data", {
      debate_id: debateId,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error getting Sankey data:", error);
    return null;
  }
};

// Subscribe to vote count changes
export const subscribeToVoteCounts = (
  debateId: string,
  callback: (voteCounts: Tally) => void,
) => {
  // Initial fetch
  getDebateVoteCounts(debateId).then(callback);
  // Subscribe to changes
  const subscription = supabase
    .channel(`votes:${debateId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `debate_id=eq.${debateId}`,
      },
      async () => {
        // Get updated counts when votes change
        const counts = await getDebateVoteCounts(debateId);
        callback(counts);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Subscribe to Sankey data changes
export const subscribeToSankeyData = (
  debateId: string,
  callback: (sankeyData: DbSankeyData | null) => void,
) => {
  // Initial fetch
  getDebateSankeyData(debateId).then(callback);

  // Subscribe to changes
  const subscription = supabase
    .channel(`votes:${debateId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `debate_id=eq.${debateId}`,
      },
      async () => {
        // Get updated Sankey data when votes change
        const sankeyData = await getDebateSankeyData(debateId);
        callback(sankeyData);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Legacy client-side Sankey generator (for fallback if server functions fail)
export const generateSankeyData = (votes: CastedVote[]): DbSankeyData => {
  const nodes = [
    { name: "Pre: For" },
    { name: "Pre: Against" },
    { name: "Pre: Undecided" },
    { name: "Post: For" },
    { name: "Post: Against" },
    { name: "Post: Undecided" },
  ];

  const links = [
    { source: 0, target: 3, value: 0 },
    { source: 0, target: 4, value: 0 },
    { source: 0, target: 5, value: 0 },
    { source: 1, target: 3, value: 0 },
    { source: 1, target: 4, value: 0 },
    { source: 1, target: 5, value: 0 },
    { source: 2, target: 3, value: 0 },
    { source: 2, target: 4, value: 0 },
    { source: 2, target: 5, value: 0 },
  ];

  votes.forEach((vote) => {
    if (vote.preDebate && vote.postDebate) {
      const preIndex = getNodeIndex(vote.preDebate.option);
      const postIndex = getNodeIndex(vote.postDebate.option) + 3;

      const linkIndex = links.findIndex(
        (link) => link.source === preIndex && link.target === postIndex,
      );

      if (linkIndex !== -1) {
        links[linkIndex].value += 1;
      }
    }
  });

  return { nodes, links, current_phase: "finished" } satisfies DbSankeyData;
};

const getNodeIndex = (option: VoteOption): number => {
  switch (option) {
    case "for":
      return 0;
    case "against":
      return 1;
    case "undecided":
      return 2;
    default:
      return 2;
  }
};
