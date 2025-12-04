
const USERS_KEY = 'calendar_users';
const CURRENT_USER_KEY = 'calendar_current_user';

export const authService = {
    signup: (email, password, name) => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

        if (users.find(u => u.email === email)) {
            throw new Error('이미 존재하는 이메일입니다.');
        }

        const newUser = {
            id: crypto.randomUUID(),
            email,
            password, // In a real app, this should be hashed!
            name,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Auto login after signup
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        }));

        return newUser;
    },

    login: (email, password) => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
        }

        const sessionUser = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
        return sessionUser;
    },

    setSession: (user) => {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem(CURRENT_USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem(CURRENT_USER_KEY);
    }
};
