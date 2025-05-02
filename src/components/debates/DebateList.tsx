import React from 'react';
import { Debate } from '../../types/index';
import DebateListItem from './DebateListItem';
import { Live } from '../ui/Live';

interface DebateListProps {
  title: string;
  debates: Debate[];
  emptyMessage: string;
  status: 'ongoing' | 'upcoming' | 'past';
}

const DebateList: React.FC<DebateListProps> = ({ 
  title, 
  debates,
  emptyMessage,
  status
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'ongoing':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6',
          header: 'border-blue-200',
          title: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-700',
          counter: 'bg-white/80 backdrop-blur-sm shadow-sm border border-blue-100'
        };
      case 'upcoming':
        return {
          container: 'bg-white border border-gray-200 rounded-xl p-6',
          header: 'border-gray-200',
          title: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-600',
          counter: 'bg-gray-100'
        };
      case 'past':
        return {
          container: 'bg-gray-50 border border-gray-200 rounded-xl p-6',
          header: 'border-gray-200',
          title: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-600',
          counter: 'bg-white'
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <section className={styles.container}>
      <div
        className={`flex items-center justify-between border-b ${styles.header} pb-4`}
      >
        <div className="flex items-center gap-3">
          <h2 className={`text-xl sm:text-2xl font-bold ${styles.title}`}>
            {title}
          </h2>
          {status === "ongoing" && (
            <div className="flex items-center gap-2">
              <Live />
              <span className="text-sm font-medium text-red-600">Live</span>
            </div>
          )}
        </div>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${styles.counter}`}
        >
          {debates.length} {debates.length === 1 ? "debate" : "debates"}
        </span>
      </div>
      {debates.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 text-center border border-gray-200 mt-4">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {debates.map((debate) => (
            <DebateListItem key={debate.id} debate={debate} />
          ))}
        </div>
      )}
    </section>
  );
};

export default DebateList; 