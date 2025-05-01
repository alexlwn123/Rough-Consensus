import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DebateSession } from '../types';
import { supabase } from '../services/supabase';
import AdminPhaseController from '../components/admin/AdminPhaseController';

const AdminPage: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebate, setSelectedDebate] = useState<DebateSession | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Fetch debates from Supabase
  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const { data, error } = await supabase
          .from('debates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map database column names to our interface names
        const mappedDebates = (data || []).map(debate => ({
          id: debate.id,
          title: debate.title,
          description: debate.description,
          currentPhase: debate.current_phase as 'pre' | 'post',
          startTime: debate.start_time,
          endTime: debate.end_time,
          createdBy: debate.created_by
        }));
        
        setDebates(mappedDebates);
      } catch (error) {
        console.error('Error fetching debates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebates();
  }, []);

  // Check if user is admin, if not redirect to home
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser || !currentUser.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreateDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !currentUser) return;

    try {
      const newDebate = {
        title: formData.title,
        description: formData.description,
        current_phase: 'pre',
        created_by: currentUser.id,
      };

      const { data, error } = await supabase
        .from('debates')
        .insert([newDebate])
        .select()
        .single();

      if (error) throw error;

      // Add the new debate to the list
      const mappedDebate: DebateSession = {
        id: data.id,
        title: data.title,
        description: data.description,
        currentPhase: data.current_phase as 'pre' | 'post',
        startTime: data.start_time,
        endTime: data.end_time,
        createdBy: data.created_by
      };
      
      setDebates([mappedDebate, ...debates]);
      setFormData({ title: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating debate:', error);
    }
  };

  const handleUpdatePhase = async (debateId: string, phase: 'pre' | 'post') => {
    try {
      const { error } = await supabase
        .from('debates')
        .update({ current_phase: phase })
        .eq('id', debateId);

      if (error) throw error;

      // Update local state
      setDebates(
        debates.map((debate) =>
          debate.id === debateId ? { ...debate, currentPhase: phase } : debate
        )
      );

      if (selectedDebate && selectedDebate.id === debateId) {
        setSelectedDebate({ ...selectedDebate, currentPhase: phase });
      }
    } catch (error) {
      console.error('Error updating debate phase:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Debates</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'Create New Debate'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Create New Debate</h3>
          <form onSubmit={handleCreateDebate}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={4}
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Create Debate
            </button>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">Loading debates...</div>
      ) : debates.length === 0 ? (
        <div className="text-center py-4">No debates found. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debates.map((debate) => (
            <div key={debate.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{debate.title}</h3>
                <p className="text-gray-600 mb-4">
                  {debate.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      debate.currentPhase === 'pre'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {debate.currentPhase === 'pre' ? 'Pre-Debate' : 'Post-Debate'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(debate.startTime).toLocaleDateString()}
                  </span>
                </div>
                <AdminPhaseController
                  debateId={debate.id}
                  currentPhase={debate.currentPhase}
                  onUpdatePhase={handleUpdatePhase}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;