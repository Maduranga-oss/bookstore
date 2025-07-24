"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    console.log('AuthContext: Component mounted, checking auth status');
    checkAuthStatus();
  }, []);

  // Debug: Log whenever user state changes
  useEffect(() => {
    console.log('AuthContext: User state changed:', user);
  }, [user]);

  // Token management utilities
  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  const setToken = useCallback((token) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  }, []);

  const removeToken = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('AuthContext: Checking auth status...');
      setError(null);
      
      const token = getToken();
      console.log('AuthContext: Token from localStorage:', token ? 'exists' : 'not found');
      
      if (!token) {
        console.log('AuthContext: No token found, setting loading to false');
        setLoading(false);
        return;
      }

      console.log('AuthContext: Making request to /api/auth/me');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('AuthContext: /api/auth/me response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('AuthContext: User data received:', userData);
        setUser(userData);
      } else if (response.status === 401) {
        // Token is invalid or expired
        console.log('AuthContext: Token invalid/expired, removing token');
        removeToken();
        setUser(null);
      } else {
        // Other error
        console.log('AuthContext: /api/auth/me failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Authentication check failed');
        removeToken();
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Auth check failed:', error);
      setError('Network error during authentication check');
      removeToken();
      setUser(null);
    } finally {
      console.log('AuthContext: Setting loading to false');
      setLoading(false);
    }
  }, [getToken, removeToken]);

  const login = useCallback(async (email, password) => {
    try {
      console.log('AuthContext: Login attempt for:', email);
      setError(null);
      
      // Basic client-side validation
      if (!email || !password) {
        return { 
          success: false, 
          error: 'Email and password are required' 
        };
      }

      if (!email.includes('@')) {
        return { 
          success: false, 
          error: 'Please enter a valid email address' 
        };
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      console.log('AuthContext: Login response status:', response.status);
      
      const data = await response.json();
      console.log('AuthContext: Login response data:', data);

      if (response.ok && data.success) {
        console.log('AuthContext: Login successful, storing token and setting user');
        
        // Store token
        setToken(data.token);
        
        // Set user data
        setUser(data.user);
        
        console.log('AuthContext: User set to:', data.user);
        console.log('AuthContext: isAuthenticated should now be:', !!data.user);
        
        return { success: true, user: data.user };
      } else {
        console.log('AuthContext: Login failed:', data.error);
        const errorMessage = data.error || 'Login failed';
        setError(errorMessage);
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, [setToken]);

  const signup = useCallback(async (userData) => {
    try {
      setError(null);
      
      // Basic client-side validation
      if (!userData.email || !userData.password) {
        return { 
          success: false, 
          error: 'Email and password are required' 
        };
      }

      if (!userData.email.includes('@')) {
        return { 
          success: false, 
          error: 'Please enter a valid email address' 
        };
      }

      if (userData.password.length < 6) {
        return { 
          success: false, 
          error: 'Password must be at least 6 characters long' 
        };
      }
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('AuthContext: Signup error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, [setToken]);

  const logout = useCallback(async () => {
    try {
      const token = getToken();
      
      // Call logout endpoint if token exists
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).catch(error => {
          // Don't fail logout if server call fails
          console.warn('Server logout failed:', error);
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local state
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

  console.log('AuthContext: Providing context with:', {
    user: user ? 'exists' : 'null',
    loading,
    isAuthenticated: !!user,
    error: error || 'none'
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}