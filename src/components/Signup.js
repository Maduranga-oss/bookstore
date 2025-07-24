"use client";

import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function Signup({ onClose, switchToLogin, isModal = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signup, error, clearError } = useAuth();

  // Clear errors when form fields change
  const handleInputChange = (setter) => (e) => {
    clearError();
    setter(e.target.value);
  };

  // Validation helpers
  const validateForm = () => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

    const validationError = validateForm();
    if (validationError) {
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

  // Handle "Enter" key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  // Real-time password strength feedback
  const getPasswordStrength = () => {
    if (password.length === 0) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Password must be at least 6 characters', color: 'text-red-500' };
    if (password.length < 8) return { text: 'Good password', color: 'text-yellow-500' };
    return { text: 'Strong password', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            value={name}
            onChange={handleInputChange(setName)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
            placeholder="Enter your full name"
            autoComplete="name"
            disabled={loading}
            minLength="2"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={handleInputChange(setEmail)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            required
            placeholder="Enter your email"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handleInputChange(setPassword)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
              placeholder="Create a password"
              autoComplete="new-password"
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
          {password && passwordStrength.text && (
            <p className={`text-xs mt-1 ${passwordStrength.color}`}>
              {passwordStrength.text}
            </p>
          )}
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
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Creating account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      {switchToLogin && (
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={switchToLogin}
              className="text-green-600 hover:text-green-700 font-medium hover:underline focus:outline-none focus:underline"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
}