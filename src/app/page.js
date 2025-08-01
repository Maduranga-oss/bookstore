"use client";

import { useEffect, useState } from "react";
import BookCard from "../components/BookCard";

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/books");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          console.log("Fetched books:", data.books);
          setBooks(data.books);
        } else {
          throw new Error(data.error || 'Failed to fetch books');
        }
        
      } catch (error) {
        console.error("Failed to fetch books:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Loading our collection
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Discovering amazing books for you...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gradient leading-tight">
          Discover Your Next
          <br />
          Great Read
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Explore our carefully curated collection of books across all genres. 
          From bestsellers to hidden gems, find your perfect story here.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="glass rounded-2xl p-6 mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {books.length}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {books.length === 1 ? 'Book Available' : 'Books Available'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Free Shipping</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Books Section */}
      {books.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            No books found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Check back soon for new additions to our collection!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              Featured Books
            </h2>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Handpicked for you</span>
            </div>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book, index) => (
              <div key={book.id} className="animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                <BookCard book={book} priority={index < 4} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}