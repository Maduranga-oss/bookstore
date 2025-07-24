import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    console.log('👥 Fetching users from database...');
    
    // Fetch all users (excluding passwords for security)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Don't include password for security
        preferences: {
          select: {
            newsletter: true,
            currency: true,
            language: true
          }
        },
        addresses: {
          select: {
            id: true,
            street: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            isDefault: true
          }
        },
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Most recent first
      }
    });
    
    console.log('👥 Users fetched successfully:', users.length);
    
    return NextResponse.json({
      success: true,
      users: users,
      total: users.length,
      message: `Found ${users.length} users`
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      users: [],
      details: error.message
    }, {
      status: 500
    });
  }
}

// Optional: Add a POST route for creating users via API
export async function POST(request) {
  try {
    const userData = await request.json();
    
    // Basic validation
    if (!userData.email || !userData.password || !userData.name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required'
      }, {
        status: 400
      });
    }
    
    // Hash password before storing
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        name: userData.name,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive ?? true
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'Email already exists'
      }, {
        status: 409
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error.message
    }, {
      status: 500
    });
  }
}