import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useDebate } from '../../context/DebateContext';
import Button from '../ui/Button';

interface PhaseControllerProps {
  isAdmin: boolean;
}

const PhaseController: React.FC<PhaseControllerProps> = ({ isAdmin }) => {
  const { debate, changePhase } = useDebate();
  
  if (!debate) return null;
  
  const handlePhaseChange = async (phase: 'pre' | 'post') => {
    try {
      await changePhase(phase);
    } catch (error) {
      console.error('Error changing phase:', error);
    }
  };
  
  const isPrePhase = debate.currentPhase === 'pre';
  const isPostPhase = debate.currentPhase === 'post';

  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-800">Current Phase</h2>
          <p className="text-gray-600">
            {isPrePhase ? 'Pre-Debate Voting' : 'Post-Debate Voting'}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePhaseChange('pre')}
              disabled={isPrePhase}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Pre-Debate
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePhaseChange('post')}
              disabled={isPostPhase}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Post-Debate
            </Button>
          </div>
        )}
      </div>
      
      {!isAdmin && (
        <div className="mt-2 text-sm text-gray-500">
          The debate organizer controls the current phase.
        </div>
      )}
    </div>
  );
};

export default PhaseController;