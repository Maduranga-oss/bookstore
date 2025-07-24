// /api/generate-hash/route.js - Fixed version
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { merchant_id, order_id, amount, currency } = await request.json();
    
    console.log('Hash generation request:', { merchant_id, order_id, amount, currency });
    
    // Validate required fields
    if (!merchant_id || !order_id || !amount || !currency) {
      console.error('Missing required parameters:', { merchant_id, order_id, amount, currency });
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Your PayHere Merchant Secret from environment variables
    const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;
    
    if (!MERCHANT_SECRET) {
      console.error('PAYHERE_MERCHANT_SECRET not found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error - merchant secret not found' },
        { status: 500 }
      );
    }
    
    // Format amount to 2 decimal places (PayHere requirement)
    const formatted_amount = parseFloat(amount).toFixed(2);
    
    // Validate amount is a valid number
    if (isNaN(formatted_amount) || parseFloat(formatted_amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      );
    }
    
    // Step 1: Create MD5 hash of merchant secret and convert to uppercase
    const merchant_secret_hash = crypto
      .createHash('md5')
      .update(MERCHANT_SECRET)
      .digest('hex')
      .toUpperCase();
    
    // Step 2: Create the hash string according to PayHere specification
    // Format: merchant_id + order_id + formatted_amount + currency + uppercase(md5(merchant_secret))
    const hash_string = `${merchant_id}${order_id}${formatted_amount}${currency}${merchant_secret_hash}`;
    
    console.log('Hash generation details:', {
      merchant_id,
      order_id,
      formatted_amount,
      currency,
      merchant_secret_length: MERCHANT_SECRET.length,
      merchant_secret_hash,
      hash_string_length: hash_string.length
    });
    
    // Step 3: Create MD5 hash of the hash string and convert to uppercase
    const hash = crypto
      .createHash('md5')
      .update(hash_string)
      .digest('hex')
      .toUpperCase();
    
    console.log('Generated hash:', hash);
    
    return NextResponse.json({ 
      success: true,
      hash,
      // Remove debug info in production
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          hash_string,
          formatted_amount,
          merchant_secret_hash: merchant_secret_hash.substring(0, 8) + '...' // Partial for security
        }
      })
    });
    
  } catch (error) {
    console.error('Hash generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate hash', 
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Optional: Handle GET request for testing
export async function GET(request) {
  return NextResponse.json(
    { 
      message: 'PayHere hash generation endpoint',
      timestamp: new Date().toISOString(),
      method: 'POST required with merchant_id, order_id, amount, currency'
    },
    { status: 200 }
  );
}