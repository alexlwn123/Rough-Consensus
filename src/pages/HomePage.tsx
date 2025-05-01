import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart3, GitMerge, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Header from '../components/layout/Header';
import GitHubLogin from '../components/auth/GitHubLogin';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Debate Voting Platform" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Real-Time Debate Voting
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Measure opinion shifts before and after debates to determine which arguments truly change minds.
            </p>
            
            {currentUser ? (
              <Link to="/debate/demo-debate">
                <Button 
                  className="mt-8"
                  size="lg"
                >
                  Join Demo Debate
                </Button>
              </Link>
            ) : (
              <div className="mt-8 max-w-sm mx-auto">
                <GitHubLogin />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-600" />}
              title="Secure Authentication"
              description="GitHub OAuth ensures one vote per user while maintaining anonymity in results."
            />
            <FeatureCard 
              icon={<GitMerge className="h-8 w-8 text-blue-600" />}
              title="Two-Phase Voting"
              description="Capture opinions before and after debates to measure actual persuasiveness."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              title="Dynamic Visualization"
              description="Sankey diagrams show exactly how opinions shifted throughout the debate."
            />
            <FeatureCard 
              icon={<TrendingUp className="h-8 w-8 text-blue-600" />}
              title="Real-Time Results"
              description="Watch live as participants cast their votes and see immediate updates."
            />
            <FeatureCard 
              icon={<MessageSquare className="h-8 w-8 text-blue-600" />}
              title="Objective Winner"
              description="Determine winners based on which side changed more minds, not just total votes."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-600" />}
              title="Responsive Design"
              description="Vote easily from any device with our mobile-optimized interface."
            />
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="p-8 md:w-1/2">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  How It Works
                </h2>
                <ol className="space-y-4 text-gray-600">
                  <li className="flex">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                    <span>Participants sign in using their GitHub account to ensure vote integrity.</span>
                  </li>
                  <li className="flex">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                    <span>Before the debate, all participants cast their initial votes on the motion.</span>
                  </li>
                  <li className="flex">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                    <span>After the debate concludes, participants vote again based on the arguments they heard.</span>
                  </li>
                  <li className="flex">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                    <span>The system calculates opinion shifts and visualizes how the debate changed minds.</span>
                  </li>
                </ol>
              </div>
              <div className="p-8 bg-gradient-to-br from-blue-800 to-indigo-900 text-white md:w-1/2">
                <h2 className="text-2xl font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="mb-6">
                  Join our demo debate to experience the platform in action, or create your own debate to measure opinion shifts on topics that matter to you.
                </p>
                
                {currentUser ? (
                  <Link to="/debate/demo-debate">
                    <Button 
                      className="w-full"
                      variant="secondary"
                    >
                      Join Demo Debate
                    </Button>
                  </Link>
                ) : (
                  <p className="text-blue-200 text-sm">
                    Sign in above to participate in debates.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default HomePage;