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
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading books...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-red-600 mb-4">
          <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold">Error loading books</p>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Our Books</h2>
        <div className="text-sm text-gray-600">
          {books.length} {books.length === 1 ? 'book' : 'books'} available
        </div>
      </div>
      
      {books.length === 0 ? (
        <div className="text-center py-12">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-600">No books found</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book, index) => (
            <BookCard key={book.id} book={book} priority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}