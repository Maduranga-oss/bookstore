"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentUnsuccessful() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Get order details from URL parameters
    const orderId = searchParams.get('order_id');
    const reason = searchParams.get('reason');
    const error = searchParams.get('error');
    
    if (orderId) {
      setOrderDetails({
        orderId,
        reason,
        error,
        timestamp: new Date().toLocaleString()
      });
    }
  }, [searchParams]);

  const getReasonText = (reason) => {
    switch (reason) {
      case 'failed':
        return 'Payment Failed';
      case 'declined':
        return 'Payment Declined';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'timeout':
        return 'Payment Timeout';
      case 'insufficient_funds':
        return 'Insufficient Funds';
      case 'verification_error':
        return 'Verification Error';
      case 'network_error':
        return 'Network Error';
      default:
        return 'Payment Unsuccessful';
    }
  };

  const getReasonMessage = (reason) => {
    switch (reason) {
      case 'failed':
        return 'Your payment could not be processed. Please try again or use a different payment method.';
      case 'declined':
        return 'Your payment was declined by the bank. Please contact your bank or try a different card.';
      case 'cancelled':
        return 'You cancelled the payment process. Your cart items are still saved.';
      case 'timeout':
        return 'The payment process timed out. Please try again.';
      case 'insufficient_funds':
        return 'Insufficient funds in your account. Please check your balance and try again.';
      case 'verification_error':
        return 'We could not verify your payment. Please contact support if money was deducted.';
      case 'network_error':
        return 'Network connection error. Please check your internet connection and try again.';
      default:
        return 'Your payment was not successful. Please try again or contact support.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {orderDetails ? getReasonText(orderDetails.reason) : 'Payment Unsuccessful'}
        </h1>
        <p className="text-gray-600 mb-6">
          {orderDetails ? getReasonMessage(orderDetails.reason) : 'Your payment could not be completed.'}
        </p>

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderDetails.orderId}</span>
              </div>
              {orderDetails.reason && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Reason:</span>
                  <span className="font-medium capitalize">{orderDetails.reason.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{orderDetails.timestamp}</span>
              </div>
            </div>
            
            {orderDetails.error && (
              <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                <strong>Error:</strong> {decodeURIComponent(orderDetails.error)}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium inline-block"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-xs text-gray-500 space-y-1">
          {orderDetails?.reason === 'verification_error' && (
            <p className="text-orange-600 font-medium">
              If money was deducted from your account, please contact support immediately.
            </p>
          )}
          <p>Your cart items are still saved and you can try purchasing again.</p>
          <p className="mt-1">For support, please contact us with your Order ID.</p>
        </div>
      </div>
    </div>
  );
}