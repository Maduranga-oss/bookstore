"use client";

import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Cart reducer to manage cart state
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        loading: false,
        error: null
      };

    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity, updating: true }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'CLEAR_UPDATING':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload
            ? { ...item, updating: false }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ITEM_LOADING':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, loading: action.payload.loading }
            : item
        )
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'OPEN_CART':
      return {
        ...state,
        isOpen: true
      };

    case 'CLOSE_CART':
      return {
        ...state,
        isOpen: false
      };

    // New action for retry mechanism
    case 'RETRY_FAILED_OPERATION':
      return {
        ...state,
        retryOperation: action.payload
      };

    default:
      return state;
  }
};

// Initial cart state
const initialState = {
  items: [],
  isOpen: false,
  loading: false,
  error: null,
  retryOperation: null
};

// Enhanced toast notification helper with better UX
const showToast = (message, type = 'success', duration = 5000) => {
  // Remove existing toasts of the same type to prevent spam
  const existingToasts = document.querySelectorAll(`.cart-toast-${type}`);
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `cart-toast cart-toast-${type} fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm text-white transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
  }`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
  
  toast.innerHTML = `
    <div class="flex items-center">
      <span class="mr-2 font-bold">${icon}</span>
      <span class="flex-1">${message}</span>
      <button class="ml-2 text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after specified duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Enhanced auth token helper with expiry check
  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token) return null;
    
    if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      return null;
    }
    
    return token;
  }, []);

  // Enhanced API request helper with retry logic
  const makeAuthenticatedRequest = useCallback(async (url, options = {}, retryCount = 0) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('tokenExpiry');
          throw new Error('Session expired. Please log in again.');
        }
        
        if (response.status === 429 && retryCount < 2) {
          // Rate limiting - retry after delay
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return makeAuthenticatedRequest(url, options, retryCount + 1);
        }
        
        throw new Error(responseData.error || `Request failed with status ${response.status}`);
      }

      return responseData;
    } catch (error) {
      if (error.name === 'TypeError' && retryCount < 1) {
        // Network error - retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        return makeAuthenticatedRequest(url, options, retryCount + 1);
      }
      throw error;
    }
  }, [getAuthToken]);

  // Load cart from API with better error handling
  const loadCart = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const data = await makeAuthenticatedRequest('/api/cart');
      
      if (data.success) {
        const items = data.cart?.items?.map(item => ({
          id: item.book.id,
          title: item.book.title,
          author: item.book.author,
          price: parseFloat(item.book.price),
          coverImageUrl: item.book.coverImageUrl,
          quantity: item.quantity,
          stock: item.book.stock,
          loading: false,
          updating: false
        })) || [];
        
        dispatch({ type: 'SET_CART', payload: { items } });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_CART', payload: { items: [] } });
      
      if (error.message.includes('log in')) {
        showToast(error.message, 'warning');
      } else {
        showToast('Failed to load cart. Please try again.', 'error');
      }
    }
  }, [isAuthenticated, makeAuthenticatedRequest]);

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [isAuthenticated, user, loadCart]);

  // Calculate cart items count with memoization
  const cartItemsCount = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  // Calculate cart total with memoization
  const cartTotal = useMemo(() => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [state.items]);

  // Enhanced add to cart with stock validation
  const addToCart = useCallback(async (item, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to cart', 'warning');
      return false;
    }

    // Check stock availability
    if (item.stock !== undefined && quantity > item.stock) {
      showToast(`Only ${item.stock} items available in stock`, 'warning');
      return false;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const data = await makeAuthenticatedRequest('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          bookId: item.id,
          quantity: quantity
        })
      });

      if (data.success) {
        const items = data.cart?.items?.map(cartItem => ({
          id: cartItem.book.id,
          title: cartItem.book.title,
          author: cartItem.book.author,
          price: parseFloat(cartItem.book.price),
          coverImageUrl: cartItem.book.coverImageUrl,
          quantity: cartItem.quantity,
          stock: cartItem.book.stock,
          loading: false,
          updating: false
        })) || [];
        
        dispatch({ type: 'SET_CART', payload: { items } });
        showToast(data.message || 'Item added to cart successfully!', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      showToast(error.message || 'Failed to add item to cart', 'error');
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, makeAuthenticatedRequest]);

  // Enhanced remove from cart with better UX
  const removeFromCart = useCallback(async (itemId) => {
    if (!isAuthenticated) return false;

    const originalItems = [...state.items];
    
    try {
      // Optimistic update
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      
      const data = await makeAuthenticatedRequest('/api/cart/update', {
        method: 'DELETE',
        body: JSON.stringify({ bookId: itemId })
      });

      if (data.success) {
        const items = data.cart?.items?.map(cartItem => ({
          id: cartItem.book.id,
          title: cartItem.book.title,
          author: cartItem.book.author,
          price: parseFloat(cartItem.book.price),
          coverImageUrl: cartItem.book.coverImageUrl,
          quantity: cartItem.quantity,
          stock: cartItem.book.stock,
          loading: false,
          updating: false
        })) || [];
        
        dispatch({ type: 'SET_CART', payload: { items } });
        showToast(data.message || 'Item removed from cart', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Revert optimistic update
      dispatch({ type: 'SET_CART', payload: { items: originalItems } });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      showToast(error.message || 'Failed to remove item', 'error');
      return false;
    }
  }, [isAuthenticated, makeAuthenticatedRequest, state.items]);

  // Enhanced update quantity with debouncing
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated) return false;

    if (quantity < 1) {
      return await removeFromCart(itemId);
    }

    // Check stock availability
    const item = state.items.find(item => item.id === itemId);
    if (item?.stock !== undefined && quantity > item.stock) {
      showToast(`Only ${item.stock} items available in stock`, 'warning');
      return false;
    }

    const originalItems = [...state.items];

    try {
      // Optimistic update
      dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id: itemId, quantity } });

      const data = await makeAuthenticatedRequest('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({
          bookId: itemId,
          quantity: quantity
        })
      });

      if (data.success) {
        dispatch({ type: 'CLEAR_UPDATING', payload: itemId });
        
        const items = data.cart?.items?.map(cartItem => ({
          id: cartItem.book.id,
          title: cartItem.book.title,
          author: cartItem.book.author,
          price: parseFloat(cartItem.book.price),
          coverImageUrl: cartItem.book.coverImageUrl,
          quantity: cartItem.quantity,
          stock: cartItem.book.stock,
          loading: false,
          updating: false
        })) || [];
        
        dispatch({ type: 'SET_CART', payload: { items } });
        
        // Show toast only for significant changes
        const originalQuantity = originalItems.find(item => item.id === itemId)?.quantity || 0;
        if (Math.abs(quantity - originalQuantity) > 2) {
          showToast(data.message || 'Quantity updated successfully', 'success');
        }
        return true;
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert optimistic update
      dispatch({ type: 'SET_CART', payload: { items: originalItems } });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      showToast(error.message || 'Failed to update quantity', 'error');
      return false;
    }
  }, [isAuthenticated, makeAuthenticatedRequest, removeFromCart, state.items]);

  // Enhanced clear cart with confirmation
  const clearCart = useCallback(async (skipConfirmation = false) => {
    if (!isAuthenticated) return false;

    if (!skipConfirmation && state.items.length > 0) {
      const confirmed = window.confirm('Are you sure you want to clear your cart? This action cannot be undone.');
      if (!confirmed) return false;
    }

    const originalItems = [...state.items];

    try {
      // Optimistic update
      dispatch({ type: 'CLEAR_CART' });

      const data = await makeAuthenticatedRequest('/api/cart/clear', {
        method: 'DELETE'
      });

      if (data.success) {
        showToast(data.message || 'Cart cleared successfully', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Revert optimistic update
      dispatch({ type: 'SET_CART', payload: { items: originalItems } });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      showToast(error.message || 'Failed to clear cart', 'error');
      return false;
    }
  }, [isAuthenticated, makeAuthenticatedRequest, state.items]);

  const openCart = useCallback(() => {
    dispatch({ type: 'OPEN_CART' });
  }, []);

  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Helper function to check if item is in cart
  const isInCart = useCallback((itemId) => {
    return state.items.some(item => item.id === itemId);
  }, [state.items]);

  // Helper function to get item quantity in cart
  const getItemQuantity = useCallback((itemId) => {
    const item = state.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  }, [state.items]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    items: state.items,
    isOpen: state.isOpen,
    loading: state.loading,
    error: state.error,
    cartItemsCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    loadCart,
    clearError,
    isInCart,
    getItemQuantity
  }), [
    state.items,
    state.isOpen,
    state.loading,
    state.error,
    cartItemsCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    loadCart,
    clearError,
    isInCart,
    getItemQuantity
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}