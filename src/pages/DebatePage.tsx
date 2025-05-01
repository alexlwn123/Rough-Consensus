import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DebateProvider } from '../context/DebateContext';
import Header from '../components/layout/Header';
import VotingSection from '../components/voting/VotingSection';
import ResultsPanel from '../components/results/ResultsPanel';
import PhaseController from '../components/admin/PhaseController';
import GitHubLogin from '../components/auth/GitHubLogin';

const DebatePage: React.FC = () => {
  const { debateId } = useParams<{ debateId: string }>();
  const { currentUser, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // In a real app, you would check if the current user is the debate creator
  useEffect(() => {
    // For demo purposes, we'll say the first user to access the page is the admin
    if (currentUser) {
      const checkIsAdmin = async () => {
        // This would be a firestore query in a real app
        // For now, we'll hardcode it
        setIsAdmin(true);
      };
      
      checkIsAdmin();
    }
  }, [currentUser]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800"></div>
      </div>
    );
  }
  
  if (!debateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-gray-800 mb-2">Debate Not Found</h2>
          <p className="text-gray-600">The requested debate could not be found.</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Debate Voting Platform" />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <GitHubLogin />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <DebateProvider debateId={debateId}>
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Debate Voting Platform" 
          debateTitle="Should AI be regulated by governments?" 
        />
        
        <div className="container mx-auto px-4 py-8">
          <PhaseController isAdmin={isAdmin} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <VotingSection phase="pre" />
            <VotingSection phase="post" />
          </div>
          
          <ResultsPanel />
        </div>
      </div>
    </DebateProvider>
  );
};

export default DebatePage;