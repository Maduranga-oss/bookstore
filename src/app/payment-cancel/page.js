"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentCancel() {
  const router = useRouter();

  useEffect(() => {
    // Optional: Auto redirect after some time
    const timer = setTimeout(() => {
      router.push('/');
    }, 30000); // Redirect after 30 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. Don&apos;t worry, no charges were made to your account.
        </p>

        {/* Information Box */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">What happened?</h3>
          <p className="text-sm text-gray-600">
            You cancelled the payment process. Your cart items are still saved and waiting for you.
          </p>
        </div>

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

        {/* Support Info */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Need help? Contact our support team.</p>
          <p className="mt-1">We&apos;re here to assist you with your purchase.</p>
        </div>

        {/* Auto redirect notice */}
        <div className="mt-4 text-xs text-gray-400">
          <p>You&apos;ll be redirected to the homepage in 30 seconds</p>
        </div>
      </div>
    </div>
  );
}