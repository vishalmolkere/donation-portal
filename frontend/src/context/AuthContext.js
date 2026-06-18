import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const saveUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, ...userData } = res.data.data;
    localStorage.setItem('token', token);
    saveUser(userData);        // includes isVerified + emergencyLocked
    return userData;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token, ...userData } = res.data.data;
    localStorage.setItem('token', token);
    saveUser(userData);
    return userData;
  };

  // Call after admin verifies the user so UI updates without re-login
  const refreshUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    saveUser(updated);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin        = () => user?.role === 'ROLE_ADMIN';
  const isDonor        = () => user?.role === 'ROLE_DONOR';
  const isReceiver     = () => user?.role === 'ROLE_RECEIVER';
  const isAuthenticated = () => !!user;
  const isVerified     = () => !!user?.isVerified;
  const isEmergencyLocked = () => !!user?.emergencyLocked;

  const getRoleLabel = () => {
    if (isAdmin())    return 'Admin';
    if (isReceiver()) return 'Receiver';
    return 'Donor';
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login, register, logout, refreshUser,
      isAdmin, isDonor, isReceiver, isAuthenticated,
      isVerified, isEmergencyLocked, getRoleLabel,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
