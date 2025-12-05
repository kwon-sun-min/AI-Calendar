const API_URL = 'http://localhost:4000/chat';

export const chatService = {
    getHistory: async (userId) => {
        try {
            const response = await fetch(`${API_URL}/${userId}`);
            if (!response.ok) {
                if (response.status === 404) return { history: [] };
                throw new Error('Failed to fetch history');
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch chat history:", error);
            return { history: [] };
        }
    },
    saveMessage: async (userId, role, text) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role, text })
            });
            if (!response.ok) throw new Error('Failed to save message');
            return await response.json();
        } catch (error) {
            console.error("Failed to save chat message:", error);
        }
    },
    clearHistory: async (userId) => {
        try {
            await fetch(`${API_URL}/${userId}`, { method: 'DELETE' });
        } catch (error) {
            console.error("Failed to clear chat history:", error);
        }
    }
};
