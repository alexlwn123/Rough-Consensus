import { supabase } from '../services/supabase';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  subscribeToDebate, 
  updateDebatePhase, 
  castVote,
  subscribeToVoteCounts,
  subscribeToSankeyData
} from '../services/voteService';
import { Debate, VoteOption, SankeyData, Tally, Phase, Vote } from '../types';
import { useAuth } from './AuthContext';

interface DebateContextType {
  debate: Debate | null;
  loading: boolean;
  userVote: Vote | null;
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
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<Vote | null>(null);
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

  }, [debateId, currentUser]);

  // Handle voting
  const handleVote = async (option: VoteOption) => {
    if (!currentUser || !debate) return;

    if (debate.currentPhase !== "pre" && debate.currentPhase !== "post") {
      console.error("Voting is currently closed. Phase:", debate.currentPhase);
      throw new Error("Voting is currently closed.");
    }

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