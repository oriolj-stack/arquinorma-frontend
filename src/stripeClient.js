import { loadStripe } from '@stripe/stripe-js';
import { env } from './config/env';

/**
 * Stripe Client Configuration for ArquiNorma
 * 
 * This file initializes and exports Stripe functionality for handling payments and subscriptions.
 * It provides a clean interface for creating checkout sessions and managing subscription flows.
 * 
 * Environment variables are managed by the centralized env configuration.
 * All validation is handled automatically when the env module is imported.
 */

/**
 * Initialize Stripe instance
 * This is a promise that resolves to the Stripe object
 */
let stripePromise = null;

/**
 * Gets the Stripe instance, initializing it if necessary
 * 
 * @returns {Promise<Stripe|null>} Promise that resolves to Stripe instance
 */
const getStripe = () => {
  if (!stripePromise && env.stripe.publicKey) {
    stripePromise = loadStripe(env.stripe.publicKey);
  }
  return stripePromise;
};

/**
 * Subscription level configurations
 * These should match the product configurations in your Stripe dashboard
 */
export const subscriptionLevels = {
  personal: {
    name: 'ArquiNorma Personal',
    description: 'Perfect for individual users',
    features: [
      'Up to 50 PDF documents',
      'Basic chat functionality', 
      'Email support',
      '5GB storage'
    ],
    price: '$9.99/month',
    recommended: false
  },
  corporate: {
    name: 'ArquiNorma Corporate', 
    description: 'Ideal for teams and organizations',
    features: [
      'Unlimited PDF documents',
      'Advanced chat features',
      'Priority support',
      'Team collaboration',
      'API access',
      '100GB storage'
    ],
    price: '$49.99/month',
    recommended: true
  }
};

/**
 * Creates a Stripe checkout session and redirects user to Stripe Checkout
 * 
 * This function handles the complete checkout flow:
 * 1. Validates the subscription level
 * 2. Calls backend API to create checkout session
 * 3. Redirects user to Stripe Checkout page
 * 4. Handles errors gracefully with user feedback
 * 
 * BACKEND INTEGRATION:
 * - Calls POST /create-checkout-session endpoint
 * - Sends subscription level and user information
 * - Receives checkout session ID for redirection
 * - Handles authentication and user context
 * 
 * @param {string} subscriptionLevel - The subscription level ('personal' or 'corporate')
 * @param {Object} options - Additional options for checkout
 * @param {string} options.successUrl - URL to redirect after successful payment
 * @param {string} options.cancelUrl - URL to redirect if user cancels
 * @param {Object} options.userInfo - User information for checkout
 * @param {Object} options.metadata - Additional metadata for the checkout session
 * 
 * @returns {Promise<Object>} Result object with success status and error if any
 * 
 * @example
 * const result = await checkout('personal', {
 *   successUrl: 'https://myapp.com/success',
 *   cancelUrl: 'https://myapp.com/cancel',
 *   userInfo: { email: 'user@example.com', userId: '123' }
 * });
 * 
 * if (!result.success) {
 *   console.error('Checkout failed:', result.error);
 * }
 */
export const checkout = async (subscriptionLevel, options = {}) => {
  try {
    console.log(`Initiating Stripe checkout for subscription: ${subscriptionLevel}`);

    // VALIDATE SUBSCRIPTION LEVEL
    const validLevels = Object.keys(subscriptionLevels);
    if (!validLevels.includes(subscriptionLevel)) {
      throw new Error(
        `Invalid subscription level: ${subscriptionLevel}. Must be one of: ${validLevels.join(', ')}`
      );
    }

    // VALIDATE STRIPE CONFIGURATION
    if (!env.stripe.publicKey) {
      throw new Error(
        'Stripe is not configured. Please check your environment variables.'
      );
    }

    /**
     * BACKEND API CALL: Create Checkout Session
     * 
     * This calls your FastAPI backend endpoint to create a Stripe checkout session.
     * The backend handles:
     * - Stripe secret key usage (secure)
     * - Product/price ID mapping
     * - User authentication and validation
     * - Session configuration and metadata
     */
    console.log(`Calling backend API: ${env.api.baseUrl}/create-checkout-session`);
    
    const response = await fetch(`${env.api.baseUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        subscription_level: subscriptionLevel,
        success_url: options.successUrl || `${window.location.origin}/success`,
        cancel_url: options.cancelUrl || `${window.location.origin}/cancel`,
        user_info: options.userInfo || {},
        metadata: options.metadata || {}
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    const data = await response.json();
    console.log('Checkout session created:', data);

    // Validate response structure
    if (!data.session_id) {
      throw new Error('No session ID received from backend');
    }

    /**
     * STRIPE CHECKOUT REDIRECTION
     * 
     * Once we have the session ID from our backend, we redirect the user
     * to Stripe's hosted checkout page. This handles:
     * - Secure payment processing
     * - PCI compliance
     * - Multiple payment methods
     * - Mobile-optimized experience
     */
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Failed to load Stripe. Please check your Stripe public key configuration.');
    }

    console.log('Redirecting to Stripe Checkout...');
    
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: data.session_id,
    });

    // Handle Stripe redirection errors
    if (error) {
      console.error('Stripe redirection error:', error);
      throw new Error(error.message || 'Failed to redirect to Stripe Checkout');
    }

    // If we reach here, redirection was successful
    return { success: true };

  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * Comprehensive error handling for different failure scenarios:
     * - Network connectivity issues
     * - Backend API errors
     * - Stripe configuration problems
     * - Invalid subscription levels
     * - Stripe service issues
     */
    console.error('Checkout error:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'An unexpected error occurred during checkout';
    
    if (error.message.includes('Invalid subscription level')) {
      userMessage = 'Invalid subscription plan selected. Please try again.';
    } else if (error.message.includes('HTTP error')) {
      userMessage = 'Unable to connect to payment service. Please try again.';
    } else if (error.message.includes('Stripe')) {
      userMessage = 'Payment service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    }

    return {
      success: false,
      error: userMessage,
      originalError: error.message
    };
  }
};

/**
 * Gets subscription details for a given level
 * 
 * @param {string} level - Subscription level
 * @returns {Object|null} Subscription configuration or null if not found
 */
export const getSubscriptionDetails = (level) => {
  return subscriptionLevels[level] || null;
};

/**
 * Gets formatted price for a subscription level
 * 
 * @param {string} level - Subscription level
 * @returns {string} Formatted price string
 */
export const getFormattedPrice = (level) => {
  const details = getSubscriptionDetails(level);
  return details ? details.price : 'Price not available';
};

/**
 * Checks if a subscription level is recommended
 * 
 * @param {string} level - Subscription level
 * @returns {boolean} True if recommended
 */
export const isRecommended = (level) => {
  const details = getSubscriptionDetails(level);
  return details ? details.recommended : false;
};

// Export Stripe instance getter for advanced usage
export { getStripe };

// Export stripePromise for Elements provider
export { stripePromise };

// Default export for convenience
export default {
  checkout,
  getStripe,
  subscriptionLevels,
  getSubscriptionDetails,
  getFormattedPrice,
  isRecommended
};

/*
USAGE EXAMPLES:

1. BASIC CHECKOUT:
   ```javascript
   import { checkout } from '/src/stripeClient';
   
   const handleUpgrade = async () => {
     const result = await checkout('personal');
     if (!result.success) {
       alert('Checkout failed: ' + result.error);
     }
   };
   ```

2. CHECKOUT WITH OPTIONS:
   ```javascript
   import { checkout } from '/src/stripeClient';
   
   const handleUpgradeWithOptions = async () => {
     const result = await checkout('corporate', {
       successUrl: 'https://myapp.com/welcome',
       cancelUrl: 'https://myapp.com/pricing',
       userInfo: {
         email: user.email,
         userId: user.id
       },
       metadata: {
         source: 'pricing_page',
         campaign: 'summer_sale'
       }
     });
     
     if (!result.success) {
       setError(result.error);
     }
   };
   ```

3. GET SUBSCRIPTION INFO:
   ```javascript
   import { getSubscriptionDetails, getFormattedPrice } from '/src/stripeClient';
   
   const personalPlan = getSubscriptionDetails('personal');
   const price = getFormattedPrice('personal');
   
   console.log(`${personalPlan.name}: ${price}`);
   ```

4. DISPLAY SUBSCRIPTION OPTIONS:
   ```javascript
   import { subscriptionLevels, checkout } from '/src/stripeClient';
   
   const SubscriptionOptions = () => {
     return (
       <div>
         {Object.entries(subscriptionLevels).map(([level, details]) => (
           <div key={level}>
             <h3>{details.name} - {details.price}</h3>
             <p>{details.description}</p>
             <ul>
               {details.features.map(feature => <li key={feature}>{feature}</li>)}
             </ul>
             <button onClick={() => checkout(level)}>
               Subscribe to {details.name}
             </button>
           </div>
         ))}
       </div>
     );
   };
   ```

ENVIRONMENT SETUP:
Create a .env.local file in your frontend directory with:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key
VITE_BACKEND_URL=http://localhost:8000
```

SECURITY NOTES:
- Only the Stripe publishable key is used in frontend (safe to expose)
- Secret keys are handled by the backend only
- All payment processing happens on Stripe's secure servers
- User is redirected to Stripe's PCI-compliant checkout page

This client provides a complete, production-ready Stripe integration
with comprehensive error handling and flexible configuration options.
*/
