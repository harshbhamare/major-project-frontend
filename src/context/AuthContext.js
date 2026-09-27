import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (name, email, password, role) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateGamification = (stats) => {
    if (!stats) return;
    setUser(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        xp: stats.totalXp ?? stats.xp ?? prev.xp,
        level: stats.level ?? prev.level,
        streak: stats.streak ?? prev.streak,
        badges: stats.allBadges ?? stats.badges ?? prev.badges,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(prev => {
        const updated = { ...prev, ...data };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateGamification, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
