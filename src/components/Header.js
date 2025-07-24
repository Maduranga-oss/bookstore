"use client";

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import AuthModal from './AuthModal';
import CartModal from './CartModal';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { cartItemsCount, openCart } = useCart();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleCloseModal = () => setIsAuthModalOpen(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              BookHub
            </h1>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Cart Icon - Only show when authenticated */}
              {isAuthenticated && (
                <button
                  onClick={openCart}
                  className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  aria-label={`Cart with ${cartItemsCount} items`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6m0 0h9M17 17a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount > 99 ? '99+' : cartItemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Auth Section */}
              {loading ? (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin" aria-label="Loading"></div>
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                      {user?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseModal} />
      <CartModal />
    </>
  );
}