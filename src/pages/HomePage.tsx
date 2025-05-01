import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Header from '../components/layout/Header';
import GitHubLogin from '../components/auth/GitHubLogin';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header title="Rough Consensus" />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
              Rough Consensus
            </h1>
            <p className="text-xl font-medium text-gray-600 max-w-2xl mx-auto">
              Where great minds don't think alike.
            </p>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Debate Voting Platform
            </p>
            
            <div className="mt-10 flex flex-col items-center space-y-6">
              {currentUser ? (
                <Link to="/debate/demo-debate">
                  <Button 
                    className="min-w-[200px] shadow-lg hover:shadow-xl transition-shadow"
                    size="lg"
                  >
                    Join Demo Debate
                  </Button>
                </Link>
              ) : (
                <div className="w-full max-w-sm mx-auto">
                  <GitHubLogin />
                  <p className="mt-4 text-sm text-gray-500">
                    Join our community of thoughtful debaters
                  </p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default HomePage;