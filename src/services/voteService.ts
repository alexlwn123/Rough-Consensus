import { supabase } from './supabase';
import { Vote, VoteOption, DebateSession, SankeyData } from '../types';

// Cast a vote
export const castVote = async (
  debateId: string, 
  userId: string, 
  phase: 'pre' | 'post', 
  option: VoteOption
) => {
  try {
    const vote: Vote = {
      userId,
      option,
      timestamp: Date.now()
    };

    const { data, error } = await supabase
      .from('votes')
      .upsert({
        debate_id: debateId,
        user_id: userId,
        [`${phase}_vote`]: vote
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error casting vote:", error);
    throw error;
  }
};

// Update debate phase
export const updateDebatePhase = async (debateId: string, phase: 'pre' | 'post') => {
  try {
    const { error } = await supabase
      .from('debates')
      .update({ current_phase: phase })
      .eq('id', debateId);

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
  callback: (debate: DebateSession) => void
) => {
  const subscription = supabase
    .channel(`debate:${debateId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'debates',
        filter: `id=eq.${debateId}`
      },
      (payload) => {
        callback(payload.new as DebateSession);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Subscribe to votes
export const subscribeToVotes = (
  debateId: string, 
  callback: (votes: Record<string, any>[]) => void
) => {
  const subscription = supabase
    .channel(`votes:${debateId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `debate_id=eq.${debateId}`
      },
      async () => {
        // Fetch all votes for this debate
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('debate_id', debateId);
          
        if (!error && data) {
          callback(data);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// Generate Sankey data from votes
export const generateSankeyData = (votes: Record<string, any>[]): SankeyData => {
  const nodes = [
    { name: "Pre: For" },
    { name: "Pre: Against" },
    { name: "Pre: Undecided" },
    { name: "Post: For" },
    { name: "Post: Against" },
    { name: "Post: Undecided" }
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
    { source: 2, target: 5, value: 0 }
  ];
  
  votes.forEach(vote => {
    if (vote.pre_vote && vote.post_vote) {
      const preIndex = getNodeIndex(vote.pre_vote.option);
      const postIndex = getNodeIndex(vote.post_vote.option) + 3;
      
      const linkIndex = links.findIndex(
        link => link.source === preIndex && link.target === postIndex
      );
      
      if (linkIndex !== -1) {
        links[linkIndex].value += 1;
      }
    }
  });
  
  return { nodes, links };
};

const getNodeIndex = (option: VoteOption): number => {
  switch (option) {
    case 'for': return 0;
    case 'against': return 1;
    case 'undecided': return 2;
    default: return 2;
  }
};