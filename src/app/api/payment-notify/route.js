// Optional Payment Notification API (api/payment-notify/route.js)
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('PayHere Notification Received:', body);
    
    // Extract payment details
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      custom_1, // Contains user info and cart items
      custom_2
    } = body;

    // Verify the payment status
    if (status_code === '2') { // Payment successful
      console.log('Payment successful for order:', order_id);
      
      try {
        // Parse custom data
        const customData = JSON.parse(custom_1 || '{}');
        const { userId, cartItems } = customData;
        
        // Here you can:
        // 1. Save the order to your database
        // 2. Update inventory
        // 3. Send confirmation email
        // 4. Clear user's cart
        
        console.log('Order details:', {
          orderId: order_id,
          paymentId: payment_id,
          amount: payhere_amount,
          currency: payhere_currency,
          userId,
          items: cartItems
        });

        // Example: You might want to create an order record
        /*
        await createOrder({
          orderId: order_id,
          paymentId: payment_id,
          userId: userId,
          items: cartItems,
          totalAmount: payhere_amount,
          currency: payhere_currency,
          status: 'completed',
          createdAt: new Date()
        });
        */

        // Return success response to PayHere
        return NextResponse.json({ 
          success: true, 
          message: 'Payment notification processed successfully' 
        });
        
      } catch (error) {
        console.error('Error processing payment notification:', error);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to process payment notification' 
        }, { status: 500 });
      }
      
    } else {
      console.log('Payment failed or cancelled for order:', order_id);
      
      // Handle failed payment
      return NextResponse.json({ 
        success: true, 
        message: 'Payment failed notification received' 
      });
    }
    
  } catch (error) {
    console.error('PayHere notification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid notification data' 
    }, { status: 400 });
  }
}

// Handle GET request (optional - for testing)
export async function GET(request) {
  return NextResponse.json({ 
    message: 'PayHere notification endpoint is working',
    timestamp: new Date().toISOString()
  });
}