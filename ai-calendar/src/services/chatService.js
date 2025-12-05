const API_URL = 'http://localhost:4000/chat';

export const chatService = {
    getUserSessions: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch sessions');
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            return { sessions: [] };
        }
    },

    createSession: async (userId, title) => {
        try {
            const response = await fetch(`${API_URL}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, title })
            });
            if (!response.ok) throw new Error('Failed to create session');
            return await response.json();
        } catch (error) {
            console.error("Failed to create session:", error);
        }
    },

    getSessionMessages: async (sessionId) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`);
            if (!response.ok) throw new Error('Failed to fetch messages');
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            return { messages: [] };
        }
    },

    saveMessage: async (sessionId, role, text) => {
        try {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, role, text })
            });
            if (!response.ok) throw new Error('Failed to save message');
            return await response.json();
        } catch (error) {
            console.error("Failed to save chat message:", error);
        }
    },

    deleteSession: async (sessionId) => {
        try {
            await fetch(`${API_URL}/sessions/${sessionId}`, { method: 'DELETE' });
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    },

    updateSessionTitle: async (sessionId, title) => {
        try {
            const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title })
            });
            return await response.json();
        } catch (error) {
            console.error("Failed to update session title:", error);
        }
    },

    getRecentContext: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/context/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch context');
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch recent context:", error);
            return { context: [] };
        }
    }
};
