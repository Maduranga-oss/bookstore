"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function Signup({ onClose, switchToLogin, isModal = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  const { signup, error, clearError } = useAuth();

  // Clear errors when form fields change
  useEffect(() => {
    clearError();
    setValidationError('');
  }, [email, password, name, clearError]);

  // Enhanced validation helpers
  const validateForm = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    
    if (!trimmedName) {
      return 'Full name is required';
    }
    if (trimmedName.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    if (!trimmedEmail) {
      return 'Email address is required';
    }
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address';
    }
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    const validationErr = validateForm();
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setLoading(true);

    try {
      console.log('Signup: Attempting signup with:', { email, name, password: '***' });

      const result = await signup({
        email: email.trim(),
        password,
        name: name.trim()
      });
      
      console.log('Signup: Result:', result);
      
      if (result && result.success) {
        console.log('Signup: Success! Closing modal...');
        if (onClose) {
          onClose();
        }
      } else {
        console.log('Signup: Failed:', result?.error);
        // Clear password on failed signup for security
        setPassword('');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setPassword('');
    }
    
    setLoading(false);
  };

  const displayError = validationError || error;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-600 mt-1">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              required
              placeholder="Enter your full name"
              autoComplete="name"
              disabled={loading}
              minLength="2"
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              required
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                required
                placeholder="Create a password"
                autoComplete="new-password"
                disabled={loading}
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={loading ? -1 : 0}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
              {displayError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creating account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Switch to Login */}
        {switchToLogin && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={switchToLogin}
                className="text-green-600 hover:text-green-700 font-medium hover:underline"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}