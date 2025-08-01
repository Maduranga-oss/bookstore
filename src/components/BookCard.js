"use client";

import Image from "next/image";
import { useState, useCallback, useMemo } from "react";
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';

// Skeleton component for loading state
function BookCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse h-[580px] flex flex-col">
      <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
      <div className="p-6 space-y-4 flex-grow flex flex-col">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3"></div>
        <div className="flex-grow"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

export default function BookCard({ book, priority = false }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // All hooks must be called before any early returns
  const fallbackImage = "https://via.placeholder.com/400x600/f8fafc/64748b?text=No+Image+Available";
  
  const imageUrl = useMemo(() => 
    imageError || !book?.coverImageUrl ? fallbackImage : book.coverImageUrl,
    [imageError, book?.coverImageUrl, fallbackImage]
  );

  const formattedPrice = useMemo(() => 
    parseFloat(book?.price || 0).toFixed(2),
    [book?.price]
  );

  const handleImageError = useCallback(() => {
    console.warn("Image failed to load for book:", book?.title);
    setImageError(true);
    setImageLoading(false);
  }, [book?.title]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    // Remove existing toasts
    document.querySelectorAll('.book-toast').forEach(toast => toast.remove());

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500'
    };

    toast.className = `book-toast fixed top-6 right-6 px-6 py-4 rounded-xl shadow-2xl z-[9999] max-w-sm text-white transform transition-all duration-300 backdrop-blur-sm ${bgColors[type]} border border-white/20`;
    
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 mt-0.5">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium leading-relaxed">${message}</p>
        </div>
        <button class="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors" type="button" aria-label="Close">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    const closeBtn = toast.querySelector('button');
    const closeToast = () => {
      toast.style.transform = 'translateX(100%) scale(0.95)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    };

    closeBtn.onclick = closeToast;
    toast.onclick = (e) => {
      if (e.target === toast || e.target.closest('.flex')) closeToast();
    };

    // Initial animation
    toast.style.transform = 'translateX(100%) scale(0.95)';
    toast.style.opacity = '0';
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0) scale(1)';
      toast.style.opacity = '1';
    });

    // Auto close
    setTimeout(closeToast, 5000);
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart', 'warning');
      return;
    }

    if (!book?.id) {
      console.error('Book ID is missing');
      showToast('Unable to add item - book information incomplete', 'error');
      return;
    }

    if (book.stock === 0) {
      showToast('This item is currently out of stock', 'warning');
      return;
    }

    setAddingToCart(true);
    try {
      const result = await addToCart({
        id: book.id,
        title: book.title || "Unknown Title",
        price: parseFloat(book.price) || 0,
        author: book.author || "Unknown Author",
        coverImageUrl: book.coverImageUrl
      });

      // Handle the result from addToCart
      if (result && result.success === false) {
        // If addToCart returns an error (like max quantity reached)
        showToast(result.message || 'Unable to add more items to cart', 'warning');
      } else if (result && result.maxQuantityReached) {
        // If max quantity was reached
        showToast(`You already have the maximum available quantity (${book.stock}) in your cart`, 'warning');
      } else {
        // Success case
        showToast('Successfully added to cart!', 'success');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Check if the error contains a specific message about max quantity
      if (error.message && error.message.includes('maximum available quantity')) {
        showToast(error.message, 'warning');
      } else {
        showToast('Failed to add item to cart. Please try again.', 'error');
      }
    } finally {
      setAddingToCart(false);
    }
  }, [isAuthenticated, book, addToCart, showToast]);

  // Now we can safely do early returns after all hooks are called
  if (!book) {
    return <BookCardSkeleton />;
  }

  const isOutOfStock = book.stock === 0;
  const isLowStock = book.stock !== undefined && book.stock <= 5 && book.stock > 0;

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-2 h-[580px] flex flex-col">
      {/* Image Container */}
      <div className="relative w-full h-80 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden flex-shrink-0">
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        <Image
          src={imageUrl}
          alt={`${book?.title || 'Book'} cover`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-all duration-700 ${
            imageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
          } group-hover:scale-110`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority={priority}
        />

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-gray-100 text-sm font-bold px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
          <span className="text-emerald-600 dark:text-emerald-400">${formattedPrice}</span>
        </div>

        {/* Stock Status */}
        {(isOutOfStock || isLowStock) && (
          <div className="absolute top-4 left-4">
            {isOutOfStock ? (
              <span className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                Out of Stock
              </span>
            ) : (
              <span className="bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                Only {book?.stock} left
              </span>
            )}
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Title */}
        <div className="min-h-[3rem] mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
            {book?.title || "Unknown Title"}
          </h3>
        </div>

        {/* Author */}
        <p className="text-gray-600 dark:text-gray-400 font-medium text-sm mb-3">
          by <span className="text-gray-800 dark:text-gray-200">{book?.author || "Unknown Author"}</span>
        </p>

        {/* Description */}
        <div className="flex-grow mb-4">
          {book?.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
              {book.description}
            </p>
          )}
        </div>

        {/* Action Button - Always at bottom */}
        <div className="mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={!isAuthenticated || addingToCart || isOutOfStock}
            className={`w-full px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform ${
              !isAuthenticated
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                : isOutOfStock
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                : addingToCart
                ? 'bg-blue-400 text-white cursor-wait shadow-lg'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:scale-105 active:scale-95'
            }`}
          >
            {addingToCart ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Adding to Cart...</span>
              </div>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : !isAuthenticated ? (
              'Sign In to Purchase'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}