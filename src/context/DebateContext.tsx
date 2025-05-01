import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  subscribeToDebate, 
  subscribeToVotes, 
  updateDebatePhase, 
  castVote,
  generateSankeyData
} from '../services/voteService';
import { DebateSession, VoteOption, SankeyData } from '../types';
import { useAuth } from './AuthContext';

interface DebateContextType {
  debate: DebateSession | null;
  loading: boolean;
  userVote: Record<string, any> | null;
  allVotes: Record<string, any>[];
  sankeyData: SankeyData | null;
  voteCounts: {
    pre: Record<VoteOption, number>;
    post: Record<VoteOption, number>;
  };
  handleVote: (option: VoteOption) => Promise<void>;
  changePhase: (phase: 'pre' | 'post') => Promise<void>;
}

const defaultVoteCounts = {
  pre: { for: 0, against: 0, undecided: 0 },
  post: { for: 0, against: 0, undecided: 0 }
};

const DebateContext = createContext<DebateContextType>({
  debate: null,
  loading: true,
  userVote: null,
  allVotes: [],
  sankeyData: null,
  voteCounts: defaultVoteCounts,
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
  const [allVotes, setAllVotes] = useState<Record<string, any>[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [voteCounts, setVoteCounts] = useState(defaultVoteCounts);

  // Subscribe to debate changes
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToDebate(debateId, (debateData) => {
      setDebate(debateData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [debateId]);

  // Subscribe to votes
  useEffect(() => {
    if (!debateId) return;

    const unsubscribe = subscribeToVotes(debateId, (votes) => {
      setAllVotes(votes);
      
      // Generate Sankey data
      if (votes.length > 0) {
        const data = generateSankeyData(votes);
        setSankeyData(data);
      }
      
      // Calculate vote counts
      const counts = {
        pre: { for: 0, against: 0, undecided: 0 },
        post: { for: 0, against: 0, undecided: 0 }
      };
      
      votes.forEach(vote => {
        if (vote.preDebate) {
          counts.pre[vote.preDebate.option] += 1;
        }
        if (vote.postDebate) {
          counts.post[vote.postDebate.option] += 1;
        }
      });
      
      setVoteCounts(counts);
    });

    return () => unsubscribe();
  }, [debateId]);

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
  const changePhase = async (phase: 'pre' | 'post') => {
    if (!debate) return;
    
    try {
      await updateDebatePhase(debateId, phase);
    } catch (error) {
      console.error("Error changing phase:", error);
      throw error;
    }
  };

  // Get the current user's vote
  const userVote = currentUser 
    ? allVotes.find(vote => vote.id === currentUser.id) || null
    : null;

  const value = {
    debate,
    loading,
    userVote,
    allVotes,
    sankeyData,
    voteCounts,
    handleVote,
    changePhase,
  };

  return <DebateContext.Provider value={value}>{children}</DebateContext.Provider>;
};