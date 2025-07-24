// app/api/cart/route.js
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

// GET /api/cart - Get user's cart
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
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

    if (!cart) {
      return Response.json({ 
        success: true, 
        cart: null 
      });
    }

    return Response.json({ 
      success: true, 
      cart: cart 
    });

  } catch (error) {
    console.error('Error fetching cart:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}