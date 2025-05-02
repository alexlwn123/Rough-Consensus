import React from "react";
import {
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Debate, Phase } from "../../types";
import { Live } from "../ui/Live";

interface DebateListItemProps {
  debate: Debate;
}

const DebateListItem: React.FC<DebateListItemProps> = ({ debate }) => {
  const getPhaseInfo = (phase: Phase) => {
    switch (phase) {
      case "scheduled":
        return {
          text: "Scheduled",
          Icon: Calendar,
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          borderColor: "border-blue-200",
        };
      case "pre":
        return {
          text: "Pre-Debate Vote",
          Icon: ArrowLeft,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200",
        };
      case "post":
        return {
          text: "Post-Debate Vote",
          Icon: ArrowRight,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
        };
      case "finished":
        return {
          text: "Finished",
          Icon: CheckCircle,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
        };
      case "ongoing":
        return {
          text: "Debate in Progress",
          Icon: Live,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
        };
      default:
        return {
          text: "Unknown",
          Icon: Calendar,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
        };
    }
  };

  const phaseInfo = getPhaseInfo(debate.currentPhase);
  const startDate = new Date(debate.startTime);
  const formattedDate = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      startDate.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
  const formattedTime = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const showDateTime = debate.currentPhase !== "finished";
  const showJoinButton =
    debate.currentPhase === "pre" ||
    debate.currentPhase === "post" ||
    debate.currentPhase === "ongoing";

  return (
    <Link
      to={`/debate/${debate.id}`}
      className={`group block bg-white border ${phaseInfo.borderColor} shadow-sm hover:shadow-md active:shadow-inner transition-all duration-200 rounded-xl overflow-hidden`}
    >
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {debate.title}
            </h3>
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${phaseInfo.bgColor} ${phaseInfo.textColor} border ${phaseInfo.borderColor}`}
            >
              <phaseInfo.Icon className="h-3.5 w-3.5" />
              <span className="xs:inline">{phaseInfo.text}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {debate.description || "No description provided"}
          </p>
        </div>

        {(showDateTime || showJoinButton) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
            {showDateTime && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formattedTime}
                </span>
              </>
            )}
            {showJoinButton && (
              <span className="inline-flex items-center gap-1.5 ml-auto">
                <Users className="h-3.5 w-3.5" />
                Join debate
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default DebateListItem;
