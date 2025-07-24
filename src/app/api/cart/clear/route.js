// app/api/cart/clear/route.js
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

// DELETE /api/cart/clear - Clear all items from cart
export async function DELETE(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id }
    });

    if (!cart) {
      return Response.json({ 
        success: true, 
        message: 'Cart is already empty' 
      });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    // Optionally delete the cart itself
    await prisma.cart.delete({
      where: { id: cart.id }
    });

    return Response.json({ 
      success: true, 
      message: 'Cart cleared successfully' 
    });

  } catch (error) {
    console.error('Error clearing cart:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}