// app/api/verify-payment/route.js - FIXED VERSION
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('🔍 DEBUG: Verify payment API called');
  
  try {
    const { order_id } = await request.json();
    console.log('📋 DEBUG: Order ID received:', order_id);
    
    if (!order_id) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    // PayHere OAuth credentials
    const appId = process.env.PAYHERE_APP_ID;
    const appSecret = process.env.PAYHERE_APP_SECRET;
    
    console.log('🔐 DEBUG: OAuth credentials check:', {
      appIdExists: !!appId,
      appSecretExists: !!appSecret,
      appIdLength: appId?.length,
      appSecretLength: appSecret?.length
    });
    
    if (!appId || !appSecret) {
      return NextResponse.json({
        success: false, 
        error: 'Missing OAuth credentials (APP_ID and APP_SECRET required)',
        debug: { appId: !!appId, appSecret: !!appSecret }
      }, { status: 500 });
    }

    // Step 1: Get Access Token using Client Credentials Flow
    console.log('📡 DEBUG: Getting access token using client credentials...');
    
    const tokenUrl = 'https://sandbox.payhere.lk/merchant/v1/oauth/token';
    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials'
    });

    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');
    console.log('🔐 DEBUG: Basic auth string length:', basicAuth.length);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
        'Accept': 'application/json'
      },
      body: tokenParams
    });

    console.log('📡 DEBUG: Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.log('❌ DEBUG: Token response failed:', tokenResponse.status, tokenResponse.statusText);
      console.log('❌ DEBUG: Token error body:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to get access token',
        status: tokenResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    console.log('📋 DEBUG: Token response data:', tokenData);

    if (!tokenData.access_token) {
      console.log('❌ DEBUG: No access token in response');
      return NextResponse.json({
        success: false,
        error: 'No access token received',
        data: tokenData
      }, { status: 500 });
    }

    // Step 2: Use Access Token to Retrieve Payment Details
    console.log('📡 DEBUG: Making retrieval request with access token...');
    
    const retrievalUrl = `https://sandbox.payhere.lk/merchant/v1/payment/search?order_id=${encodeURIComponent(order_id)}`;
    console.log('📡 DEBUG: Retrieval URL:', retrievalUrl);

    const retrievalResponse = await fetch(retrievalUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    console.log('📡 DEBUG: Retrieval response status:', retrievalResponse.status);

    const retrievalText = await retrievalResponse.text();
    console.log('📋 DEBUG: Raw retrieval response:', retrievalText);

    let retrievalData;
    try {
      retrievalData = JSON.parse(retrievalText);
      console.log('📋 DEBUG: Parsed retrieval data:', JSON.stringify(retrievalData, null, 2));
    } catch (parseError) {
      console.log('❌ DEBUG: Failed to parse retrieval response as JSON');
      retrievalData = { raw: retrievalText };
    }

    // FIXED: Correct payment status logic for PayHere API response
    if (retrievalResponse.ok && retrievalData && retrievalData.data && retrievalData.data.length > 0) {
      const paymentData = retrievalData.data[0]; // Get the first (and likely only) payment record
      const paymentStatus = paymentData.status; // Use the status from the payment data, not the API response status
      
      console.log('🔍 DEBUG: Payment status from API:', paymentStatus);
      
      // PayHere payment statuses:
      // "RECEIVED" = Payment successful and completed
      // "PENDING" = Payment is pending
      // "FAILED" = Payment failed
      // "CANCELED" = Payment was canceled
      const isPaymentSuccessful = paymentStatus === 'RECEIVED';
      
      console.log('✅ DEBUG: Is payment successful?', isPaymentSuccessful);
      
      return NextResponse.json({
        success: true,
        status: retrievalResponse.status,
        data: retrievalData,
        paymentStatus: paymentStatus,
        isPaymentSuccessful: isPaymentSuccessful,
        paymentData: paymentData, // Include the full payment data
        debug: {
          orderId: order_id,
          retrievalUrl: retrievalUrl,
          responseStatus: retrievalResponse.status,
          accessTokenLength: tokenData.access_token?.length,
          actualPaymentStatus: paymentStatus,
          paymentSuccessful: isPaymentSuccessful
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve payment details or no payment data found',
        status: retrievalResponse.status,
        data: retrievalData
      }, { status: retrievalResponse.status || 500 });
    }

  } catch (error) {
    console.error('💥 DEBUG: Critical error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');
  
  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID parameter is required' },
      { status: 400 }
    );
  }
  
  return POST(new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId }),
    headers: { 'Content-Type': 'application/json' }
  }));
}