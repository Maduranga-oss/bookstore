// app/api/cart/update/route.js
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
    return null;
  }
}

// PUT /api/cart/update - Update item quantity
export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { bookId, quantity } = await request.json();

    // Validate inputs
    if (!bookId) {
      return Response.json({ 
        success: false, 
        error: 'Book ID is required' 
      }, { status: 400 });
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      return Response.json({ 
        success: false, 
        error: 'Quantity must be a positive integer' 
      }, { status: 400 });
    }

    // Check if book exists and get stock info
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, stock: true, isActive: true }
    });

    if (!book || !book.isActive) {
      return Response.json({ 
        success: false, 
        error: 'Book not found or unavailable' 
      }, { status: 404 });
    }

    // Check stock availability
    if (quantity > book.stock) {
      return Response.json({ 
        success: false, 
        error: book.stock === 0 
          ? 'This book is out of stock' 
          : `Only ${book.stock} items available in stock`
      }, { status: 400 });
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          where: { bookId },
          select: { id: true, quantity: true }
        }
      }
    });

    if (!cart) {
      return Response.json({ 
        success: false, 
        error: 'Cart not found' 
      }, { status: 404 });
    }

    if (cart.items.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Item not found in cart' 
      }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Double-check stock in transaction
      const bookCheck = await tx.book.findUnique({
        where: { id: bookId },
        select: { stock: true }
      });

      if (!bookCheck || bookCheck.stock < quantity) {
        throw new Error('Insufficient stock available');
      }

      // Update cart item quantity
      await tx.cartItem.update({
        where: {
          cartId_bookId: {
            cartId: cart.id,
            bookId: bookId
          }
        },
        data: { quantity }
      });

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
      message: 'Cart updated successfully'
    });

  } catch (error) {
    console.error('Error updating cart:', error);
    
    // Handle specific error cases
    if (error.message === 'Insufficient stock available') {
      return Response.json({ 
        success: false, 
        error: 'Stock was updated by another user. Please refresh and try again.' 
      }, { status: 400 });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Failed to update quantity. Please try again.' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/cart/remove - Remove item from cart
export async function DELETE(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { bookId } = await request.json();

    if (!bookId) {
      return Response.json({ 
        success: false, 
        error: 'Book ID is required' 
      }, { status: 400 });
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      return Response.json({ 
        success: false, 
        error: 'Cart not found' 
      }, { status: 404 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Remove cart item
      const deletedItem = await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          bookId: bookId
        }
      });

      if (deletedItem.count === 0) {
        throw new Error('Item not found in cart');
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
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Error removing from cart:', error);
    
    if (error.message === 'Item not found in cart') {
      return Response.json({ 
        success: false, 
        error: 'Item not found in cart' 
      }, { status: 404 });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Failed to remove item. Please try again.' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}