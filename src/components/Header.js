"use client";

import { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import AuthModal from './AuthModal';
import CartModal from './CartModal';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { cartItemsCount, openCart } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCloseModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const handleOpenAuth = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const handleCartClick = useCallback(() => {
    if (isAuthenticated) {
      openCart();
    }
  }, [isAuthenticated, openCart]);

  const getUserInitials = useCallback((name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0]?.toUpperCase())
      .slice(0, 2)
      .join('');
  }, []);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
                  <span className="text-white text-xl font-bold">📚</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-blue-700 dark:group-hover:from-blue-400 dark:group-hover:to-blue-300 transition-all duration-300">
                    BookHub
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Discover Your Next Read</p>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-6">
              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Cart Button - Enhanced */}
              {isAuthenticated && (
                <button
                  onClick={handleCartClick}
                  className="relative group p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl"
                  aria-label={`Shopping cart with ${cartItemsCount} items`}
                >
                  <div className="relative">
                    <svg 
                      className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.195.195-.195.512 0 .707.098.098.226.147.353.147H19M7 13v4a2 2 0 002 2h8a2 2 0 002-2v-4m-8 2a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" 
                      />
                    </svg>
                    
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                        {cartItemsCount > 99 ? '99+' : cartItemsCount}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Auth Section */}
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Loading...</span>
                </div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* User Profile Section */}
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-2 border border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                        {getUserInitials(user?.name)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Welcome back!
                      </p>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    className="group relative px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline">Sign Out</span>
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleOpenAuth}
                  className="group relative px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In</span>
                  </span>
                </button>
              )}

              {/* Mobile Theme Toggle */}
              <div className="sm:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom border gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
      </header>

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
      <CartModal />
    </>
  );
}