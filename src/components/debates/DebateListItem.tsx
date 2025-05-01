import React from 'react';
import { Calendar, ArrowLeft, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DebateSession, Phase } from '../../types';

interface DebateListItemProps {
  debate: DebateSession;
}

const DebateListItem: React.FC<DebateListItemProps> = ({ debate }) => {
  const getPhaseInfo = (phase: Phase) => {
    switch (phase) {
      case 'scheduled':
        return { 
          text: 'Scheduled', 
          Icon: Calendar,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
      case 'pre':
        return { 
          text: 'Pre-Debate', 
          Icon: ArrowLeft,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'post':
        return { 
          text: 'Post-Debate', 
          Icon: ArrowRight,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'finished':
        return { 
          text: 'Finished', 
          Icon: CheckCircle,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
      default:
        return { 
          text: 'Unknown', 
          Icon: Calendar,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const phaseInfo = getPhaseInfo(debate.currentPhase);
  const startDate = new Date(debate.startTime);
  const formattedDate = startDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  const formattedTime = startDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <Link 
      to={`/debate/${debate.id}`}
      className="group block bg-white shadow-sm hover:shadow-md active:shadow-inner transition-all duration-200 rounded-lg overflow-hidden"
    >
      <div className="p-4 sm:p-5 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {debate.title}
            </h3>
            <span
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${phaseInfo.bgColor} ${phaseInfo.textColor}`}
            >
              <phaseInfo.Icon className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">{phaseInfo.text}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
            {debate.description || 'No description provided'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {formattedTime}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DebateListItem; 