import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загрузка из localStorage при старте
    const token = localStorage.getItem('token');
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');

    if (token && savedUserId && savedUsername) {
      setUser({
        token,
        userId: savedUserId,
        username: savedUsername,
        role: savedRole || null
      });
    }
    setIsLoading(false);
  }, []);

  const login = (token, userId = null, username = null, role = null) => {
    localStorage.setItem('token', token);

    // Парсим JWT если нет userId/username
    if (!userId || !username) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || payload.sub;
        username = payload.username;
        role = payload.role;
      } catch (e) {
        console.error('JWT parse error:', e);
      }
    }

    // Сохраняем объект
    const userData = { token, userId, username, role };
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    if (role) localStorage.setItem('role', role);

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setUser(null);
  };

  const forceLogout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
    {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
