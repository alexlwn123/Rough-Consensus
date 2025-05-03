import React from "react";
import { ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { VoteOption } from "../../types";
import Button from "./Button";

interface VoteCardProps {
  option: VoteOption;
  label: string;
  description: string;
  isSelected: boolean;
  onVote: (option: VoteOption) => void;
  disabled?: boolean;
}

const VoteCard: React.FC<VoteCardProps> = ({
  option,
  label,
  description,
  isSelected,
  onVote,
  disabled = false,
}) => {
  const getIcon = () => {
    switch (option) {
      case "for":
        return <ThumbsUp className="h-6 w-6" />;
      case "against":
        return <ThumbsDown className="h-6 w-6" />;
      case "undecided":
        return <HelpCircle className="h-6 w-6" />;
    }
  };

  const getCardStyles = () => {
    const baseStyles =
      "border rounded-lg p-4 transition-all duration-200 ease-in-out";
    const hoverStyles = !disabled
      ? "hover:shadow-md cursor-pointer"
      : "opacity-75 cursor-not-allowed";

    if (isSelected) {
      switch (option) {
        case "for":
          return `${baseStyles} bg-green-50 border-green-500 ring-2 ring-green-500 ${hoverStyles}`;
        case "against":
          return `${baseStyles} bg-red-50 border-red-500 ring-2 ring-red-500 ${hoverStyles}`;
        case "undecided":
          return `${baseStyles} bg-gray-50 border-gray-500 ring-2 ring-gray-500 ${hoverStyles}`;
      }
    }

    return `${baseStyles} border-gray-200 hover:border-gray-300 ${hoverStyles}`;
  };

  const getLabelStyles = () => {
    if (isSelected) {
      switch (option) {
        case "for":
          return "text-green-700";
        case "against":
          return "text-red-700";
        case "undecided":
          return "text-gray-700";
      }
    }

    return "text-gray-800";
  };

  const getIconStyles = () => {
    if (isSelected) {
      switch (option) {
        case "for":
          return "text-green-500";
        case "against":
          return "text-red-500";
        case "undecided":
          return "text-gray-500";
      }
    }

    return "text-gray-400";
  };

  const handleClick = () => {
    if (!disabled) {
      onVote(option);
    }
  };

  return (
    <div
      className={getCardStyles()}
      onClick={!isSelected && !disabled ? handleClick : undefined}
    >
      <div className="flex items-start space-x-4">
        <div className={`${getIconStyles()} mt-1`}>{getIcon()}</div>
        <div>
          <h3 className={`font-medium text-lg ${getLabelStyles()}`}>{label}</h3>
          <p className="text-gray-600 mt-1">{description}</p>

          <Button
            variant={isSelected ? "primary" : "outline"}
            size="sm"
            className="mt-3"
            onClick={
              !isSelected
                ? (e) => {
                    e.stopPropagation();
                    handleClick();
                  }
                : undefined
            }
            disabled={disabled}
          >
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoteCard;
