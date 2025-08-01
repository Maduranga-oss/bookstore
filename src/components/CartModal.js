"use client";

import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { useState, useEffect, useCallback } from 'react';

export default function CartModal() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    cartTotal,
    loading 
  } = useCart();
  
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [payHereLoaded, setPayHereLoaded] = useState(false);
  const [toastQueue, setToastQueue] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load PayHere script
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.payhere) {
        setPayHereLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      
      script.onload = () => {
        setPayHereLoaded(true);
      };
      
      script.onerror = () => {
        setPayHereLoaded(false);
        showToast('Failed to load payment system', 'error');
      };
      
      document.head.appendChild(script);
    }
  }, []);

  const generateOrderId = useCallback(() => {
    return 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }, []);

  const generateHash = useCallback(async (merchantId, orderId, amount, currency) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch('/api/generate-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          order_id: orderId,
          amount: amount,
          currency: currency,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Hash generation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.hash;
    } catch (error) {
      console.error('Hash generation failed:', error);
      throw error;
    }
  }, []);

  const verifyPayment = async (orderId) => {
    try {
      
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ 
          order_id: orderId,
          merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID
        })
      });
      
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.isPaymentSuccessful && result.paymentStatus === 'RECEIVED') {
        showToast('Payment successful! 🎉', 'success');
        
        await saveOrderToDatabase(orderId, result);
        
        clearCart(true);
        closeCart();
        setIsCheckingOut(false);
        
        const paymentId = result.paymentData?.payment_id || 'unknown';
        window.location.href = `/payment-success?order_id=${orderId}&payment_id=${paymentId}`;
        
      } else {
        const status = result.paymentStatus || 'unknown';
        const reason = status === 'CANCELED' ? 'cancelled' : 'failed';
        
        showToast('Payment was not successful', 'error');
        setIsCheckingOut(false);
        
        window.location.href = `/payment-unsuccessful?order_id=${orderId}&reason=${reason}&status=${status}`;
      }
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setIsCheckingOut(false);
      showToast('Payment verification failed', 'error');
      
      window.location.href = `/payment-unsuccessful?order_id=${orderId}&reason=verification_error`;
    }
  };

  const saveOrderToDatabase = async (orderId, paymentResult) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const orderData = {
        order_id: orderId,
        payment_id: paymentResult.payment_id,
        user_id: user.id || user.uid,
        items: items.map(item => ({
          book_id: item.id,
          title: item.title,
          author: item.author,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })),
        total_amount: cartTotal,
        payment_amount: cartTotal * 300,
        currency: 'LKR',
        payment_method: 'payhere',
        payment_status: 'completed',
        payment_gateway_response: paymentResult,
        created_at: new Date().toISOString()
      };
      
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        console.error('Failed to save order to database');
      }
      
    } catch (error) {
      console.error('Error saving order to database:', error);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      showToast('Please log in to proceed', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }

    if (!payHereLoaded || !window.payhere) {
      showToast('Payment system not ready', 'warning');
      return;
    }

    setIsCheckingOut(true);

    try {
      const orderId = generateOrderId();
      const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
      const amount = parseFloat((cartTotal * 300).toFixed(2));
      const currency = "LKR";
      
      const hash = await generateHash(merchantId, orderId, amount, currency);
      
      const userEmail = user.email || "customer@example.com";
      const userName = user.name || userEmail.split('@')[0];
      const firstName = userName.split(' ')[0] || "John";
      const lastName = userName.split(' ').slice(1).join(' ') || "Doe";
      
      const payment = {
        sandbox: true,
        merchant_id: merchantId,
        return_url: `${window.location.origin}/payment-return`,
        cancel_url: `${window.location.origin}/payment-cancel`, 
        notify_url: `${window.location.origin}/api/payhere/notify`,
        order_id: orderId,
        items: `Books (${items.length} ${items.length === 1 ? 'item' : 'items'})`,
        amount: amount,
        currency: currency,
        hash: hash,
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        phone: user.phone || "0771234567",
        address: user.address || "No.1, Galle Road",
        city: user.city || "Colombo",
        country: "Sri Lanka",
        delivery_address: user.address || "No.1, Galle Road",
        delivery_city: user.city || "Colombo", 
        delivery_country: "Sri Lanka"
      };

      window.payhere.onCompleted = function(orderId) {
        showToast('Payment completed. Verifying...', 'info');
        setTimeout(() => verifyPayment(orderId), 3000);
      };

      window.payhere.onDismissed = function() {
        setIsCheckingOut(false);
        showToast('Payment cancelled', 'warning');
      };

      window.payhere.onError = function(error) {
        setIsCheckingOut(false);
        showToast('Payment failed', 'error');
        
        const errorOrderId = orderId || ('ERROR_' + Date.now());
        setTimeout(() => {
          window.location.href = `/payment-unsuccessful?order_id=${errorOrderId}&reason=payment_error`;
        }, 2000);
      };

      showToast('Redirecting to PayHere...', 'info');
      window.payhere.startPayment(payment);

    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Payment initialization failed', 'error');
      setIsCheckingOut(false);
    }
  };

  // Improved React-based toast system
  const showToast = useCallback((message, type = 'success') => {
    const toastId = Date.now();
    const newToast = {
      id: toastId,
      message,
      type,
      visible: false
    };

    setToastQueue(prev => [...prev, newToast]);

    // Show toast after a brief delay
    setTimeout(() => {
      setToastQueue(prev => 
        prev.map(toast => 
          toast.id === toastId ? { ...toast, visible: true } : toast
        )
      );
    }, 100);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 5000);
  }, []);

  const removeToast = useCallback((toastId) => {
    setToastQueue(prev => 
      prev.map(toast => 
        toast.id === toastId ? { ...toast, visible: false } : toast
      )
    );

    // Remove from array after animation
    setTimeout(() => {
      setToastQueue(prev => prev.filter(toast => toast.id !== toastId));
    }, 300);
  }, []);

  // Toast Component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[70] space-y-3 pointer-events-none">
      {toastQueue.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative px-6 py-4 rounded-xl shadow-2xl max-w-sm text-white
            transform transition-all duration-500 ease-out pointer-events-auto
            ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
              toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
              toast.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
              'bg-gradient-to-r from-blue-500 to-blue-600'}
          `}
        >
          <div className="flex items-center">
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 mr-3 font-bold">
              {toast.type === 'success' ? '✓' : 
               toast.type === 'error' ? '✕' : 
               toast.type === 'warning' ? '⚠' : 'ℹ'}
            </div>
            <span className="flex-1 font-medium">{toast.message}</span>
            <button
              className="ml-3 text-white/80 hover:text-white cursor-pointer text-xl leading-none p-1"
              onClick={() => removeToast(toast.id)}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (!isVisible) return null;

  return (
    <>
      {/* Toast Container - Always rendered when cart is visible */}
      <ToastContainer />
      
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Enhanced Backdrop */}
        <div 
          className={`absolute inset-0 transition-all duration-500 cursor-pointer ${
            isOpen ? 'backdrop-blur-md bg-black/30' : 'backdrop-blur-none bg-black/0'
          }`}
          onClick={closeCart}
        />
        
        <div className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transform transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex h-full flex-col">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 select-none">Shopping Cart</h2>
                <p className="text-sm text-gray-500 mt-1 select-none">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <button
                onClick={closeCart}
                className="p-3 hover:bg-gray-200/70 rounded-xl transition-all duration-200 cursor-pointer group"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
                    <div className="absolute inset-0 animate-pulse rounded-full h-10 w-10 border-3 border-blue-200"></div>
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 17a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 select-none">Your cart is empty</h3>
                  <p className="text-gray-500 select-none">Start adding some amazing books to your collection!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-300">
                      <div className="flex items-start space-x-4">
                        {/* Enhanced Book Cover */}
                        <div className="w-16 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 overflow-hidden cursor-pointer shadow-sm">
                          {item.coverImageUrl ? (
                            <img 
                              src={item.coverImageUrl} 
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: item.coverImageUrl ? 'none' : 'flex'}}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2 select-text" title={item.title}>
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 select-text" title={item.author}>
                            {item.author}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-emerald-600 select-none">
                              Rs. {(item.price * 300).toFixed(2)}
                            </p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                  disabled={loading || item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                  aria-label="Decrease quantity"
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="w-8 text-center font-semibold text-gray-900 select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={loading}
                                  className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                  aria-label="Increase quantity"
                                >
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Remove Button */}
                              <button
                                onClick={() => removeFromCart(item.id)}
                                disabled={loading}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
                                aria-label="Remove item"
                              >
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50 p-6 space-y-6">
                {/* Total */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700 select-none">Total Amount:</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent select-none">
                      Rs. {(cartTotal * 300).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || loading || !payHereLoaded}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isCheckingOut ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span className="select-none">Processing Payment...</span>
                      </div>
                    ) : !payHereLoaded ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-pulse w-5 h-5 bg-white/30 rounded"></div>
                        <span className="select-none">Loading Payment System...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="select-none">Secure Checkout with PayHere</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    disabled={loading}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
                  >
                    <span className="select-none">Clear Cart</span>
                  </button>
                </div>

                {/* PayHere Info */}
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-white px-4 py-2 rounded-full">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="select-none">Secured by PayHere • Sandbox Mode</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}