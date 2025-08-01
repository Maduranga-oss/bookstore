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

// Enhanced toast notification system
class ToastManager {
  static createToast(message, type = 'success', duration = 4000) {
    // Remove existing toasts of the same type
    const existingToasts = document.querySelectorAll(`.cart-toast-${type}`);
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    const toastId = `toast-${Date.now()}`;
    toast.id = toastId;
    toast.className = `cart-toast cart-toast-${type} fixed top-6 right-6 px-5 py-4 rounded-xl shadow-2xl z-50 max-w-sm transform transition-all duration-300 ease-out`;
    
    const colors = {
      success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
      error: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      info: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
    };
    
    const icons = {
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                 </svg>`,
      error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>`,
      warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>`,
      info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
             </svg>`
    };
    
    toast.className += ` ${colors[type]}`;
    
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3 mt-0.5">
          ${icons[type]}
        </div>
        <div class="flex-1 pr-2">
          <p class="text-sm font-medium leading-relaxed">${message}</p>
        </div>
        <button class="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors" onclick="document.getElementById('${toastId}').remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    
    // Add initial transform for animation
    toast.style.transform = 'translateX(100%)';
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });
    
    // Auto-remove after duration
    setTimeout(() => {
      if (document.getElementById(toastId)) {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
    
    return toast;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Enhanced auth token helper with expiry check
  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const token = window.localStorage.getItem('token');
    const tokenExpiry = window.localStorage.getItem('tokenExpiry');
    
    if (!token) return null;
    
    if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('tokenExpiry');
      return null;
    }
    
    return token;
  }, []);

  // Enhanced API request helper with better error handling
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

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let responseData;
      if (isJson) {
        try {
          responseData = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          throw new Error('Server returned invalid response');
        }
      } else {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', {
          status: response.status,
          contentType,
          body: textResponse.substring(0, 500)
        });
        
        if (response.status === 404) {
          throw new Error('Service unavailable. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Request failed (${response.status})`);
        }
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('token');
            window.localStorage.removeItem('tokenExpiry');
          }
          throw new Error('Session expired. Please log in again.');
        }
        
        if (response.status === 429 && retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return makeAuthenticatedRequest(url, options, retryCount + 1);
        }
        
        throw new Error(responseData?.error || responseData?.message || `Request failed`);
      }

      return responseData;
    } catch (error) {
      console.error('API Request Error:', {
        url,
        method: options.method || 'GET',
        error: error.message
      });
      
      if (error.name === 'TypeError' && error.message.includes('fetch') && retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return makeAuthenticatedRequest(url, options, retryCount + 1);
      }
      throw error;
    }
  }, [getAuthToken]);

  // Load cart from API
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
        ToastManager.createToast(error.message, 'warning');
      } else {
        ToastManager.createToast('Failed to load cart. Please refresh the page.', 'error');
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

  // Calculate cart items count
  const cartItemsCount = useMemo(() => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  }, [state.items]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [state.items]);

  // Add to cart function
  const addToCart = useCallback(async (item, quantity = 1) => {
    if (!isAuthenticated) {
      return { 
        success: false, 
        message: 'Please sign in to add items to your cart',
        type: 'warning'
      };
    }

    const existingItem = state.items.find(cartItem => cartItem.id === item.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQuantity + quantity;
    
    if (item.stock !== undefined && newTotalQuantity > item.stock) {
      return {
        success: false,
        message: `Only ${item.stock} items available in stock`,
        type: 'warning',
        maxQuantityReached: true
      };
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
        
        return {
          success: true,
          message: 'Added to cart successfully!',
          type: 'success'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Failed to add item to cart',
          type: 'error'
        };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      
      if (error.message && error.message.includes('maximum available quantity')) {
        return {
          success: false,
          message: error.message,
          type: 'warning',
          maxQuantityReached: true
        };
      }
      
      return {
        success: false,
        message: 'Failed to add item to cart. Please try again.',
        type: 'error'
      };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isAuthenticated, makeAuthenticatedRequest, state.items]);

  // Remove from cart
  const removeFromCart = useCallback(async (itemId) => {
    if (!isAuthenticated) return false;

    const originalItems = [...state.items];
    
    try {
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
        ToastManager.createToast('Item removed from cart', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      dispatch({ type: 'SET_CART', payload: { items: originalItems } });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      ToastManager.createToast('Failed to remove item', 'error');
      return false;
    }
  }, [isAuthenticated, makeAuthenticatedRequest, state.items]);

  // Update quantity
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated) return false;

    if (quantity < 1) {
      return await removeFromCart(itemId);
    }

    const item = state.items.find(item => item.id === itemId);
    if (item?.stock !== undefined && quantity > item.stock) {
      ToastManager.createToast(`Only ${item.stock} items available`, 'warning');
      return false;
    }

    const originalItems = [...state.items];

    try {
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
        return true;
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      dispatch({ type: 'SET_CART', payload: { items: originalItems } });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      ToastManager.createToast('Failed to update quantity', 'error');
      return false;
    }
  }, [isAuthenticated, makeAuthenticatedRequest, removeFromCart, state.items]);

  // Clear cart
  const clearCart = useCallback(async (skipConfirmation = false) => {
    if (!isAuthenticated) return false;

    if (!skipConfirmation && state.items.length > 0) {
      const confirmed = window.confirm('Are you sure you want to clear your cart?');
      if (!confirmed) return false;
    }

    const originalItems = [...state.items];

    try {
      dispatch({ type: 'CLEAR_CART' });

      const data = await makeAuthenticatedRequest('/api/cart/clear', {
        method: 'DELETE'
      });

      if (data.success) {
        ToastManager.createToast('Cart cleared successfully', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: 'SET_CART', payload: { items: originalItems } });
      dispatch({ type: 'SET_ERROR', payload: error.message });
      ToastManager.createToast('Failed to clear cart', 'error');
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

  const isInCart = useCallback((itemId) => {
    return state.items.some(item => item.id === itemId);
  }, [state.items]);

  const getItemQuantity = useCallback((itemId) => {
    const item = state.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  }, [state.items]);

  // Memoize context value
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