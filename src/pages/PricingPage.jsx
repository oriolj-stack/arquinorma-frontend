import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * PricingPage Component for ArquiNorma
 * 
 * Displays the 3 subscription tiers (Basic, Pro, Studio) with features and pricing.
 * Handles Stripe checkout session creation and redirection.
 */

const PricingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscription tiers configuration
  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5.99,
      currency: 'EUR',
      period: 'month',
      description: 'Perfect for individual users and small projects',
      features: [
        'Unlimited AI questions',
        'Up to 5 active projects',
        'Access to all municipalities',
        'No custom PDF uploads'
      ],
      color: 'blue',
      recommended: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 14.99,
      currency: 'EUR',
      period: 'month',
      description: 'Ideal for professionals and growing teams',
      features: [
        'Unlimited questions',
        'Unlimited projects',
        'Unlimited custom PDF uploads',
        'Priority embeddings',
        'Document comparison',
        'Multi-town projects'
      ],
      color: 'green',
      recommended: true
    },
    {
      id: 'studio',
      name: 'Studio',
      price: 49.00,
      currency: 'EUR',
      period: 'month',
      description: 'For teams and organizations',
      features: [
        '10 team seats included',
        'Unlimited projects',
        'Unlimited questions',
        'Unlimited custom PDF uploads',
        'Team dashboard',
        'Admin controls',
        'API access (limited)'
      ],
      color: 'orange',
      recommended: false
    }
  ];

  /**
   * Handle subscription selection and create Stripe checkout session
   */
  const handleSubscribe = async (tierId) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        navigate('/login?redirect=/pricing');
        return;
      }

      // Determine backend URL - use proxy in development if baseUrl is not set
      const backendUrl = env.api.baseUrl || (import.meta.env.DEV ? '' : 'https://your-backend-url.com');
      const apiUrl = backendUrl ? `${backendUrl}/stripe/create-checkout-session` : '/stripe/create-checkout-session';

      console.log('Creating checkout session:', { tierId, apiUrl, userId: session.user.id });

      // Call backend to create checkout session
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          subscription_level: tierId,  // basic, pro, or studio
          user_id: session.user.id,
          user_email: session.user.email,
          success_url: `${window.location.origin}/account?tab=subscription&success=true`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`
        })
      });

      // Get response data for better error messages
      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.detail || responseData.message || 'Failed to create checkout session';
        console.error('Backend error:', responseData);
        throw new Error(errorMessage);
      }

      if (!responseData.url) {
        console.error('No URL in response:', responseData);
        throw new Error('No checkout URL received from server');
      }

      console.log('Checkout session created, redirecting to:', responseData.url);
      
      // Redirect to Stripe Checkout
      window.location.href = responseData.url;

    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Format price for display
   */
  const formatPrice = (price, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  /**
   * Get color classes for tier styling
   */
  const getTierColors = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-blue-600',
        accent: 'bg-blue-500'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        button: 'bg-green-600 hover:bg-green-700',
        text: 'text-green-600',
        accent: 'bg-green-500'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        button: 'bg-orange-600 hover:bg-orange-700',
        text: 'text-orange-600',
        accent: 'bg-orange-500'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tiers Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const colors = getTierColors(tier.color);
            
            return (
              <div
                key={tier.id}
                className={`relative bg-white rounded-lg shadow-lg border-2 ${
                  tier.recommended 
                    ? `${colors.border} ring-2 ring-opacity-50` 
                    : 'border-gray-200'
                } overflow-hidden`}
              >
                {/* Recommended Badge */}
                {tier.recommended && (
                  <div className={`absolute top-0 right-0 ${colors.accent} text-white px-4 py-1 text-sm font-medium rounded-bl-lg`}>
                    Recommended
                  </div>
                )}

                <div className="p-8">
                  {/* Tier Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(tier.price, tier.currency)}
                      </span>
                      <span className="text-gray-600 ml-2">/{tier.period}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
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
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading}
                    className={`w-full ${colors.button} text-white px-6 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `Subscribe to ${tier.name}`
                    )}
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

export default PricingPage;

