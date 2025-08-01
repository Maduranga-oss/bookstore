// Enhanced Payment Notification API (api/payment-notify/route.js)
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('🔔 PayHere Notification Received:', {
      timestamp: new Date().toISOString(),
      data: body
    });
    
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

    // Enhanced logging for debugging
    console.log('📊 Payment Details:', {
      orderId: order_id,
      paymentId: payment_id,
      amount: payhere_amount,
      currency: payhere_currency,
      statusCode: status_code,
      merchantId: merchant_id
    });

    // Verify the payment status
    if (status_code === '2') { // Payment successful
      console.log('✅ Payment successful for order:', order_id);
      
      try {
        // Parse custom data safely
        let customData = {};
        try {
          customData = JSON.parse(custom_1 || '{}');
        } catch (parseError) {
          console.warn('⚠️ Failed to parse custom_1 data:', parseError);
          customData = {};
        }
        
        const { userId, cartItems } = customData;
        
        // Enhanced order details logging
        console.log('📦 Order Processing:', {
          orderId: order_id,
          paymentId: payment_id,
          amount: payhere_amount,
          currency: payhere_currency,
          userId,
          itemCount: cartItems?.length || 0,
          items: cartItems
        });

        // Here you can implement your business logic:
        // 1. Save the order to your database
        // 2. Update inventory
        // 3. Send confirmation email
        // 4. Clear user's cart
        // 5. Update user's order history
        
        /* Enhanced Order Creation Example:
        const orderResult = await createOrder({
          orderId: order_id,
          paymentId: payment_id,
          userId: userId,
          items: cartItems || [],
          totalAmount: parseFloat(payhere_amount),
          currency: payhere_currency,
          status: 'completed',
          paymentMethod: 'payhere',
          paymentGatewayResponse: body,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Send confirmation email
        await sendOrderConfirmationEmail({
          userId,
          orderId: order_id,
          amount: payhere_amount,
          currency: payhere_currency,
          items: cartItems
        });
        
        // Update inventory
        if (cartItems && cartItems.length > 0) {
          await updateInventory(cartItems);
        }
        
        console.log('📧 Order confirmation email sent and inventory updated');
        */

        // Return enhanced success response to PayHere
        return NextResponse.json({ 
          success: true, 
          message: 'Payment notification processed successfully',
          data: {
            orderId: order_id,
            paymentId: payment_id,
            status: 'processed',
            timestamp: new Date().toISOString()
          }
        }, { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Processing-Time': Date.now().toString()
          }
        });
        
      } catch (processingError) {
        console.error('❌ Error processing successful payment:', processingError);
        
        // Even if processing fails, acknowledge receipt to PayHere
        return NextResponse.json({ 
          success: true, 
          message: 'Payment notification received but processing encountered issues',
          error: 'Internal processing error',
          data: {
            orderId: order_id,
            paymentId: payment_id,
            status: 'received_with_errors',
            timestamp: new Date().toISOString()
          }
        }, { status: 200 });
      }
      
    } else if (status_code === '0') {
      console.log('⏳ Payment pending for order:', order_id);
      
      // Handle pending payment
      return NextResponse.json({ 
        success: true, 
        message: 'Payment pending notification received',
        data: {
          orderId: order_id,
          status: 'pending',
          timestamp: new Date().toISOString()
        }
      });
      
    } else if (status_code === '-1') {
      console.log('❌ Payment cancelled by user for order:', order_id);
      
      // Handle cancelled payment
      return NextResponse.json({ 
        success: true, 
        message: 'Payment cancellation notification received',
        data: {
          orderId: order_id,
          status: 'cancelled',
          timestamp: new Date().toISOString()
        }
      });
      
    } else if (status_code === '-2') {
      console.log('🚫 Payment failed for order:', order_id);
      
      // Handle failed payment
      return NextResponse.json({ 
        success: true, 
        message: 'Payment failure notification received',
        data: {
          orderId: order_id,
          status: 'failed',
          timestamp: new Date().toISOString()
        }
      });
      
    } else {
      console.log('❓ Unknown payment status for order:', order_id, 'Status code:', status_code);
      
      // Handle unknown status
      return NextResponse.json({ 
        success: true, 
        message: 'Payment notification received with unknown status',
        data: {
          orderId: order_id,
          statusCode: status_code,
          status: 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    }
    
  } catch (error) {
    console.error('💥 PayHere notification processing error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid notification data or processing error',
      message: 'Failed to process payment notification',
      timestamp: new Date().toISOString()
    }, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Enhanced GET request handler for testing and health checks
export async function GET(request) {
  const url = new URL(request.url);
  const test = url.searchParams.get('test');
  
  if (test === 'true') {
    // Test endpoint with sample data
    return NextResponse.json({ 
      message: 'PayHere notification endpoint is operational',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      endpoints: {
        notify: '/api/payment-notify',
        test: '/api/payment-notify?test=true'
      },
      supportedMethods: ['POST', 'GET'],
      expectedPayload: {
        merchant_id: 'string',
        order_id: 'string',
        payment_id: 'string',
        payhere_amount: 'number',
        payhere_currency: 'string',
        status_code: 'string',
        md5sig: 'string',
        custom_1: 'string (JSON)',
        custom_2: 'string'
      },
      statusCodes: {
        '2': 'Payment Success',
        '0': 'Payment Pending', 
        '-1': 'Payment Cancelled',
        '-2': 'Payment Failed'
      }
    });
  }
  
  return NextResponse.json({ 
    message: 'PayHere notification endpoint is working',
    status: 'active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}