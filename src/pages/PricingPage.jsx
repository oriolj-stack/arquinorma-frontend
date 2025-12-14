import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import { submitBetaTesterEmail, validateEmail } from '../services/betaTestersService';

/**
 * PricingPage Component for ArquiNorma
 * 
 * Comprehensive pricing page inspired by Factorial, ElevenLabs, and best practices.
 * Features:
 * - Clear pricing tiers with detailed features
 * - Comparison table
 * - FAQ section
 * - Trust elements
 * - Social proof
 * - Mobile responsive
 */

// Pricing tiers configuration - matching LandingPage data
const PRICING_TIERS = [
  {
    id: 'basic',
    name: 'Bàsic',
    price: 5.99,
    description: 'Per a projectes individuals',
    features: [
      { name: 'Projectes actius', value: '5', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Documents personalitzats', value: null, included: false },
      { name: 'Accés a tota la normativa', value: true, included: true },
      { name: 'Suport per correu', value: true, included: true },
      { name: 'Assistent de Concursos', value: false, included: false },
      { name: 'Comparació de documents', value: false, included: false },
      { name: 'Area privada d\'estudi', value: null, included: false },
    ],
    cta: 'Començar amb Bàsic',
    popular: false
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 14.99,
    description: 'Per a professionals exigents',
    popular: true,
    features: [
      { name: 'Projectes actius', value: '15', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Documents personalitzats', value: '20/mes', included: true },
      { name: 'Accés a tota la normativa', value: true, included: true },
      { name: 'Suport prioritari', value: true, included: true },
      { name: 'Assistent per a concursos', value: true, included: true },
      { name: 'Comparació de documents', value: true, included: true },
      { name: 'Area privada d\'estudi', value: null, included: false },
    ],
    cta: 'Començar amb Pro'
  },
  {
    id: 'studio',
    name: 'Estudi',
    price: 49.00,
    description: 'Per a equips i estudis',
    features: [
      { name: 'Projectes actius', value: 'Il·limitats', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Documents personalitzats', value: 'Il·limitats', included: true },
      { name: 'Accés a tota la normativa', value: true, included: true },
      { name: 'Suport dedicat', value: true, included: true },
      { name: 'Gestió de concursos', value: true, included: true },
      { name: 'Comparació de documents', value: true, included: true },
      { name: 'Area privada d\'estudi', value: true, included: true },
      { name: 'Membres d\'equip', value: '10 inclosos', included: true },
    ],
    cta: 'Contactar vendes',
    popular: false
  }
];

// FAQ items for pricing page
const PRICING_FAQ = [
  {
    question: 'Puc canviar de pla en qualsevol moment?',
    answer: 'Sí, pots actualitzar o reduir el teu pla en qualsevol moment. Els canvis s\'aplicaran al següent cicle de facturació.'
  },
  {
    question: 'Què passa si cancel·lo la meva subscripció?',
    answer: 'Pots cancel·lar la teva subscripció en qualsevol moment sense penalització. Continuaràs tenint accés fins al final del període de facturació actual.'
  },
  {
    question: 'Hi ha un període de prova gratuïta?',
    answer: 'Sí! Tots els nous usuaris reben 1 mes de prova gratuïta. No cal targeta de crèdit per començar.'
  },
  {
    question: 'Com es processen els pagaments?',
    answer: 'Tots els pagaments es processen de forma segura a través de Stripe. Les teves dades de pagament estan xifrades i mai es guarden als nostres servidors.'
  },
  {
    question: 'Ofereix descomptes per a estudis grans?',
    answer: 'Sí, per a equips de més de 10 membres, contacta\'ns per obtenir un pla personalitzat amb descomptes especials.'
  },
  {
    question: 'Puc provar un pla abans de comprometre\'m?',
    answer: 'Absolutament! Tots els plans inclouen 1 mes de prova gratuïta. Pots provar qualsevol pla sense compromís.'
  }
];

const PricingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Beta tester form state
  const [betaEmail, setBetaEmail] = useState('');
  const [betaEmailError, setBetaEmailError] = useState('');
  const [betaStatus, setBetaStatus] = useState({ type: '', message: '' });
  const [isSubmittingBeta, setIsSubmittingBeta] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle subscription selection and create Stripe checkout session
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

      // Determine backend URL
      const backendUrl = env.api.baseUrl || (import.meta.env.DEV ? '' : 'https://your-backend-url.com');
      const apiUrl = backendUrl ? `${backendUrl}/stripe/create-checkout-session` : '/stripe/create-checkout-session';

      // Call backend to create checkout session
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          subscription_level: tierId,
          user_id: session.user.id,
          user_email: session.user.email,
          success_url: `${window.location.origin}/account?tab=subscription&success=true`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.detail || responseData.message || 'Error en crear la sessió de pagament';
        throw new Error(errorMessage);
      }

      if (!responseData.url) {
        throw new Error('No s\'ha rebut l\'URL de pagament del servidor');
      }

      // Redirect to Stripe Checkout
      window.location.href = responseData.url;

    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Hi ha hagut un error. Torna-ho a provar.');
      setLoading(false);
    }
  };

  // Handle contact sales for Studio plan
  const handleContactSales = () => {
    window.location.href = 'mailto:arquinorma.cat@gmail.com?subject=Consulta sobre pla Estudi';
  };

  // Handle beta tester email submission
  const handleBetaSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingBeta(true);
    setBetaEmailError('');
    setBetaStatus({ type: '', message: '' });

    // Validate email
    if (!betaEmail.trim()) {
      setBetaEmailError('El correu electrònic és obligatori');
      setIsSubmittingBeta(false);
      return;
    }

    if (!validateEmail(betaEmail.trim())) {
      setBetaEmailError('Introdueix un correu electrònic vàlid');
      setIsSubmittingBeta(false);
      return;
    }

    try {
      // Submit to beta_testers table
      const result = await submitBetaTesterEmail(betaEmail.trim());

      if (result.success) {
        setBetaStatus({
          type: 'success',
          message: result.message
        });
        setBetaEmail('');
      } else {
        setBetaStatus({
          type: 'error',
          message: result.message || 'Hi ha hagut un error. Torna-ho a provar.'
        });
      }
    } catch (err) {
      console.error('Error submitting beta tester:', err);
      setBetaStatus({
        type: 'error',
        message: 'Hi ha hagut un error inesperat. Torna-ho a provar.'
      });
    } finally {
      setIsSubmittingBeta(false);
    }
  };

  // Scroll to section
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-50/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/"
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                ArquiNorma
              </span>
            </Link>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <Link 
                to="/#features" 
                className="text-sm font-medium transition-colors text-gray-700 hover:text-gray-900"
              >
                Funcionalitats
              </Link>
              <Link 
                to="/#how-it-works" 
                className="text-sm font-medium transition-colors text-gray-700 hover:text-gray-900"
              >
                Com funciona
              </Link>
              <Link 
                to="/#faq" 
                className="text-sm font-medium transition-colors text-gray-700 hover:text-gray-900"
              >
                FAQ
              </Link>
              <Link 
                to="/pricing" 
                className="text-sm font-medium transition-colors text-gray-900 font-semibold"
              >
                Preus
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className="hidden sm:block text-sm font-medium transition-colors text-gray-700 hover:text-gray-900"
              >
                Iniciar sessió
              </Link>
              <Link
                to="/#waitlist"
                className="px-4 py-2 bg-amber-400 text-gray-900 text-sm font-semibold rounded-lg hover:bg-amber-500 transition-colors shadow-md shadow-amber-400/20"
              >
                Sol·licita Accés
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Plans simples, sense sorpreses
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-title text-gray-900 mb-6">
              Tria el pla perfecte per al teu estudi
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Tots els plans inclouen accés complet a la normativa de 947 municipis i preguntes il·limitades a l'IA.
            </p>

            {/* Annual/Monthly Toggle - Placeholder for future */}
            {/* <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Mensual
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? 'bg-amber-400' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Anual <span className="text-amber-600">(Estalvia 20%)</span>
              </span>
            </div> */}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl p-8 ${
                  tier.popular
                    ? 'border-2 border-amber-400 shadow-xl shadow-amber-100/50 scale-105'
                    : 'border border-gray-200 shadow-lg'
                } transition-all hover:shadow-2xl`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-amber-400 text-gray-900 text-sm font-semibold rounded-full shadow-lg">
                      Més popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold font-title text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{tier.description}</p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">€{tier.price.toFixed(2)}</span>
                      <span className="text-gray-500 text-lg">/mes</span>
                    </div>
                    {tier.id === 'studio' && (
                      <p className="text-sm text-gray-500 mt-2">Preu personalitzat per equips grans</p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`flex-1 ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        <span className="font-medium">{feature.name}</span>
                        {typeof feature.value === 'string' && feature.included && (
                          <span className="text-gray-900 font-semibold"> — {feature.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beta Section */}
      <section className="py-12 lg:py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Versió Beta
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
                ArquiNorma està en fase Beta
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Estem millorant l'assistent amb el feedback de professionals com tu.
              </p>
              <p className="text-base text-gray-500">
                Uneix-te als professionals de l'equip Beta testers.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Vols ser beta tester?
                </h3>
                <p className="text-gray-600">
                  Accedeix abans que ningú i ajuda'ns a millorar amb el teu feedback.
                </p>
              </div>
              
              <form onSubmit={handleBetaSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={betaEmail}
                    onChange={(e) => {
                      setBetaEmail(e.target.value);
                      setBetaEmailError('');
                      if (betaStatus.message) {
                        setBetaStatus({ type: '', message: '' });
                      }
                    }}
                    placeholder="Introdueix el teu correu electrònic"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      betaEmailError 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } focus:outline-none focus:ring-2 transition-colors`}
                    disabled={isSubmittingBeta}
                  />
                  {betaEmailError && (
                    <p className="mt-1 text-sm text-red-600">{betaEmailError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingBeta}
                  className="px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingBeta ? 'Enviant...' : 'Envia'}
                </button>
              </form>
              
              {betaStatus.message && (
                <div className={`mt-4 p-3 rounded-lg ${
                  betaStatus.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <p className="text-sm">{betaStatus.message}</p>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">20</div>
                <div className="text-sm text-gray-600">Places disponibles</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">100%</div>
                <div className="text-sm text-gray-600">Gratuït durant la beta</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">Prioritari</div>
                <div className="text-sm text-gray-600">Accés anticipat</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
              Comparació detallada
            </h2>
            <p className="text-lg text-gray-600">
              Tots els detalls per triar el pla que millor s'adapta a les teves necessitats
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">
                      Característica
                    </th>
                    {PRICING_TIERS.map((tier) => (
                      <th
                        key={tier.id}
                        className={`py-4 px-6 text-center text-sm font-semibold ${
                          tier.popular ? 'bg-amber-50 text-amber-900' : 'text-gray-900'
                        }`}
                      >
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PRICING_TIERS[0].features.map((_, featureIndex) => (
                    <tr key={featureIndex} className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {PRICING_TIERS[0].features[featureIndex].name}
                      </td>
                      {PRICING_TIERS.map((tier) => {
                        const feature = tier.features[featureIndex];
                        if (!feature) return <td key={tier.id} className="py-4 px-6 text-center">—</td>;
                        return (
                          <td
                            key={tier.id}
                            className={`py-4 px-6 text-center text-sm ${
                              tier.popular ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            {feature.included ? (
                              typeof feature.value === 'string' ? (
                                <span className="font-semibold text-gray-900">{feature.value}</span>
                              ) : (
                                <svg
                                  className="w-6 h-6 text-green-500 mx-auto"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )
                            ) : (
                              <svg
                                className="w-6 h-6 text-gray-300 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Studio extra feature */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">Membres d'equip</td>
                    <td className="py-4 px-6 text-center text-sm text-gray-400">1</td>
                    <td className="py-4 px-6 text-center text-sm bg-amber-50/50 text-gray-400">1</td>
                    <td className="py-4 px-6 text-center text-sm font-semibold text-gray-900">10 inclosos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagament segur</h3>
              <p className="text-gray-600">
                Tots els pagaments es processen de forma segura a través de Stripe. Les teves dades estan protegides.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel·la quan vulguis</h3>
              <p className="text-gray-600">
                Sense compromisos a llarg termini. Pots cancel·lar la teva subscripció en qualsevol moment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Suport dedicat</h3>
              <p className="text-gray-600">
                Estem aquí per ajudar-te. Contacta amb nosaltres sempre que necessitis assistència.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="pricing-faq" className="py-12 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
              Preguntes freqüents sobre preus
            </h2>
            <p className="text-lg text-gray-600">
              Respostes a les preguntes més comunes sobre els nostres plans
            </p>
          </div>

          <div className="space-y-4">
            {PRICING_FAQ.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-amber-300 hover:shadow-md"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-amber-600 flex-shrink-0 transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 lg:py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
            Preparat per començar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Prova ArquiNorma gratuïtament durant 1 mes. Sense targeta de crèdit.
          </p>
          <div className="flex justify-center">
            <Link
              to="/#waitlist"
              className="px-8 py-4 bg-amber-400 text-gray-900 text-lg font-semibold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 text-center"
            >
              Començar prova gratuïta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
