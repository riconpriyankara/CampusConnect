import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../services/api';
import { useNotifications } from './NotificationContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast, fetchNotifications } = useNotifications();

  // Load user profile on startup if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          if (res.data.success) {
            setUser(res.data.user);
            // Fetch unread notification badges
            fetchNotifications();
          } else {
            logout();
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, fetchNotifications]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Successfully logged in!', 'success');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      showToast(msg, 'error');
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  // Register handler
  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setToken(res.data.token);
        setUser(res.data.user);
        showToast('Registration successful! Welcome!', 'success');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      showToast(msg, 'error');
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  // Profile Update
  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/api/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setUser((prev) => ({ ...prev, ...res.data.user }));
        localStorage.setItem('user', JSON.stringify(res.data.user));
        showToast('Profile updated successfully!', 'success');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Update failed';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  }, [showToast]);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
