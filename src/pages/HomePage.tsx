import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import GitHubLogin from '../components/auth/GitHubLogin';
import DebateListItem from '../components/debates/DebateListItem';
import { DebateSession } from '../types';
import { supabase } from '../services/supabase';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const { data, error } = await supabase
          .from('debates')
          .select('*')
          .order('start_time', { ascending: true });

        if (error) throw error;
        
        // Map database column names to our interface names
        const mappedDebates = (data || []).map(debate => ({
          id: debate.id,
          title: debate.title,
          description: debate.description,
          currentPhase: debate.current_phase,
          startTime: debate.start_time,
          endTime: debate.end_time,
          createdBy: debate.created_by
        }));
        
        setDebates(mappedDebates);
      } catch (error) {
        console.error('Error fetching debates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebates();
  }, []);

  const ongoingDebates = debates.filter(
    debate => debate.currentPhase === 'pre' || debate.currentPhase === 'post'
  );
  
  const scheduledDebates = debates.filter(
    debate => debate.currentPhase === 'scheduled'
  );
  
  const pastDebates = debates.filter(
    debate => debate.currentPhase === 'finished'
  );

  const DebateList: React.FC<{ title: string; debates: DebateSession[]; emptyMessage: string }> = ({ 
    title, 
    debates,
    emptyMessage 
  }) => (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {debates.length} {debates.length === 1 ? 'debate' : 'debates'}
        </span>
      </div>
      {debates.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {debates.map(debate => (
            <DebateListItem key={debate.id} debate={debate} />
          ))}
        </div>
      )}
    </section>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header title="Rough Consensus" debateTitle="Debate Voting Platform" />
      
      <main>
        <div className="bg-gradient-to-b from-blue-900 to-indigo-800 text-white py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Rough Consensus
              </h1>
              <p className="text-xl sm:text-2xl font-medium text-blue-100 max-w-2xl mx-auto">
                Where great minds don't think alike.
              </p>
              
              {!currentUser && (
                <div className="mt-12 max-w-md mx-auto my-auto">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 ring-1 ring-white/20 shadow-xl">
                    <GitHubLogin />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="space-y-3 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="text-sm text-gray-600 font-medium">Loading debates...</p>
                </div>
              </div>
            ) : debates.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">No Debates Yet</h2>
                  <p className="text-gray-600">Be the first to start a meaningful discussion.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {ongoingDebates.length > 0 && (
                  <DebateList
                    title="Ongoing Debates"
                    debates={ongoingDebates}
                    emptyMessage="No ongoing debates at the moment."
                  />
                )}
                
                {scheduledDebates.length > 0 && (
                  <DebateList
                    title="Upcoming Debates"
                    debates={scheduledDebates}
                    emptyMessage="No upcoming debates scheduled."
                  />
                )}
                
                {pastDebates.length > 0 && (
                  <DebateList
                    title="Past Debates"
                    debates={pastDebates}
                    emptyMessage="No past debates available."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;