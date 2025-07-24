"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function Login({ onClose, switchToSignup, isModal = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated, error, clearError } = useAuth();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Clear errors when component mounts or email changes
  useEffect(() => {
    clearError();
  }, [email, clearError]);

  // Client-side validation
  const validateForm = () => {
    if (!email.trim()) {
      return 'Email address is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    
    if (!password) {
      return 'Password is required';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      
      if (result && result.success) {
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Close modal on successful login
        if (onClose) {
          onClose();
        }
      } else {
        // Clear password on failed login for security
        setPassword('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setPassword('');
    }
    
    setLoading(false);
  };

  // Handle "Enter" key press on form elements
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  // If user is authenticated, don't show login form
  if (isAuthenticated) {
    if (onClose) onClose();
    return null;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              tabIndex={loading ? -1 : 0}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          
          <button
            type="button"
            onClick={() => {
              // TODO: Implement forgot password functionality
              alert('Forgot password functionality will be implemented soon!');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:underline"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200 flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      {switchToSignup && (
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              onClick={switchToSignup}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none focus:underline"
              disabled={loading}
            >
              Sign up here
            </button>
          </p>
        </div>
      )}
    </div>
  );
}