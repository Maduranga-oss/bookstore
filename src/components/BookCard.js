"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';

export default function BookCard({ book, priority = false }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!book) return null;

  const handleImageError = () => {
    console.warn("Image failed to load for book:", book.title);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => setImageLoading(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to cart', 'warning');
      return;
    }

    if (!book.id) {
      console.error('Book ID is missing');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart({
        id: book.id,
        title: book.title || "Unknown Title",
        price: parseFloat(book.price) || 0,
        author: book.author || "Unknown Author",
        coverImageUrl: book.coverImageUrl
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showToast = (message, type = 'info') => {
    const existingToasts = document.querySelectorAll('.book-toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `book-toast fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm text-white transform transition-all duration-300 cursor-pointer ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    toast.innerHTML = `
      <div class="flex items-center">
        <span class="flex-1">${message}</span>
        <button class="ml-2 text-white hover:text-gray-200 cursor-pointer" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    toast.style.transform = 'translateX(100%)';
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  };

  const fallbackImage = "https://via.placeholder.com/300x400/e2e8f0/64748b?text=No+Image";
  const imageUrl = imageError || !book.coverImageUrl ? fallbackImage : book.coverImageUrl;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 dark:border-gray-700 cursor-pointer">
      <div className="relative w-full h-72 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        <Image
          src={imageUrl}
          alt={book.title || "Book Cover"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className={`object-cover transition-all duration-300 cursor-pointer ${
            imageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
          } group-hover:scale-105`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority={priority}
        />

        <div
          className="absolute top-3 right-3 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full shadow-md cursor-default"
          title={`Price: $${parseFloat(book.price || 0).toFixed(2)}`}
        >
          ${parseFloat(book.price || 0).toFixed(2)}
        </div>

        {book.stock !== undefined && book.stock <= 5 && (
          <div className="absolute top-3 left-3">
            {book.stock === 0 ? (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full cursor-default">
                Out of Stock
              </span>
            ) : (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full cursor-default">
                Only {book.stock} left
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="min-h-[4rem]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 group-hover:text-blue-700 transition duration-150 leading-snug cursor-pointer">
            {book.title || "Unknown Title"}
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 cursor-default">
          by {book.author || "Unknown Author"}
        </p>

        {book.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 cursor-default">
            {book.description}
          </p>
        )}

        <div className="pt-2">
          <button
            onClick={handleAddToCart}
            aria-disabled={!isAuthenticated || addingToCart || book.stock === 0}
            disabled={!isAuthenticated || addingToCart || book.stock === 0}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              !isAuthenticated
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : book.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : addingToCart
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105 active:scale-95 cursor-pointer'
            }`}
          >
            {addingToCart ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Adding...</span>
              </div>
            ) : book.stock === 0 ? (
              'Out of Stock'
            ) : !isAuthenticated ? (
              'Login to Purchase'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}