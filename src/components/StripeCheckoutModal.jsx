import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * Cursor-Style Stripe Checkout Modal
 * 
 * A frictionless, beautiful checkout experience inspired by Cursor's design.
 * Features:
 * - Clean, minimal UI with smooth animations
 * - Full Catalan translations
 * - Stripe Elements for secure card input
 * - Real-time validation and feedback
 * - Mobile-responsive design
 */

// Initialize Stripe
const stripePromise = loadStripe(env.stripe?.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Subscription tier configuration (Catalan)
const TIERS = {
  basic: {
    id: 'basic',
    name: 'Bàsic',
    price: 5.99,
    period: 'mes',
    description: 'Perfecte per a projectes individuals',
    features: [
      '5 projectes actius',
      '20 documents personalitzats/mes',
      'Preguntes il·limitades a l\'IA',
      'Accés complet a la normativa',
      'Suport per correu electrònic'
    ],
    color: 'blue',
    popular: false
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 14.99,
    period: 'mes',
    description: 'Ideal per a professionals',
    features: [
      '25 projectes actius',
      '100 documents personalitzats/mes',
      'Preguntes il·limitades a l\'IA',
      'Accés complet a la normativa',
      '3 membres de l\'equip',
      'Suport prioritari'
    ],
    color: 'amber',
    popular: true
  },
  studio: {
    id: 'studio',
    name: 'Estudi',
    price: 49.00,
    period: 'mes',
    description: 'Per a equips i despatxos',
    features: [
      'Projectes il·limitats',
      'Documents il·limitats',
      'Preguntes il·limitades a l\'IA',
      'Accés complet a la normativa',
      '10 membres de l\'equip',
      'Accés API',
      'Suport dedicat'
    ],
    color: 'purple',
    popular: false
  }
};

// Catalan translations
const TRANSLATIONS = {
  title: 'Actualitza el teu pla',
  subtitle: 'Desbloqueja tot el potencial d\'ArquiNorma',
  selectPlan: 'Selecciona un pla',
  paymentDetails: 'Dades de pagament',
  cardNumber: 'Número de targeta',
  processing: 'Processant...',
  subscribe: 'Subscriure\'s',
  subscribeTo: 'Subscriure\'s a',
  perMonth: '/mes',
  popular: 'Popular',
  currentPlan: 'Pla actual',
  securePayment: 'Pagament segur amb Stripe',
  cancelAnytime: 'Cancel·la quan vulguis',
  success: 'Subscripció activada!',
  successMessage: 'Gràcies per confiar en ArquiNorma. El teu pla ja està actiu.',
  continue: 'Continuar',
  close: 'Tancar',
  back: 'Tornar',
  errors: {
    generic: 'S\'ha produït un error. Si us plau, torna-ho a provar.',
    cardDeclined: 'La targeta ha estat rebutjada.',
    expiredCard: 'La targeta ha caducat.',
    incorrectCvc: 'El codi de seguretat és incorrecte.',
    processingError: 'Error en processar el pagament.',
    networkError: 'Error de connexió. Comprova la teva connexió a internet.'
  }
};

/**
 * Payment Form Component (uses Stripe hooks)
 */
const PaymentForm = ({ 
  selectedTier, 
  onSuccess, 
  onBack, 
  userId, 
  userEmail,
  onProcessing 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const tier = TIERS[selectedTier];

  // Card element styling - matches Cursor's clean aesthetic
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#9ca3af',
        },
        padding: '12px 0',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    onProcessing(true);

    try {
      // Step 1: Create SetupIntent
      const backendUrl = env.api.baseUrl;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No hi ha sessió activa');
      }

      const setupResponse = await fetch(`${backendUrl}/stripe-elements/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail
        })
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        throw new Error(errorData.detail || 'Error creant l\'intent de pagament');
      }

      const { client_secret, customer_id } = await setupResponse.json();

      // Step 2: Confirm card setup with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: userEmail
          }
        }
      });

      if (setupError) {
        throw new Error(setupError.message);
      }

      // Step 3: Create subscription with the payment method
      const subscriptionResponse = await fetch(`${backendUrl}/stripe-elements/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail,
          tier: selectedTier,
          payment_method_id: setupIntent.payment_method
        })
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.detail || 'Error creant la subscripció');
      }

      const subscriptionData = await subscriptionResponse.json();
      
      // Handle 3D Secure if required
      if (subscriptionData.status === 'requires_action') {
        // Handle additional authentication if needed
        setError('Es requereix autenticació addicional. Si us plau, completa la verificació.');
        return;
      }

      onSuccess(subscriptionData);

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || TRANSLATIONS.errors.generic);
    } finally {
      setIsProcessing(false);
      onProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected Plan Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{TRANSLATIONS.subscribeTo}</p>
            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              €{tier.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{TRANSLATIONS.perMonth}</p>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {TRANSLATIONS.cardNumber}
        </label>
        <div className="relative">
          <div className="border-2 border-gray-200 rounded-xl p-4 transition-all duration-200 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 bg-white">
            <CardElement 
              options={cardElementOptions}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setError(e.error.message);
                } else {
                  setError(null);
                }
              }}
            />
          </div>
          {/* Card brands */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1.5">
            <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-6" />
            <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-6" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !cardComplete || isProcessing}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg
          transition-all duration-200 transform
          ${!stripe || !cardComplete || isProcessing
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0'
          }
        `}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {TRANSLATIONS.processing}
          </span>
        ) : (
          <span>{TRANSLATIONS.subscribe} — €{tier.price.toFixed(2)}{TRANSLATIONS.perMonth}</span>
        )}
      </button>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        disabled={isProcessing}
        className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
      >
        ← {TRANSLATIONS.back}
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>{TRANSLATIONS.securePayment}</span>
        <span>•</span>
        <span>{TRANSLATIONS.cancelAnytime}</span>
      </div>
    </form>
  );
};

/**
 * Plan Selection Component
 */
const PlanSelection = ({ selectedTier, onSelect, currentTier }) => {
  return (
    <div className="space-y-4">
      {Object.entries(TIERS).map(([tierId, tier]) => {
        const isSelected = selectedTier === tierId;
        const isCurrent = currentTier === tierId;
        
        return (
          <button
            key={tierId}
            onClick={() => !isCurrent && onSelect(tierId)}
            disabled={isCurrent}
            className={`
              w-full p-5 rounded-2xl text-left transition-all duration-200 relative overflow-hidden
              ${isSelected 
                ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-500 shadow-lg shadow-amber-500/10' 
                : isCurrent
                  ? 'bg-gray-50 border-2 border-gray-200 opacity-60 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            {/* Popular Badge */}
            {tier.popular && !isCurrent && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  {TRANSLATIONS.popular}
                </div>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrent && (
              <div className="absolute top-0 right-0">
                <div className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  {TRANSLATIONS.currentPlan}
                </div>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-3">{tier.description}</p>
                <ul className="space-y-1.5">
                  {tier.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  {tier.features.length > 3 && (
                    <li className="text-sm text-gray-400">
                      +{tier.features.length - 3} més...
                    </li>
                  )}
                </ul>
              </div>
              <div className="text-right ml-4">
                <p className="text-2xl font-bold text-gray-900">€{tier.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">/{tier.period}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Success Screen Component
 */
const SuccessScreen = ({ tier, onClose }) => {
  const tierData = TIERS[tier];
  
  return (
    <div className="text-center py-8">
      {/* Success Animation */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {TRANSLATIONS.success}
      </h2>
      <p className="text-gray-600 mb-6">
        {TRANSLATIONS.successMessage}
      </p>

      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 mb-6 inline-block">
        <p className="text-sm text-gray-500 mb-1">El teu nou pla</p>
        <p className="text-xl font-bold text-gray-900">{tierData?.name || tier}</p>
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25"
      >
        {TRANSLATIONS.continue}
      </button>
    </div>
  );
};

/**
 * Main Checkout Modal Component
 */
const StripeCheckoutModal = ({ 
  isOpen, 
  onClose, 
  currentTier = 'free',
  preselectedTier = null 
}) => {
  const [step, setStep] = useState('select'); // 'select', 'payment', 'success'
  const [selectedTier, setSelectedTier] = useState(preselectedTier || 'pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
      }
    };
    if (isOpen) {
      loadUser();
      setStep(preselectedTier ? 'payment' : 'select');
      setSelectedTier(preselectedTier || 'pro');
    }
  }, [isOpen, preselectedTier]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isProcessing, onClose]);

  if (!isOpen) return null;

  const handleSelectPlan = (tierId) => {
    setSelectedTier(tierId);
    setStep('payment');
  };

  const handlePaymentSuccess = (data) => {
    setStep('success');
  };

  const handleClose = () => {
    if (!isProcessing) {
      setStep('select');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`
            relative bg-white rounded-3xl shadow-2xl w-full max-w-lg
            transform transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className={`
              absolute top-4 right-4 p-2 rounded-full
              transition-all duration-200 z-10
              ${isProcessing 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Content */}
          <div className="p-8">
            {step !== 'success' && (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  {/* Logo/Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {TRANSLATIONS.title}
                  </h1>
                  <p className="text-gray-500">
                    {TRANSLATIONS.subtitle}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <div className={`w-2 h-2 rounded-full transition-colors ${step === 'select' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <div className={`w-8 h-0.5 ${step === 'payment' ? 'bg-amber-500' : 'bg-gray-200'}`} />
                  <div className={`w-2 h-2 rounded-full transition-colors ${step === 'payment' ? 'bg-amber-500' : 'bg-gray-300'}`} />
                </div>
              </>
            )}

            {/* Step Content */}
            {step === 'select' && (
              <PlanSelection
                selectedTier={selectedTier}
                onSelect={handleSelectPlan}
                currentTier={currentTier}
              />
            )}

            {step === 'payment' && (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  selectedTier={selectedTier}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setStep('select')}
                  userId={userId}
                  userEmail={userEmail}
                  onProcessing={setIsProcessing}
                />
              </Elements>
            )}

            {step === 'success' && (
              <SuccessScreen
                tier={selectedTier}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutModal;

