"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Token management utilities
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }, []);

  const setToken = useCallback((token) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Error setting token in localStorage:', error);
    }
  }, []);

  const removeToken = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
  }, []);

  // Check if user is logged in on mount
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        removeToken();
        setUser(null);
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Authentication check failed' };
        }
        setError(errorData.error || 'Authentication check failed');
        removeToken();
        setUser(null);
      }
    } catch (error) {
      setError('Network error during authentication check');
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [getToken, removeToken]);

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);

    if (!email || !password) {
      const errorMessage = 'Email and password are required';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!email.includes('@')) {
      const errorMessage = 'Please enter a valid email address';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        const errorMessage = data.error || 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [setToken]);

  const signup = useCallback(async (userData) => {
    setError(null);

    if (!userData.email || !userData.password || !userData.name) {
      const errorMessage = 'Email, password, and name are required';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (!userData.email.includes('@')) {
      const errorMessage = 'Please enter a valid email address';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (userData.password.length < 6) {
      const errorMessage = 'Password must be at least 6 characters long';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...userData,
          email: userData.email.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        const errorMessage = data.error || 'Signup failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [setToken]);

  const logout = useCallback(async () => {
    try {
      const token = getToken();
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
          });
        } catch (error) {
          // Don't fail logout if server call fails
          console.warn('Server logout failed:', error);
        }
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      removeToken();
      setUser(null);
      setError(null);
    }
  }, [getToken, removeToken]);

  const refreshAuth = useCallback(() => {
    return checkAuthStatus();
  }, [checkAuthStatus]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    login,
    signup,
    logout,
    refreshAuth,
    loading,
    error,
    isAuthenticated: !!user,
    clearError: () => setError(null)
  }), [user, login, signup, logout, refreshAuth, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}