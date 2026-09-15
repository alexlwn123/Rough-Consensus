import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Navigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import AdminPhaseController from "../components/admin/AdminPhaseController";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { getPhaseDisplay } from "../lib/utils";
import type { Phase } from "../types";

function AdminPage() {
  const { currentUser, loading } = useAuth();
  const data = useQuery(
    api.debates.listVisible,
    currentUser?.isAdmin ? {} : "skip",
  );
  const debates = data ?? [];
  const isLoading = data === undefined;
  const create = useMutation(api.debates.create);
  const setPhase = useMutation(api.debates.setPhase);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  if (loading)
    return <div className="flex justify-center p-12">Loading...</div>;
  if (!currentUser?.isAdmin) return <Navigate to="/" replace />;
  const handleCreateDebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating || !formData.title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await create({ publicId: crypto.randomUUID(), ...formData });
      setFormData({ title: "", description: "" });
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the debate.",
      );
    } finally {
      setCreating(false);
    }
  };
  const handleUpdatePhase = async (debateId: string, phase: Phase) => {
    const debate = debates.find((d) => d.id === debateId);
    if (!debate) return;
    setError(null);
    try {
      await setPhase({
        publicId: debateId,
        phase,
        expectedVersion: debate.phaseVersion,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update the phase.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Admin Dashboard" showBack />
      {error && (
        <p role="alert" className="p-4 text-red-700">
          {error}
        </p>
      )}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Debates</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "Create New Debate"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">
              Create New Debate
            </h3>
            <form onSubmit={handleCreateDebate} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Debate
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4">Loading debates...</div>
        ) : debates.length === 0 ? (
          <div className="text-center py-4">
            No debates found. Create one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {debates.map((debate) => (
              <div
                key={debate.id}
                className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4 sm:p-6 space-y-3">
                  <span className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-semibold line-clamp-2">
                      {debate.title}
                    </h3>
                  </span>
                  <p className="text-gray-600 text-sm sm:text-base line-clamp-3">
                    {debate.description || "No description provided"}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium w-fit ${
                        debate.currentPhase === "scheduled"
                          ? "bg-blue-100 text-blue-800"
                          : debate.currentPhase === "pre"
                            ? "bg-yellow-100 text-yellow-800"
                            : debate.currentPhase === "post"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getPhaseDisplay(debate.currentPhase)}
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
      <Footer />
    </div>
  );
}

export default AdminPage;
