import React, { useState, useRef, useEffect } from "react";
import bitcoinChatImage from "../../assets/bitcoinchat.png";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogOut, Settings, ArrowLeft, Menu } from "lucide-react";
import Button from "../ui/Button";

interface HeaderProps {
  title: string;
  debateTitle?: string;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, debateTitle, showBack }) => {
  const { currentUser, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const MenuButton: React.FC<{
    to?: string;
    onClick?: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ to, onClick, icon, children }) => {
    const buttonContent = (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 text-sm transition-colors"
      >
        {icon}
        <span>{children}</span>
      </button>
    );

    if (to) {
      return <Link to={to}>{buttonContent}</Link>;
    }
    return buttonContent;
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white relative z-20 sticky top-0 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src={bitcoinChatImage}
              alt="Bitcoin Chat"
              className="w-16 h-16 object-contain drop-shadow-xl"
              aria-hidden="true"
            />
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {debateTitle && (
                <p className="text-blue-200 text-sm">{debateTitle}</p>
              )}
            </div>
          </Link>

          {currentUser && (
            <div className="relative">
              <Button
                ref={buttonRef}
                variant="outline"
                size="sm"
                onClick={handleMenuToggle}
                className="border-white text-white hover:bg-white hover:bg-opacity-10"
                icon={<Menu className="h-5 w-5" />}
                aria-label="Menu"
              />

              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200"
                >
                  {showBack && (
                    <MenuButton to="/" icon={<ArrowLeft className="h-4 w-4" />}>
                      Back to Home
                    </MenuButton>
                  )}

                  {currentUser.isAdmin && (
                    <MenuButton
                      to="/admin"
                      icon={<Settings className="h-4 w-4" />}
                    >
                      Admin Dashboard
                    </MenuButton>
                  )}

                  <MenuButton
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    icon={<LogOut className="h-4 w-4" />}
                  >
                    Sign Out
                  </MenuButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
