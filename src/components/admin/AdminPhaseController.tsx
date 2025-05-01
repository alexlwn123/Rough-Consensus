import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

interface AdminPhaseControllerProps {
  debateId: string;
  currentPhase: 'pre' | 'post';
  onUpdatePhase: (debateId: string, phase: 'pre' | 'post') => Promise<void>;
}

const AdminPhaseController: React.FC<AdminPhaseControllerProps> = ({ 
  debateId,
  currentPhase,
  onUpdatePhase
}) => {
  const handlePhaseChange = async (phase: 'pre' | 'post') => {
    try {
      await onUpdatePhase(debateId, phase);
    } catch (error) {
      console.error('Error changing phase:', error);
    }
  };
  
  const isPrePhase = currentPhase === 'pre';
  const isPostPhase = currentPhase === 'post';

  return (
    <div className="bg-white border rounded-lg p-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-800">Manage Phase</h2>
          <p className="text-gray-600">
            {isPrePhase ? 'Currently in Pre-Debate' : 'Currently in Post-Debate'}
          </p>
        </div>
        
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
      </div>
    </div>
  );
};

export default AdminPhaseController;