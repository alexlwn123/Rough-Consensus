// Storage utility functions for persisting debate-related data

const ACTIVE_DEBATE_KEY = "active_debate_id";

/**
 * Stores the active debate ID in browser's localStorage
 * @param debateId The ID of the active debate to store
 */
export const storeActiveDebateId = (debateId: string): void => {
  if (!debateId) return;

  try {
    localStorage.setItem(ACTIVE_DEBATE_KEY, debateId);
    console.log("stored debateId", debateId);
  } catch (error) {
    console.error("Failed to store active debate ID in localStorage:", error);
  }
};

/**
 * Retrieves the active debate ID from browser's localStorage
 * @returns The stored debate ID or null if not found
 */
export const getActiveDebateId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_DEBATE_KEY);
  } catch (error) {
    console.error(
      "Failed to retrieve active debate ID from localStorage:",
      error
    );
    return null;
  }
};
