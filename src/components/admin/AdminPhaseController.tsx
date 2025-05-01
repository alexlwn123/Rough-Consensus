import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";
import Button from "../ui/Button";
import { Phase } from "../../types";

interface AdminPhaseControllerProps {
  debateId: string;
  currentPhase: Phase;
  onUpdatePhase: (debateId: string, phase: Phase) => Promise<void>;
}

const AdminPhaseController: React.FC<AdminPhaseControllerProps> = ({
  debateId,
  currentPhase,
  onUpdatePhase,
}) => {
  const handlePhaseChange = async (phase: Phase) => {
    try {
      await onUpdatePhase(debateId, phase);
    } catch (error) {
      console.error("Error changing phase:", error);
    }
  };

  const getPhaseInfo = (phase: Phase) => {
    switch (phase) {
      case "scheduled":
        return { text: "Scheduled", Icon: Calendar };
      case "pre":
        return { text: "Pre-Debate", Icon: ArrowLeft };
      case "ongoing":
        return { text: "Ongoing", Icon: Clock };
      case "post":
        return { text: "Post-Debate", Icon: ArrowRight };
      case "finished":
        return { text: "Finished", Icon: CheckCircle };
      default:
        return { text: "Unknown", Icon: Calendar };
    }
  };

  const getNextPhase = (currentPhase: Phase): Phase | null => {
    switch (currentPhase) {
      case "scheduled":
        return "pre";
      case "pre":
        return "ongoing";
      case "ongoing":
        return "post";
      case "post":
        return "finished";
      default:
        return null;
    }
  };

  const getPreviousPhase = (currentPhase: Phase): Phase | null => {
    switch (currentPhase) {
      case "finished":
        return "post";
      case "post":
        return "ongoing";
      case "ongoing":
        return "pre";
      case "pre":
        return "scheduled";
      default:
        return null;
    }
  };

  const currentPhaseInfo = getPhaseInfo(currentPhase);
  const nextPhase = getNextPhase(currentPhase);
  const previousPhase = getPreviousPhase(currentPhase);

  return (
    <div className="bg-white border rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">
            Manage Phase
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-0.5">
            Currently in {currentPhaseInfo.text}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {previousPhase && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePhaseChange(previousPhase)}
              icon={React.createElement(getPhaseInfo(previousPhase).Icon, {
                className: "h-4 w-4",
              })}
              className="flex-1 sm:flex-initial justify-center min-h-[40px] gap-1"
              aria-label={`Switch to ${getPhaseInfo(previousPhase).text} phase`}
            >
              <span className="hidden sm:inline">
                {getPhaseInfo(previousPhase).text}
              </span>
              <span className="sm:hidden">
                {getPhaseInfo(previousPhase).text.split("-")[0]}
              </span>
            </Button>
          )}

          {nextPhase && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePhaseChange(nextPhase)}
              icon={React.createElement(getPhaseInfo(nextPhase).Icon, {
                className: "h-4 w-4",
              })}
              className="flex-1 sm:flex-initial justify-center min-h-[40px] gap-1"
              aria-label={`Switch to ${getPhaseInfo(nextPhase).text} phase`}
            >
              <span className="hidden sm:inline">
                {getPhaseInfo(nextPhase).text}
              </span>
              <span className="sm:hidden">
                {getPhaseInfo(nextPhase).text.split("-")[0]}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPhaseController;
