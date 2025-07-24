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

  // Simplified payment verification - single attempt
 // In CartModal.js, update the verifyPayment function

const verifyPayment = async (orderId) => {
  try {
    showToast('Verifying payment...', 'info');
    
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
      // Payment successful
      showToast('Payment successful! 🎉', 'success');
      
      await saveOrderToDatabase(orderId, result);
      
      // Clear cart without confirmation after successful payment
      clearCart(true); // Pass true to skip confirmation
      closeCart();
      setIsCheckingOut(false);
      
      const paymentId = result.paymentData?.payment_id || 'unknown';
      window.location.href = `/payment-success?order_id=${orderId}&payment_id=${paymentId}`;
      
    } else {
      // Payment failed
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
  // Save successful order to database
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
    // Basic validation
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
      
      // Generate security hash
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

      // Set up PayHere event handlers
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

  // Simple toast notification
  const showToast = useCallback((message, type = 'success') => {
    const existingToasts = document.querySelectorAll('.payment-toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `payment-toast fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm text-white transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <span class="flex-1">${message}</span>
        <button class="ml-2 text-white hover:text-gray-200 close-toast cursor-pointer" type="button">×</button>
      </div>
    `;
    
    const closeButton = toast.querySelector('.close-toast');
    closeButton.addEventListener('click', () => toast.remove());
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 transition-all duration-300 cursor-pointer ${
          isOpen ? 'backdrop-blur-sm bg-black/20' : 'backdrop-blur-none bg-black/0'
        }`}
        onClick={closeCart}
      />
      
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold select-none">Shopping Cart ({items.length})</h2>
            <button
              onClick={closeCart}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 17a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="text-gray-500 mb-2 select-none">Your cart is empty</p>
                <p className="text-sm text-gray-400 select-none">Add some books to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden cursor-pointer">
                      {item.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={item.coverImageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: item.coverImageUrl ? 'none' : 'flex'}}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 cursor-default">
                      <h3 className="font-semibold text-sm truncate select-text" title={item.title}>{item.title}</h3>
                      <p className="text-sm text-gray-600 truncate select-text" title={item.author}>{item.author}</p>
                      <p className="text-sm font-semibold text-green-600 select-none">Rs. {(item.price * 300).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        disabled={loading || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-medium select-none">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={loading}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={loading}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t bg-gray-50 p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold select-none">Total:</span>
                <span className="text-2xl font-bold text-green-600 select-none">Rs. {(cartTotal * 300).toFixed(2)}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut || loading || !payHereLoaded}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium cursor-pointer"
                >
                  {isCheckingOut ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span className="select-none">Processing...</span>
                    </div>
                  ) : !payHereLoaded ? (
                    <span className="select-none">Loading Payment System...</span>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="select-none">Pay with PayHere</span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={clearCart}
                  disabled={loading}
                  className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="select-none">Clear Cart</span>
                </button>
              </div>

              {/* PayHere Info */}
              <div className="text-xs text-gray-500 text-center">
                <p className="select-none">Secured by PayHere • Sandbox Mode</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}