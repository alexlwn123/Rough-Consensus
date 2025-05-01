import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, LogOut, Settings } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  title: string;
  debateTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, debateTitle }) => {
  const { currentUser, signOut } = useAuth();
  
  return (
    <header className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <MessageSquare className="h-8 w-8 mr-2" />
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {debateTitle && (
                <p className="text-blue-200 text-sm">{debateTitle}</p>
              )}
            </div>
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {currentUser.photoURL && (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName}
                    className="h-8 w-8 rounded-full mr-2 border-2 border-white"
                  />
                )}
                <span className="text-sm hidden md:inline-block">
                  {currentUser.displayName}
                </span>
              </div>

              {currentUser.isAdmin && (
                <Link to="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white text-white hover:bg-white hover:bg-opacity-10"
                    icon={<Settings className="h-4 w-4" />}
                  >
                    <span className="hidden md:inline-block">Admin</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="border-white text-white hover:bg-white hover:bg-opacity-10"
                icon={<LogOut className="h-4 w-4" />}
              >
                <span className="hidden md:inline-block">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;