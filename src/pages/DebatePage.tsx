import React from "react";
import { useParams } from "react-router-dom";
import { DebateProvider } from "../context/DebateProvider";
import DebatePageContent from "../components/debates/DebatePageContent";

const DebatePage: React.FC = () => {
  const { debateId } = useParams<{ debateId: string }>();

  if (!debateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-gray-800 mb-2">Debate Not Found</h2>
          <p className="text-gray-600">
            The requested debate could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DebateProvider debateId={debateId}>
      <DebatePageContent debateId={debateId} />
    </DebateProvider>
  );
};

export default DebatePage;
