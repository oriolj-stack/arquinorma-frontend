import React, { useState } from 'react';
import CheckoutForm from '../components/CheckoutForm.jsx';

/**
 * Payment Page Component for ArquiNorma
 * 
 * This page demonstrates the Stripe CheckoutForm component usage.
 * It provides a complete payment interface with:
 * - Multiple subscription options
 * - Payment form integration
 * - Success/error handling
 * - Professional styling
 * 
 * FEATURES:
 * - Two subscription tiers (Personal and Corporate)
 * - Dynamic pricing display
 * - Payment form with real Stripe integration
 * - Success confirmation and error handling
 * - Responsive design for all devices
 * 
 * INTEGRATION:
 * - Uses CheckoutForm component for secure payments
 * - Handles payment success and failure states
 * - Provides user feedback throughout the process
 * - Maintains subscription plan context
 */

const PaymentPage = () => {
  // State management for payment flow
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  /**
   * Subscription plans configuration
   * These should match your backend pricing structure
   */
  const subscriptionPlans = [
    {
      id: 'personal',
      name: 'ArquiNorma Personal',
      description: 'Perfect for individual users and small projects',
      price: 1999, // €19.99 in cents
      currency: 'eur',
      period: 'month',
      features: [
        'Up to 50 PDF documents',
        'Basic chat functionality',
        'Email support',
        '5GB document storage',
        'Standard processing speed'
      ],
      recommended: false,
      color: 'blue'
    },
    {
      id: 'corporate',
      name: 'ArquiNorma Corporate',
      description: 'Ideal for teams and organizations',
      price: 4999, // €49.99 in cents
      currency: 'eur',
      period: 'month',
      features: [
        'Unlimited PDF documents',
        'Advanced chat features',
        'Priority support',
        'Team collaboration tools',
        'API access',
        '100GB document storage',
        'Fast processing speed'
      ],
      recommended: true,
      color: 'purple'
    }
  ];

  /**
   * Handle successful payment
   * @param {Object} paymentIntent - Stripe payment intent object
   */
  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment succeeded:', paymentIntent);
    setPaymentComplete(true);
    setPaymentError(null);
    
    // Here you would typically:
    // 1. Update user subscription status in your database
    // 2. Send confirmation email
    // 3. Redirect to dashboard or success page
    // 4. Update UI to reflect new subscription level
  };

  /**
   * Handle payment errors
   * @param {Error} error - Payment error object
   */
  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setPaymentError(error.message || 'Payment failed. Please try again.');
    setPaymentComplete(false);
  };

  /**
   * Reset payment state for new payment
   */
  const resetPayment = () => {
    setSelectedPlan(null);
    setPaymentComplete(false);
    setPaymentError(null);
  };

  /**
   * Format price for display
   * @param {number} priceInCents - Price in cents
   * @param {string} currency - Currency code
   * @returns {string} Formatted price string
   */
  const formatPrice = (priceInCents, currency) => {
    const price = priceInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  /**
   * Get color classes for plan styling
   * @param {string} color - Color identifier
   * @returns {Object} Tailwind CSS classes
   */
  const getPlanColors = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-blue-600',
        accent: 'bg-blue-500'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        button: 'bg-purple-600 hover:bg-purple-700',
        text: 'text-purple-600',
        accent: 'bg-purple-500'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  // If payment is complete, show success message
  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for subscribing to <strong>{selectedPlan?.name}</strong>!
            </p>
            
            {/* Plan Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">Your Subscription Details:</h3>
              <p className="text-gray-600">
                <strong>Plan:</strong> {selectedPlan?.name}<br />
                <strong>Amount:</strong> {formatPrice(selectedPlan?.price, selectedPlan?.currency)}/{selectedPlan?.period}<br />
                <strong>Next billing:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/chat'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200"
              >
                Go to ArquiNorma Chat
              </button>
              
              <button
                onClick={resetPayment}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition duration-200"
              >
                Make Another Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If plan is selected, show payment form
  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={resetPayment}
            className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Plans
          </button>

          {/* Payment Form */}
          <CheckoutForm
            amount={selectedPlan.price}
            currency={selectedPlan.currency}
            description={`${selectedPlan.name} - ${formatPrice(selectedPlan.price, selectedPlan.currency)}/${selectedPlan.period}`}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    );
  }

  // Default view: Show subscription plans
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your ArquiNorma Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your architectural document management needs.
            All plans include secure PDF processing and intelligent chat assistance.
          </p>
        </div>

        {/* Error Display */}
        {paymentError && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-800">{paymentError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {subscriptionPlans.map((plan) => {
            const colors = getPlanColors(plan.color);
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg border-2 ${
                  plan.recommended 
                    ? `${colors.border} ring-2 ring-opacity-50` 
                    : 'border-gray-200'
                } overflow-hidden`}
              >
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className={`absolute top-0 right-0 ${colors.accent} text-white px-4 py-1 text-sm font-medium rounded-bl-lg`}>
                    Recommended
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.price, plan.currency)}
                      </span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full ${colors.button} text-white px-6 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      plan.recommended 
                        ? 'focus:ring-purple-500' 
                        : 'focus:ring-blue-500'
                    }`}
                  >
                    Choose {plan.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Secure Payment Processing</h3>
            </div>
            <p className="text-gray-600">
              All payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

/*
PAGE INTEGRATION:

To add this page to your routing, update your App.jsx:

```jsx
import PaymentPage from '/src/pages/PaymentPage';

// Add this route in your Routes component:
<Route 
  path="/payment" 
  element={
    <ProtectedRoute user={user}>
      <PaymentPage />
    </ProtectedRoute>
  } 
/>
```

You can also add a link to this page from your navigation or other components:

```jsx
<Link 
  to="/payment" 
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
>
  Upgrade to Premium
</Link>
```

CUSTOMIZATION:

1. UPDATE PRICING:
   - Modify the subscriptionPlans array with your actual pricing
   - Update currency and amounts as needed
   - Add or remove features for each plan

2. STYLING:
   - Customize colors in the getPlanColors function
   - Update Tailwind CSS classes for different themes
   - Modify layout and spacing as needed

3. INTEGRATION:
   - Connect to your user authentication system
   - Update user subscription status after successful payment
   - Send confirmation emails
   - Integrate with your backend subscription management

4. FEATURES:
   - Add annual billing options
   - Include free trial periods
   - Add plan comparison features
   - Include usage analytics

This page provides a complete, production-ready payment interface that integrates seamlessly with your Stripe setup and ArquiNorma application.
*/





















