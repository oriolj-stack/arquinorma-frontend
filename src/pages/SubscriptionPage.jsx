import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * Subscription Management Page
 * 
 * Full-page subscription management inspired by Cursor's billing page.
 * Features:
 * - Current subscription overview
 * - Payment methods management
 * - Billing information
 * - Plan upgrade/downgrade
 * - Subscription cancellation
 * 
 * All text in Catalan
 */

// Initialize Stripe
const stripePromise = loadStripe(env.stripe?.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Subscription tiers configuration with detailed information
const TIERS = {
  free: {
    id: 'free',
    name: 'Gratuït',
    price: 0,
    description: 'Per començar',
    tagline: 'Descobreix ArquiNorma sense compromís',
    features: ['1 projecte actiu', '3 documents/mes', 'Preguntes il·limitades'],
    detailedFeatures: [
      { name: 'Projectes actius', value: '1', included: true },
      { name: 'Documents personalitzats al mes', value: '3', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Accés a normativa bàsica', value: 'Sí', included: true },
      { name: 'Suport per correu', value: 'No', included: false },
      { name: 'Membres de l\'equip', value: '1', included: true },
      { name: 'Pujades de PDF personalitzats', value: 'No', included: false },
      { name: 'Comparació de documents', value: 'No', included: false },
      { name: 'Accés API', value: 'No', included: false },
    ],
    idealFor: 'Ideal per a estudiants i particulars que volen explorar la plataforma.'
  },
  basic: {
    id: 'basic',
    name: 'Bàsic',
    price: 5.99,
    description: 'Per a projectes individuals',
    tagline: 'Tot el que necessites per gestionar projectes petits',
    features: ['5 projectes actius', '20 documents/mes', 'Suport per correu'],
    detailedFeatures: [
      { name: 'Projectes actius', value: '5', included: true },
      { name: 'Documents personalitzats al mes', value: '20', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Accés a normativa completa', value: 'Sí', included: true },
      { name: 'Suport per correu', value: 'Sí', included: true },
      { name: 'Membres de l\'equip', value: '1', included: true },
      { name: 'Pujades de PDF personalitzats', value: 'No', included: false },
      { name: 'Comparació de documents', value: 'No', included: false },
      { name: 'Accés API', value: 'No', included: false },
    ],
    idealFor: 'Ideal per a arquitectes autònoms i petits despatxos amb projectes ocasionals.'
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 14.99,
    description: 'Per a professionals',
    tagline: 'La solució completa per a professionals exigents',
    features: ['25 projectes actius', '100 documents/mes', '3 membres', 'Suport prioritari'],
    detailedFeatures: [
      { name: 'Projectes actius', value: '25', included: true },
      { name: 'Documents personalitzats al mes', value: '100', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Accés a normativa completa', value: 'Sí', included: true },
      { name: 'Suport prioritari', value: 'Sí', included: true },
      { name: 'Membres de l\'equip', value: '3', included: true },
      { name: 'Pujades de PDF personalitzats', value: 'Il·limitades', included: true },
      { name: 'Comparació de documents', value: 'Sí', included: true },
      { name: 'Accés API', value: 'No', included: false },
    ],
    idealFor: 'Ideal per a despatxos professionals amb múltiples projectes actius.'
  },
  studio: {
    id: 'studio',
    name: 'Estudi',
    price: 49.00,
    description: 'Per a equips',
    tagline: 'Potència màxima per a equips i estudis d\'arquitectura',
    features: ['Projectes il·limitats', 'Documents il·limitats', '10 membres', 'API', 'Suport dedicat'],
    detailedFeatures: [
      { name: 'Projectes actius', value: 'Il·limitats', included: true },
      { name: 'Documents personalitzats al mes', value: 'Il·limitats', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Accés a normativa completa', value: 'Sí', included: true },
      { name: 'Suport dedicat', value: 'Sí', included: true },
      { name: 'Membres de l\'equip', value: '10', included: true },
      { name: 'Pujades de PDF personalitzats', value: 'Il·limitades', included: true },
      { name: 'Comparació de documents', value: 'Sí', included: true },
      { name: 'Accés API', value: 'Sí', included: true },
      { name: 'Tauler d\'equip', value: 'Sí', included: true },
      { name: 'Formació personalitzada', value: 'Sí', included: true },
    ],
    idealFor: 'Ideal per a estudis d\'arquitectura amb equips grans i necessitats avançades.'
  }
};

// Plan order for display (excluding free for paid plans list)
const PAID_PLANS = ['basic', 'pro', 'studio'];

// Catalan translations
const T = {
  pageTitle: 'Gestió de la subscripció',
  needHelp: 'Necessites ajuda?',
  contactSupport: 'Contacta amb suport@arquinorma.cat',
  
  // Sidebar plans
  ourPlans: 'ELS NOSTRES PLANS',
  mySubscription: 'LA MEVA SUBSCRIPCIÓ',
  
  // Current subscription
  currentSubscription: 'SUBSCRIPCIÓ ACTUAL',
  perMonth: 'al mes',
  viewDetails: 'Veure detalls',
  nextBilling: 'La propera facturació és el',
  cancelSubscription: 'Cancel·lar subscripció',
  reactivate: 'Reactivar subscripció',
  cancelsOn: 'Es cancel·larà el',
  
  // Payment methods
  paymentMethods: 'MÈTODES DE PAGAMENT',
  default: 'Per defecte',
  expires: 'Caduca',
  addPaymentMethod: '+ Afegir mètode de pagament',
  setAsDefault: 'Establir per defecte',
  remove: 'Eliminar',
  
  // Billing info
  billingInfo: 'INFORMACIÓ DE FACTURACIÓ',
  name: 'Nom',
  email: 'Correu electrònic',
  
  // Upgrade section
  changePlan: 'CANVIAR DE PLA',
  currentPlan: 'Pla actual',
  upgrade: 'Actualitzar',
  downgrade: 'Canviar',
  popular: 'Popular',
  
  // Add card modal
  addCard: 'Afegir targeta',
  cardNumber: 'Número de targeta',
  save: 'Desar',
  cancel: 'Cancel·lar',
  processing: 'Processant...',
  
  // Messages
  subscriptionUpdated: 'Subscripció actualitzada correctament',
  paymentMethodAdded: 'Mètode de pagament afegit',
  paymentMethodRemoved: 'Mètode de pagament eliminat',
  error: 'S\'ha produït un error',
  
  // Loading
  loading: 'Carregant...',
  
  // Confirm dialogs
  confirmCancel: 'Estàs segur que vols cancel·lar la subscripció?',
  confirmRemoveCard: 'Estàs segur que vols eliminar aquesta targeta?',
  
  // No subscription
  noSubscription: 'No tens cap subscripció activa',
  choosePlan: 'Tria un pla per començar',
  
  // Plan details page
  planDetails: 'DETALLS DEL PLA',
  featuresIncluded: 'Característiques incloses',
  idealFor: 'Ideal per a',
  selectPlan: 'Seleccionar aquest pla',
  backToSubscription: '← Tornar a la subscripció'
};

/**
 * Add Payment Method Modal
 * 
 * European PSD2/SCA compliant card form with:
 * - Cardholder name (required for 3D Secure)
 * - Card number
 * - Expiry date
 * - CVC
 */
const AddPaymentMethodModal = ({ isOpen, onClose, onSuccess, userId, userEmail }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  });

  const elementStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': { color: '#9ca3af' },
      },
      invalid: { color: '#ef4444' },
    },
  };

  const handleElementChange = (elementType) => (event) => {
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete
    }));
    if (event.error) {
      setError(event.error.message);
    } else if (error) {
      setError(null);
    }
  };

  const isFormComplete = cardComplete.cardNumber && cardComplete.cardExpiry && cardComplete.cardCvc && cardholderName.trim().length >= 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || isProcessing || !isFormComplete) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hi ha sessió activa');

      const backendUrl = env.api?.baseUrl || 'http://localhost:8000';

      // Create SetupIntent
      const setupResponse = await fetch(`${backendUrl}/stripe-elements/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user_id: userId, user_email: userEmail })
      });

      if (!setupResponse.ok) {
        const err = await setupResponse.json();
        throw new Error(err.detail || 'Error creant l\'intent');
      }

      const { client_secret } = await setupResponse.json();

      // Confirm card setup using CardNumberElement with billing details for PSD2/SCA
      const cardNumberElement = elements.getElement(CardNumberElement);
      const { error: setupError } = await stripe.confirmCardSetup(client_secret, {
        payment_method: { 
          card: cardNumberElement, 
          billing_details: { 
            name: cardholderName.trim(),
            email: userEmail 
          } 
        }
      });

      if (setupError) throw new Error(setupError.message);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCardholderName('');
      setError(null);
      setCardComplete({ cardNumber: false, cardExpiry: false, cardCvc: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        {/* Header with card logos */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{T.addCard}</h3>
          <div className="flex items-center gap-2">
            {/* Visa Logo */}
            <div className="h-6 px-2 bg-[#1A1F71] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-wide">VISA</span>
            </div>
            {/* Mastercard Logo */}
            <div className="h-6 w-10 flex items-center justify-center">
              <div className="relative flex">
                <div className="w-4 h-4 bg-[#EB001B] rounded-full"></div>
                <div className="w-4 h-4 bg-[#F79E1B] rounded-full -ml-2"></div>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cardholder Name - Required for European PSD2/SCA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom del titular
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Nom tal com apareix a la targeta"
              className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 bg-gray-50 outline-none transition-all text-gray-900 placeholder-gray-400"
              required
            />
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de targeta
            </label>
            <div className="border-2 border-gray-200 rounded-xl p-4 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 bg-gray-50">
              <CardNumberElement 
                options={elementStyle} 
                onChange={handleElementChange('cardNumber')}
              />
            </div>
          </div>

          {/* Expiry and CVC Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caducitat
              </label>
              <div className="border-2 border-gray-200 rounded-xl p-4 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 bg-gray-50">
                <CardExpiryElement 
                  options={elementStyle} 
                  onChange={handleElementChange('cardExpiry')}
                />
              </div>
            </div>

            {/* CVC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVC / CVV
              </label>
              <div className="border-2 border-gray-200 rounded-xl p-4 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 bg-gray-50">
                <CardCvcElement 
                  options={elementStyle} 
                  onChange={handleElementChange('cardCvc')}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Pagament segur xifrat</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span>Powered by</span>
              <span className="font-semibold">Stripe</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              {T.cancel}
            </button>
            <button
              type="submit"
              disabled={!stripe || isProcessing || !isFormComplete}
              className="flex-1 py-3 px-4 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
            >
              {isProcessing ? T.processing : T.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Plan Selection Modal
 */
const ChangePlanModal = ({ isOpen, onClose, currentTier, onSelectPlan }) => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedTier || selectedTier === currentTier) return;
    setIsProcessing(true);
    await onSelectPlan(selectedTier);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{T.changePlan}</h3>
        <p className="text-gray-500 mb-6">Selecciona el pla que millor s'adapti a les teves necessitats</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {Object.entries(TIERS).filter(([id]) => id !== 'free').map(([tierId, tier]) => {
            const isSelected = selectedTier === tierId;
            const isCurrent = currentTier === tierId;
            
            return (
              <button
                key={tierId}
                onClick={() => !isCurrent && setSelectedTier(tierId)}
                disabled={isCurrent}
                className={`
                  relative p-5 rounded-2xl text-left transition-all duration-200 border-2
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : isCurrent 
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {T.popular}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-4 bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {T.currentPlan}
                  </span>
                )}
                
                <div className="mb-3">
                  <h4 className="text-lg font-bold text-gray-900">{tier.name}</h4>
                  <p className="text-sm text-gray-500">{tier.description}</p>
                </div>
                
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">€{tier.price.toFixed(2)}</span>
                  <span className="text-gray-500">/{T.perMonth.split(' ')[1]}</span>
                </div>
                
                <ul className="space-y-2">
                  {tier.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            {T.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTier || selectedTier === currentTier || isProcessing}
            className="flex-1 py-3 px-4 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-500/20"
          >
            {isProcessing ? T.processing : (selectedTier && TIERS[selectedTier]?.price > TIERS[currentTier]?.price ? T.upgrade : T.downgrade)}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Plan Detail View Component
 * Shows detailed information about a specific subscription plan
 */
const PlanDetailView = ({ planId, currentTier, onSelectPlan, onBack, onNavigateToPlan }) => {
  const plan = TIERS[planId];
  const isCurrentPlan = planId === currentTier;
  const isUpgrade = TIERS[planId]?.price > TIERS[currentTier]?.price;
  
  if (!plan) return null;

  return (
    <div>
      {/* Plan Header */}
      <div className="mb-8">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              ArquiNorma {plan.name}
            </h1>
            {isCurrentPlan && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                {T.currentPlan}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">{plan.tagline}</p>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">
            €{plan.price.toFixed(2)}
          </span>
          <span className="text-gray-500">/ {T.perMonth}</span>
        </div>
      </div>

      {/* Ideal For Section */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-xl">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{T.idealFor}</h3>
            <p className="text-gray-600">{plan.idealFor}</p>
          </div>
        </div>
      </div>

      {/* Detailed Features */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">{T.featuresIncluded}</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {plan.detailedFeatures.map((feature, index) => (
            <div key={index} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {feature.included ? (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                  {feature.name}
                </span>
              </div>
              <span className={`font-medium ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                {feature.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Compare with other plans */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Compara amb altres plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {PAID_PLANS.map((tier) => {
            const tierPlan = TIERS[tier];
            const isCurrent = tier === currentTier;
            const isSelected = tier === planId;
            
            return (
              <button
                key={tier}
                onClick={() => {
                  if (!isSelected && onNavigateToPlan) {
                    onNavigateToPlan(tier);
                  }
                }}
                disabled={isSelected}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-amber-500 bg-white shadow-md cursor-default' 
                    : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className="mb-2">
                  <span className="font-medium text-gray-900">{tierPlan.name}</span>
                </div>
                <div className="text-lg font-bold text-gray-900">€{tierPlan.price.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{T.perMonth}</div>
                {isCurrent && (
                  <div className="mt-2 text-xs text-green-600 font-medium">Pla actual</div>
                )}
                {isSelected && !isCurrent && (
                  <div className="mt-2 text-xs text-amber-600 font-medium">Visualitzant</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          {T.backToSubscription}
        </button>
        
        {!isCurrentPlan && (
          <button
            onClick={() => onSelectPlan(planId)}
            className="flex-1 px-6 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
          >
            {isUpgrade ? T.upgrade : T.downgrade} a {plan.name}
          </button>
        )}
        
        {isCurrentPlan && (
          <div className="flex-1 px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-xl text-center">
            Aquest és el teu pla actual
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Subscription Page Component
 */
const SubscriptionPage = () => {
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // View state: null = subscription management, 'basic'|'pro'|'studio' = plan detail
  const [selectedPlanView, setSelectedPlanView] = useState(null);
  
  // Modals
  const [showAddCard, setShowAddCard] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuari'
      });

      const backendUrl = env.api?.baseUrl || 'http://localhost:8000';

      // Load subscription status
      const subResponse = await fetch(
        `${backendUrl}/stripe-elements/subscription-status/${session.user.id}`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      // Load payment methods
      const pmResponse = await fetch(
        `${backendUrl}/stripe-elements/payment-methods/${session.user.id}`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );

      if (pmResponse.ok) {
        const pmData = await pmResponse.json();
        setPaymentMethods(pmData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', T.error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(T.confirmCancel)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = env.api?.baseUrl || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/stripe-elements/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          cancel_at_period_end: true
        })
      });

      if (response.ok) {
        showMessage('success', T.subscriptionUpdated);
        await loadData();
      } else {
        throw new Error('Cancel failed');
      }
    } catch (error) {
      showMessage('error', T.error);
    }
  };

  const handleRemovePaymentMethod = async (pmId) => {
    if (!window.confirm(T.confirmRemoveCard)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = env.api?.baseUrl || 'http://localhost:8000';

      const response = await fetch(
        `${backendUrl}/stripe-elements/payment-method/${pmId}?user_id=${user.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );

      if (response.ok) {
        showMessage('success', T.paymentMethodRemoved);
        await loadData();
      }
    } catch (error) {
      showMessage('error', T.error);
    }
  };

  const handleChangePlan = async (newTier) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = env.api?.baseUrl || 'http://localhost:8000';

      // If no active subscription, create new one
      if (!subscription?.has_subscription || subscription?.tier === 'free') {
        // Need to add card first if no payment methods
        if (paymentMethods.length === 0) {
          setShowAddCard(true);
          return;
        }

        const response = await fetch(`${backendUrl}/stripe-elements/create-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: user.id,
            user_email: user.email,
            tier: newTier,
            payment_method_id: paymentMethods.find(pm => pm.is_default)?.id || paymentMethods[0]?.id
          })
        });

        if (response.ok) {
          showMessage('success', T.subscriptionUpdated);
          await loadData();
        } else {
          throw new Error('Create failed');
        }
      } else {
        // Update existing subscription
        const response = await fetch(`${backendUrl}/stripe-elements/update-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: user.id,
            new_tier: newTier
          })
        });

        if (response.ok) {
          showMessage('success', T.subscriptionUpdated);
          await loadData();
        } else {
          throw new Error('Update failed');
        }
      }
    } catch (error) {
      showMessage('error', T.error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getCardBrandIcon = (brand) => {
    const brands = {
      visa: (
        <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">VISA</span>
        </div>
      ),
      mastercard: (
        <div className="w-10 h-7 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">MC</span>
        </div>
      ),
      amex: (
        <div className="w-10 h-7 bg-blue-400 rounded flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">AMEX</span>
        </div>
      )
    };
    return brands[brand?.toLowerCase()] || brands.visa;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{T.loading}</span>
        </div>
      </div>
    );
  }

  const currentTier = TIERS[subscription?.tier] || TIERS.free;

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar - Dark */}
      <div className="w-80 bg-slate-900 text-white p-8 flex flex-col min-h-screen">
        {/* Logo */}
        {/* Logo - Click to go back */}
        <button
          onClick={() => navigate('/projects')}
          className="mb-8 group cursor-pointer text-left"
          title="Tornar a ArquiNorma"
        >
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">ArquiNorma</h1>
        </button>

        {/* My Subscription Link */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedPlanView(null)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
              selectedPlanView === null 
                ? 'bg-white/10 text-white' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{T.mySubscription}</span>
          </button>
        </div>

        {/* Plans List */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-3 px-3">
            {T.ourPlans}
          </h2>
          <div className="space-y-1">
            {PAID_PLANS.map((planId) => {
              const plan = TIERS[planId];
              return (
                <button
                  key={planId}
                  onClick={() => setSelectedPlanView(planId)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between group ${
                    selectedPlanView === planId 
                      ? 'bg-white/10 text-white' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-sm font-medium">{plan.name}</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-400">
                    €{plan.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Help Section */}
        <div className="flex-1">
          <p className="text-slate-400 text-sm mb-2">{T.needHelp}</p>
          <p className="text-slate-300 text-sm">{T.contactSupport}</p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>Powered by</span>
            <span className="font-semibold text-slate-400">stripe</span>
          </div>
        </div>
      </div>

      {/* Main Content - Light */}
      <div className="flex-1 bg-gray-50 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-3xl">
          {/* Success/Error Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Conditional Content: Plan Detail View or Subscription Management */}
          {selectedPlanView ? (
            // Plan Detail View
            <PlanDetailView 
              planId={selectedPlanView}
              currentTier={subscription?.tier || 'free'}
              onSelectPlan={(tier) => {
                handleChangePlan(tier);
                setSelectedPlanView(null);
              }}
              onBack={() => setSelectedPlanView(null)}
              onNavigateToPlan={(tier) => setSelectedPlanView(tier)}
            />
          ) : (
            // Subscription Management View
            <>
              {/* Current Subscription Section */}
              <section className="mb-10">
                <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6">
                  {T.currentSubscription}
                </h2>
                
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        ArquiNorma {currentTier.name}
                      </h3>
                      <p className="text-2xl font-bold text-gray-900 mb-3">
                        €{currentTier.price.toFixed(2)} <span className="text-base font-normal text-gray-500">{T.perMonth}</span>
                      </p>
                      
                      {/* View Details Toggle */}
                      <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
                      >
                        {T.viewDetails}
                        <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showDetails && (
                        <ul className="space-y-2 mb-4">
                          {currentTier.features.map((f, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      {subscription?.current_period_end && (
                        <p className="text-sm text-gray-500">
                          {subscription?.cancel_at_period_end 
                            ? `${T.cancelsOn} ${formatDate(subscription.current_period_end)}`
                            : `${T.nextBilling} ${formatDate(subscription.current_period_end)}`
                          }
                        </p>
                      )}

                      {/* Payment Method Badge */}
                      {subscription?.payment_method && (
                        <div className="flex items-center gap-2 mt-4">
                          {getCardBrandIcon(subscription.payment_method.brand)}
                          <span className="text-gray-600">
                            {subscription.payment_method.brand?.charAt(0).toUpperCase() + subscription.payment_method.brand?.slice(1)} •••• {subscription.payment_method.last4}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {subscription?.has_subscription && subscription?.tier !== 'free' && (
                        <>
                          <button
                            onClick={() => setShowChangePlan(true)}
                            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
                          >
                            {T.changePlan}
                          </button>
                          {!subscription?.cancel_at_period_end ? (
                            <button
                              onClick={handleCancelSubscription}
                              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {T.cancelSubscription}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangePlan(subscription.tier)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {T.reactivate}
                            </button>
                          )}
                        </>
                      )}
                      {(!subscription?.has_subscription || subscription?.tier === 'free') && (
                        <button
                          onClick={() => setShowChangePlan(true)}
                          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
                        >
                          {T.upgrade}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Methods Section */}
              <section className="mb-10">
                <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6">
                  {T.paymentMethods}
                </h2>
                
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getCardBrandIcon(pm.brand)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                              {pm.brand?.charAt(0).toUpperCase() + pm.brand?.slice(1)} •••• {pm.last4}
                            </span>
                            {pm.is_default && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {T.default}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {T.expires} {pm.exp_month}/{pm.exp_year}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!pm.is_default && paymentMethods.length > 1 && (
                          <button
                            onClick={() => handleRemovePaymentMethod(pm.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={T.remove}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Payment Method Button */}
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="w-full p-5 text-left text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    {T.addPaymentMethod}
                  </button>
                </div>
              </section>

              {/* Billing Information Section */}
              <section>
                <h2 className="text-xs font-semibold text-slate-500 tracking-wider mb-6">
                  {T.billingInfo}
                </h2>
                
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{T.name}</span>
                    <span className="text-gray-900 font-medium">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{T.email}</span>
                    <span className="text-gray-900">{user?.email}</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Elements stripe={stripePromise}>
        <AddPaymentMethodModal
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onSuccess={() => {
            showMessage('success', T.paymentMethodAdded);
            loadData();
          }}
          userId={user?.id}
          userEmail={user?.email}
        />
      </Elements>

      <ChangePlanModal
        isOpen={showChangePlan}
        onClose={() => setShowChangePlan(false)}
        currentTier={subscription?.tier || 'free'}
        onSelectPlan={handleChangePlan}
      />
    </div>
  );
};

export default SubscriptionPage;
