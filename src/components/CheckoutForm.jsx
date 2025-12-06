import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  CardElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js';
import { env } from '../config/env.js';

/**
 * Stripe CheckoutForm Component for ArquiNorma
 * 
 * This component provides a secure payment form using Stripe Elements.
 * It handles the complete payment flow:
 * 1. Collects payment information using CardElement
 * 2. Calls backend /create-payment-intent to get client_secret
 * 3. Confirms payment with stripe.confirmCardPayment()
 * 4. Handles success and error states
 * 5. Provides user feedback throughout the process
 * 
 * SECURITY FEATURES:
 * - Uses Stripe Elements for PCI-compliant card input
 * - Never stores or processes card data directly
 * - All sensitive operations handled by Stripe
 * - Client secret obtained securely from backend
 * 
 * USAGE:
 * ```jsx
 * <CheckoutForm 
 *   amount={2000} // Amount in cents (e.g., $20.00)
 *   currency="eur"
 *   onSuccess={(paymentIntent) => console.log('Payment succeeded:', paymentIntent)}
 *   onError={(error) => console.error('Payment failed:', error)}
 *   description="ArquiNorma Premium Subscription"
 * />
 * ```
 */

const CheckoutForm = ({
  amount = 2000, // Default amount in cents (€20.00)
  currency = 'eur',
  onSuccess = () => {},
  onError = () => {},
  description = 'ArquiNorma Premium Subscription',
  disabled = false
}) => {
  // Stripe hooks for payment processing
  const stripe = useStripe();
  const elements = useElements();

  // Component state management
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'succeeded', 'failed'
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState(null);

  /**
   * Card Element styling configuration
   * Provides a professional, branded appearance for the payment form
   */
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true, // Hide postal code field for simplicity
  };

  /**
   * Step 1: Create Payment Intent
   * 
   * This function calls the backend API to create a payment intent.
   * The backend handles:
   * - Stripe secret key usage (secure)
   * - Payment intent creation with proper amount and currency
   * - Customer creation if needed
   * - Metadata and description setting
   * 
   * @returns {Promise<string|null>} Client secret or null if failed
   */
  const createPaymentIntent = async () => {
    try {
      console.log('Creating payment intent for amount:', amount, currency);

      const response = await fetch(`${env.api.baseUrl}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          amount: amount, // Amount in cents
          currency: currency,
          description: description,
          metadata: {
            source: 'arquinorma_frontend',
            feature: 'premium_subscription'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Payment intent created:', data);

      if (!data.client_secret) {
        throw new Error('No client secret received from backend');
      }

      return data.client_secret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setErrorMessage(`Failed to initialize payment: ${error.message}`);
      onError(error);
      return null;
    }
  };

  /**
   * Step 2: Handle Payment Submission
   * 
   * This is the main payment processing function that:
   * 1. Validates the form and Stripe availability
   * 2. Creates a payment intent via backend
   * 3. Confirms the payment with Stripe
   * 4. Handles success and error states
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Prevent double submission
    if (isProcessing || !stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // Step 1: Create payment intent via backend
      console.log('Step 1: Creating payment intent...');
      const clientSecret = await createPaymentIntent();
      
      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      setClientSecret(clientSecret);

      // Step 2: Get card element and validate
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Step 3: Confirm payment with Stripe
      console.log('Step 2: Confirming payment with Stripe...');
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          // Additional billing details can be added here if needed
          billing_details: {
            // name: 'Customer Name',
            // email: 'customer@example.com',
          },
        },
      });

      // Step 4: Handle payment result
      if (error) {
        console.error('Payment confirmation failed:', error);
        setPaymentStatus('failed');
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        onError(error);
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        setPaymentStatus('succeeded');
        setErrorMessage('');
        onSuccess(paymentIntent);
      } else {
        console.warn('Unexpected payment status:', paymentIntent.status);
        setPaymentStatus('failed');
        setErrorMessage('Payment was not completed. Please try again.');
        onError(new Error(`Unexpected payment status: ${paymentIntent.status}`));
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
      onError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Format amount for display (cents to currency)
   * @param {number} amountInCents - Amount in cents
   * @param {string} currencyCode - Currency code (e.g., 'eur', 'usd')
   * @returns {string} Formatted currency string
   */
  const formatAmount = (amountInCents, currencyCode) => {
    const amount = amountInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  };

  /**
   * Get status-specific styling and content
   */
  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'processing':
        return {
          icon: (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          ),
          text: 'Processing payment...',
          className: 'text-indigo-600'
        };
      case 'succeeded':
        return {
          icon: (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ),
          text: 'Payment successful!',
          className: 'text-green-600'
        };
      case 'failed':
        return {
          icon: (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          ),
          text: 'Payment failed',
          className: 'text-red-600'
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Payment Form Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="text-3xl font-bold text-indigo-600">
          {formatAmount(amount, currency)}
        </div>
      </div>

      {/* Payment Status Display */}
      {statusDisplay && (
        <div className={`flex items-center justify-center p-4 rounded-lg mb-6 ${
          paymentStatus === 'succeeded' ? 'bg-green-50' :
          paymentStatus === 'failed' ? 'bg-red-50' :
          'bg-indigo-50'
        }`}>
          {statusDisplay.icon}
          <span className={`ml-2 font-medium ${statusDisplay.className}`}>
            {statusDisplay.text}
          </span>
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-red-800 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {paymentStatus !== 'succeeded' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
              <CardElement options={cardElementOptions} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your payment information is secure and encrypted.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing || disabled}
            className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
              !stripe || !elements || isProcessing || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              `Pay ${formatAmount(amount, currency)}`
            )}
          </button>
        </form>
      )}

      {/* Success Actions */}
      {paymentStatus === 'succeeded' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your payment has been processed successfully!
            </p>
            <button
              onClick={() => {
                setPaymentStatus(null);
                setErrorMessage('');
                setClientSecret(null);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
            >
              Make Another Payment
            </button>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <span>Secured by Stripe • Your card details are encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;

/*
COMPONENT USAGE EXAMPLES:

1. BASIC USAGE:
   ```jsx
   import CheckoutForm from './components/CheckoutForm';
   
   const PaymentPage = () => {
     return (
       <CheckoutForm 
         amount={2000} // €20.00
         currency="eur"
         description="ArquiNorma Premium Monthly"
       />
     );
   };
   ```

2. WITH CALLBACKS:
   ```jsx
   const PaymentPage = () => {
     const handleSuccess = (paymentIntent) => {
       console.log('Payment succeeded:', paymentIntent.id);
       // Redirect to success page, update user status, etc.
     };
   
     const handleError = (error) => {
       console.error('Payment failed:', error);
       // Show error notification, log error, etc.
     };
   
     return (
       <CheckoutForm 
         amount={4999} // €49.99
         currency="eur"
         description="ArquiNorma Corporate Annual"
         onSuccess={handleSuccess}
         onError={handleError}
       />
     );
   };
   ```

3. CONDITIONAL RENDERING:
   ```jsx
   const SubscriptionPage = () => {
     const [showPayment, setShowPayment] = useState(false);
   
     return (
       <div>
         <h1>Choose Your Plan</h1>
         {!showPayment ? (
           <div>
             <button onClick={() => setShowPayment(true)}>
               Subscribe to Premium
             </button>
           </div>
         ) : (
           <CheckoutForm 
             amount={2000}
             currency="eur"
             onSuccess={() => setShowPayment(false)}
             onError={() => setShowPayment(false)}
           />
         )}
       </div>
     );
   };
   ```

SECURITY NOTES:
- Card data is never stored or processed by your application
- All payment processing happens on Stripe's secure servers
- PCI compliance is handled automatically by Stripe Elements
- Client secrets are obtained securely from your backend
- Payment confirmation uses Stripe's secure APIs

BACKEND INTEGRATION:
This component expects your backend to have a /create-payment-intent endpoint that:
1. Accepts POST requests with amount, currency, and description
2. Creates a Stripe PaymentIntent using your secret key
3. Returns the client_secret for frontend confirmation
4. Handles authentication and user validation

Example backend endpoint structure:
```python
@app.post("/create-payment-intent")
async def create_payment_intent(request: PaymentIntentRequest):
    # Validate user authentication
    # Create Stripe PaymentIntent
    # Return client_secret
```
*/





















