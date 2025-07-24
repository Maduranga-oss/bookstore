// app/api/books/route.js - Fixed version using Prisma singleton
import { prisma } from '@/lib/prisma'; // Use the singleton instead of creating new instance

export async function GET(request) {
  try {
    console.log('📚 Fetching books from database...');
    
    const books = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        price: true,
        coverImageUrl: true,
        description: true,
        // Add other fields you need
      }
    });
    
    console.log('📚 Books fetched successfully:', books.length);
    
    // Return consistent response structure
    return Response.json({ 
      success: true, 
      books: books,
      total: books.length 
    });
    
  } catch (error) {
    console.error('❌ Error fetching books:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to fetch books',
      books: [] 
    }, { 
      status: 500 
    });
  }
}