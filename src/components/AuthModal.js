"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import Login from './Login';
import Signup from './Signup';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const { clearError } = useAuth();

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(initialMode === 'login');
      clearError();
    }
  }, [isOpen, initialMode, clearError]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open and add blur effect
      document.body.style.overflow = 'hidden';
      // Add blur to the main content behind modal
      const mainContent = document.getElementById('main-content') || document.body;
      if (mainContent !== document.body) {
        mainContent.style.filter = 'blur(4px)';
        mainContent.style.transition = 'filter 0.3s ease-in-out';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      // Remove blur effect
      const mainContent = document.getElementById('main-content') || document.body;
      if (mainContent !== document.body) {
        mainContent.style.filter = 'none';
      }
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  const switchToLogin = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(true);
      clearError();
      setIsAnimating(false);
    }, 150);
  };

  const switchToSignup = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(false);
      clearError();
      setIsAnimating(false);
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Safari support
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className={`relative w-full max-w-md bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl transform transition-all duration-300 border border-white/20 ${
          isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
        }`}
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-white/50 backdrop-blur-sm"
          aria-label="Close modal"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        {/* Modal content */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <h2 id="auth-modal-title" className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin 
                ? 'Sign in to your account to continue' 
                : 'Join us today and get started'
              }
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-6 bg-gray-100/80 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={switchToLogin}
              disabled={isAnimating}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                isLogin
                  ? 'bg-white/90 text-gray-900 shadow-sm backdrop-blur-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              } ${isAnimating ? 'opacity-50' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={switchToSignup}
              disabled={isAnimating}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                !isLogin
                  ? 'bg-white/90 text-gray-900 shadow-sm backdrop-blur-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
              } ${isAnimating ? 'opacity-50' : ''}`}
            >
              Sign Up
            </button>
          </div>

          {/* Form content */}
          <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            {isLogin ? (
              <Login 
                onClose={onClose} 
                switchToSignup={switchToSignup}
                isModal={true}
              />
            ) : (
              <Signup 
                onClose={onClose} 
                switchToLogin={switchToLogin}
                isModal={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}