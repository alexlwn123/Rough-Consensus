import { supabase } from '../services/supabase';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  subscribeToDebate, 
  updateDebatePhase, 
  castVote,
  subscribeToVoteCounts,
  subscribeToSankeyData
} from '../services/voteService';
import { DebateSession, VoteOption, SankeyData, Tally, Phase } from '../types';
import { useAuth } from './AuthContext';

interface DebateContextType {
  debate: DebateSession | null;
  loading: boolean;
  userVote: Record<string, any> | null;
  voteCounts: Tally;
  sankeyData: SankeyData | null;
  handleVote: (option: VoteOption) => Promise<void>;
  changePhase: (phase: Phase) => Promise<void>;
}

const defaultVoteCounts = {
  pre: { for: 0, against: 0, undecided: 0 },
  post: { for: 0, against: 0, undecided: 0 }
};

const DebateContext = createContext<DebateContextType>({
  debate: null,
  loading: true,
  userVote: null,
  voteCounts: defaultVoteCounts,
  sankeyData: null,
  handleVote: async () => {},
  changePhase: async () => {},
});

export const useDebate = () => useContext(DebateContext);

export const DebateProvider: React.FC<{ 
  children: React.ReactNode;
  debateId: string;
}> = ({ children, debateId }) => {
  const { currentUser } = useAuth();
  const [debate, setDebate] = useState<DebateSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<Record<string, any> | null>(null);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [voteCounts, setVoteCounts] = useState<Tally>(defaultVoteCounts);

  // Subscribe to debate changes
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToDebate(debateId, (debateData) => {
      setDebate(debateData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [debateId]);

  // Subscribe to vote counts (aggregated on server)
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToVoteCounts(debateId, (counts) => {
      setVoteCounts(counts);
    });

    return () => unsubscribe();
  }, [debateId]);

  // Subscribe to Sankey data (aggregated on server)
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToSankeyData(debateId, (data) => {
      if (data) {
        setSankeyData(data);
      }
    });

    return () => unsubscribe();
  }, [debateId]);

  // Subscribe to user's own vote (for personal feedback)
  useEffect(() => {
    if (!debateId || !currentUser) return;

    // Create a subscription specifically for this user's votes
    const subscription = supabase
      .channel(`user_vote:${debateId}:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `debate_id=eq.${debateId} AND user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          setUserVote(payload.new);
        }
      )
      .subscribe();

    // Initial fetch of user's vote
    const fetchUserVote = async () => {
      try {
        const { data, error } = await supabase
          .from("votes")
          .select("*")
          .eq("debate_id", debateId)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (!error && data) {
          setUserVote(data);
        }
      } catch (error) {
        console.error("Error fetching user vote:", error);
      }
    };

    fetchUserVote();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [debateId, currentUser]);

  // Handle voting
  const handleVote = async (option: VoteOption) => {
    if (!currentUser || !debate) return;
    
    try {
      await castVote(debateId, currentUser.id, debate.currentPhase, option);
    } catch (error) {
      console.error("Error handling vote:", error);
      throw error;
    }
  };

  // Change debate phase
  const changePhase = async (phase: Phase) => {
    if (!debate) return;
    
    try {
      await updateDebatePhase(debateId, phase);
    } catch (error) {
      console.error("Error changing phase:", error);
      throw error;
    }
  };

  const value = {
    debate,
    loading,
    userVote,
    voteCounts,
    sankeyData,
    handleVote,
    changePhase,
  };

  return <DebateContext.Provider value={value}>{children}</DebateContext.Provider>;
};