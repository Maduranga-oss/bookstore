"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    // Get order details from URL parameters
    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');
    
    if (orderId) {
      setOrderDetails({
        orderId,
        paymentId,
        timestamp: new Date().toLocaleString()
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">Thank you for your purchase. Your order has been confirmed.</p>

        {/* Order Details */}
        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderDetails.orderId}</span>
              </div>
              {orderDetails.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium">{orderDetails.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{orderDetails.timestamp}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
          >
            Continue Shopping
          </Link>
          
          
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-xs text-gray-500">
          <p>A confirmation email will be sent to your registered email address.</p>
          <p className="mt-1">For support, please contact us with your Order ID.</p>
        </div>
      </div>
    </div>
  );
}