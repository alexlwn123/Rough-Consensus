import React from 'react';
import { Github } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const GitHubLogin: React.FC = () => {
  const { signIn, loading } = useAuth();
  
  const handleLogin = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md">
      <Github className="h-16 w-16 text-gray-800 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign in to Vote</h2>
      <p className="text-gray-600 mb-6 text-center">
        Authentication is required to ensure vote integrity.
        Your GitHub account will be used for verification.
      </p>
      
      <Button
        onClick={handleLogin}
        loading={loading}
        icon={<Github className="h-5 w-5" />}
        className="w-full"
      >
        Sign in with GitHub
      </Button>
      
      <p className="mt-4 text-sm text-gray-500">
        We only use your GitHub account for authentication. 
        Your voting data is kept private.
      </p>
    </div>
  );
};

export default GitHubLogin;