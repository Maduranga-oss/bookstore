// app/api/cart/add/route.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Get user from token
async function getUserFromToken(request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    return user;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// POST /api/cart/add - Add item to cart
export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId, quantity = 1 } = await request.json();

    // Validate inputs
    if (!bookId) {
      return Response.json({ success: false, error: 'Book ID is required' }, { status: 400 });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return Response.json({ success: false, error: 'Quantity must be a positive integer' }, { status: 400 });
    }

    // Check if book exists and get stock info
    const book = await prisma.book.findUnique({ 
      where: { id: bookId },
      select: { id: true, title: true, stock: true, isActive: true }
    });

    if (!book || !book.isActive) {
      return Response.json({ success: false, error: 'Book not found or unavailable' }, { status: 404 });
    }

    // Check stock availability first
    if (book.stock < quantity) {
      return Response.json({
        success: false,
        error: book.stock === 0 ? 'This book is out of stock' : `Only ${book.stock} items available in stock`
      }, { status: 400 });
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({ 
      where: { userId: user.id },
      include: {
        items: {
          where: { bookId },
          select: { quantity: true }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({ 
        data: { userId: user.id },
        include: {
          items: {
            where: { bookId },
            select: { quantity: true }
          }
        }
      });
    }

    const existingItem = cart.items[0]; // Since we filtered by bookId, there's max 1 item
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQuantityInCart + quantity;

    // Check if the new total quantity exceeds stock
    if (newTotalQuantity > book.stock) {
      const availableToAdd = book.stock - currentQuantityInCart;
      if (availableToAdd <= 0) {
        return Response.json({
          success: false,
          error: `You already have the maximum available quantity (${book.stock}) in your cart`
        }, { status: 400 });
      }
      return Response.json({
        success: false,
        error: `You can only add ${availableToAdd} more item(s). Current stock: ${book.stock}, in cart: ${currentQuantityInCart}`
      }, { status: 400 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Double-check stock in transaction to prevent race conditions
      const bookCheck = await tx.book.findUnique({
        where: { id: bookId },
        select: { stock: true }
      });

      if (!bookCheck || bookCheck.stock < newTotalQuantity) {
        throw new Error('Insufficient stock available');
      }

      // Update or create cart item
      if (existingItem) {
        await tx.cartItem.update({
          where: { cartId_bookId: { cartId: cart.id, bookId } },
          data: { quantity: newTotalQuantity }
        });
      } else {
        await tx.cartItem.create({
          data: { cartId: cart.id, bookId, quantity }
        });
      }

      // Return updated cart with full details
      return await tx.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              book: {
                select: { 
                  id: true, 
                  title: true, 
                  author: true, 
                  price: true, 
                  coverImageUrl: true, 
                  stock: true 
                }
              }
            }
          }
        }
      });
    });

    return Response.json({ 
      success: true, 
      cart: result, 
      message: `Added ${quantity} item(s) to cart successfully` 
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    
    // Handle specific error cases
    if (error.message === 'Insufficient stock available') {
      return Response.json({ 
        success: false, 
        error: 'Stock was updated by another user. Please try again.' 
      }, { status: 400 });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Something went wrong. Please try again.' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}