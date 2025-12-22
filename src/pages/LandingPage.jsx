import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { submitWaitingListEntry, validateWaitingListForm } from '../services/waitingListService';

/**
 * ArquiNorma Landing Page
 * 
 * High-converting, frictionless landing page targeting young architects.
 * Features:
 * - Hero section with strong value proposition
 * - Features/benefits showcase
 * - How it works explanation
 * - Pricing comparison
 * - Trust elements and testimonials
 * - Minimal-friction waiting list form
 * - Consistent with app branding (amber/yellow theme)
 */

// Pricing tiers for comparison
const PRICING_TIERS = [
  {
    id: 'basic',
    name: 'Bàsic',
    price: 5.99,
    description: 'Per a projectes individuals',
    features: [
      { name: 'Projectes actius', value: '5', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Documents personalitzats', value: '20/mes', included: true },
      { name: 'Accés a tota la normativa', value: true, included: true },
      { name: 'Suport per correu', value: true, included: true },
      { name: 'Pujades de PDF', value: false, included: false },
      { name: 'Comparació de documents', value: false, included: false },
      { name: 'Accés API', value: false, included: false },
    ],
    cta: 'Començar amb Bàsic'
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 14.99,
    description: 'Per a professionals exigents',
    popular: true,
    features: [
      { name: 'Projectes actius', value: '25', included: true },
      { name: 'Preguntes a l\'IA', value: 'Il·limitades', included: true },
      { name: 'Documents personalitzats', value: '100/mes', included: true },
      { name: 'Accés a tota la normativa', value: true, included: true },
      { name: 'Suport prioritari', value: true, included: true },
      { name: 'Pujades de PDF', value: 'Il·limitades', included: true },
      { name: 'Comparació de documents', value: true, included: true },
      { name: 'Accés API', value: false, included: false },
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
      { name: 'Pujades de PDF', value: 'Il·limitades', included: true },
      { name: 'Comparació de documents', value: true, included: true },
      { name: 'Accés API', value: true, included: true },
      { name: 'Membres d\'equip', value: '10 inclosos', included: true },
    ],
    cta: 'Contactar vendes'
  }
];

// Testimonials data
const TESTIMONIALS = [
  {
    quote: "ArquiNorma m'ha estalviat hores de recerca en normativa. Ara trobo respostes en segons.",
    author: "Maria García",
    role: "Arquitecta, Barcelona",
    avatar: "MG"
  },
  {
    quote: "L'IA entén perfectament les preguntes tècniques. És com tenir un expert en normativa sempre disponible.",
    author: "Jordi Puig",
    role: "Arquitecte Tècnic, Girona",
    avatar: "JP"
  },
  {
    quote: "El millor és poder consultar la normativa específica de cada municipi. Imprescindible.",
    author: "Anna Martí",
    role: "Cap de Projectes, Tarragona",
    avatar: "AM"
  }
];

// Features data
const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: 'IA especialitzada en normativa',
    description: 'Fes preguntes en llenguatge natural i rep respostes precises basades en la normativa vigent.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Tota la normativa urbanística',
    description: 'Accedeix a les ordenances i normatives de tots els municipis de Catalunya en un sol lloc.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Respostes instantànies',
    description: 'Oblida\'t de buscar entre centenars de pàgines. Troba el que necessites en segons.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Xat CTE dedicat',
    description: 'Accedeix a un xat especialitzat per consultes sobre el Codi Tècnic de l\'Edificació (CTE) i normativa de construcció.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Gestió de projectes',
    description: 'Organitza els teus projectes per municipi i consulta la normativa específica de cada un.'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Sempre actualitzat',
    description: 'La normativa s\'actualitza automàticament quan hi ha canvis oficials.'
  }
];

// How it works steps
const STEPS = [
  {
    number: '01',
    title: 'Formula la consulta',
    description: 'Preguntes en llenguatge natural sobre CTE, urbanisme, compatibilitat d\'usos, etc.'
  },
  {
    number: '02',
    title: 'L\'assistent analitza tota la base documental',
    description: 'Revisa municipis, CTE, decrets, planejament, PDFs, fitxes i normatives.'
  },
  {
    number: '03',
    title: 'Rep una resposta clara i fiable',
    description: 'Justificació, article, taules i referències amb enllaç directe'
  }
];

// FAQ data - adapted from Factorial's FAQ structure
const FAQ_ITEMS = [
  {
    question: 'Què és ArquiNorma?',
    answer: 'ArquiNorma és el primer assistent normatiu d\'IA dissenyat específicament per a arquitectes. Et permet consultar normativa urbanística, CTE i documentació de projectes de forma immediata i contextual, estalviant hores de recerca manual.'
  },
  {
    question: 'Com funciona ArquiNorma?',
    answer: 'Només has de fer una pregunta en llenguatge natural sobre qualsevol aspecte normatiu. L\'assistent analitza automàticament tota la base documental (municipis, CTE, decrets, planejament, PDFs) i et proporciona una resposta clara, fiable i enllaçada amb referències directes als documents oficials.'
  },
  {
    question: 'Quina normativa cobreix ArquiNorma?',
    answer: 'ArquiNorma cobreix la normativa de 947 municipis de Catalunya, incloent ordenances urbanístiques, el Codi Tècnic de l\'Edificació (CTE), decrets, planejament urbanístic. En total més de 35.000 documents normatius actualitzats regularment.'
  },
  {
    question: 'És fiable la informació que proporciona?',
    answer: 'Sí. ArquiNorma només utilitza informació extreta textualment dels documents oficials publicats. Totes les respostes inclouen referències directes als articles, taules i pàgines específiques dels documents consultats, permetent-te verificar cada resposta.'
  },
  {
    question: 'Quants projectes puc gestionar?',
    answer: 'Depèn del teu pla. El pla Bàsic inclou 5 projectes actius, el Professional 25 projectes, i el pla Estudi projectes il·limitats. Tots els plans inclouen preguntes il·limitades a l\'IA.'
  },
  {
    question: 'Puc pujar els meus propis documents PDF?',
    answer: 'Sí, els plans Professional i Estudi inclouen pujades de PDF il·limitades. Això et permet consultar normativa personalitzada o documents específics del teu projecte juntament amb la base de dades general.'
  },
  {
    question: 'Com s\'actualitza la normativa?',
    answer: 'Actualitzem automàticament la base de dades quan hi ha canvis oficials en la normativa. Revisem setmanalment les actualitzacions dels municipis i organismes oficials per assegurar que sempre tens accés a la informació més recent.'
  },
  {
    question: 'Hi ha un període de prova gratuïta?',
    answer: 'Sí! Tots els nous usuaris reben 1 mes de prova gratuïta al registrar-se a la llista d\'espera. No cal targeta de crèdit i pots cancel·lar quan vulguis sense cap compromís.'
  },
  {
    question: 'Puc cancel·lar la meva subscripció en qualsevol moment?',
    answer: 'Absolutament. Pots cancel·lar la teva subscripció en qualsevol moment sense cap penalització. No hi ha compromisos a llarg termini ni costos ocults.'
  },
  {
    question: 'Les meves dades estan segures?',
    answer: 'Sí, la seguretat de les teves dades és una prioritat. Complim amb el GDPR i utilitzem xifratge de dades. Mai compartim la teva informació amb tercers i pots sol·licitar l\'eliminació de les teves dades en qualsevol moment.'
  },
  {
    question: 'Funciona en dispositius mòbils?',
    answer: 'Sí, ArquiNorma està optimitzat per funcionar perfectament en ordinadors, tauletes i mòbils. Pots accedir a la teva informació normativa des de qualsevol dispositiu, en qualsevol moment.'
  }
];

// Feature flags for pre-launch
const SHOW_PRICING = false; // Set to true when ready to show pricing
const SHOW_TESTIMONIALS = false; // Set to true when ready to show testimonials
const SHOW_FINAL_CTA = false; // Set to true when ready to show final CTA banner
const SHOW_PARTNER_LOGOS = true; // Set to true when partners are confirmed

// Partner logos - loaded from public/logos folder
// To add logos: copy files from data/Logos to frontend/public/logos/
// Then add an object with filename and company name to this array
const PARTNER_LOGOS = [
  { filename: 'KM13 Arquitectura i Paisatge.jpg', name: 'KM13 Arquitectura i Paisatge' },
  { filename: 'Arquimedia.png', name: 'Arquimedia' },
  // Add more logos: { filename: 'logo.jpg', name: 'Company Name' }
];

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Waiting list form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Scroll state for navbar
  const [scrolled, setScrolled] = useState(false);
  
  // Waiting list count state
  const [waitingListCount, setWaitingListCount] = useState(null);
  
  // Random initials for social proof
  const [randomInitials, setRandomInitials] = useState(['MG', 'JP', 'AM', 'RS']);
  
  // FAQ accordion state
  const [openFAQ, setOpenFAQ] = useState(null);

  // Generate random initials (2 letters) using common Catalan letters
  const generateRandomInitials = () => {
    // Common letters in Catalan names and surnames
    // Vowels: A, E, I, O, U (very common)
    // Common consonants: B, C, D, F, G, J, L, M, N, P, R, S, T, V
    // Less common but still used: H
    // Avoid: K, Q, W, X, Y, Z (rare in Catalan names)
    const commonVowels = 'AEIOU';
    const commonConsonants = 'BCDFGJLMNPRSTV';
    const lessCommon = 'H';
    
    // Create weighted pool: vowels appear more, then common consonants, then less common
    const letterPool = commonVowels + commonVowels + commonConsonants + lessCommon;
    
    const generateInitial = () => {
      const first = letterPool[Math.floor(Math.random() * letterPool.length)];
      const second = letterPool[Math.floor(Math.random() * letterPool.length)];
      return first + second;
    };
    
    // Generate 4 unique initials
    const initials = [];
    while (initials.length < 4) {
      const initial = generateInitial();
      if (!initials.includes(initial)) {
        initials.push(initial);
      }
    }
    return initials;
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch waiting list count
  const fetchWaitingListCount = async () => {
    try {
      // Count all entries in waiting_list table
      const { count, error } = await supabase
        .from('waiting_list')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching waiting list count:', error);
        // Fallback to showing +10 if there's an error
        setWaitingListCount(10);
        return;
      }

      // Round up to nearest 10
      // 1-9 -> +10, 10-19 -> +20, 20-29 -> +30, etc.
      const roundedCount = count > 0 ? Math.ceil(count / 10) * 10 : 10;
      setWaitingListCount(roundedCount);
    } catch (err) {
      console.error('Error in fetchWaitingListCount:', err);
      // Fallback to showing +10 if there's an error
      setWaitingListCount(10);
    }
  };

  useEffect(() => {
    fetchWaitingListCount();
    // Generate random initials on page load
    setRandomInitials(generateRandomInitials());
  }, []);

  // Handle waiting list form submission
  const handleWaitingListSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: '', message: '' });
    setFormErrors({});

    // Client-side validation
    const validation = validateWaitingListForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit using the waiting list service
      const result = await submitWaitingListEntry(formData, {
        source: 'landing_page'
      });

      if (result.success) {
        setFormStatus({ type: 'success', message: result.message });
        if (!result.alreadyExists) {
          setFormData({ full_name: '', email: '', company: '' });
          // Refresh the count after successful submission
          fetchWaitingListCount();
          // Generate new random initials
          setRandomInitials(generateRandomInitials());
        }
      } else {
        setFormStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('Error submitting waiting list:', error);
      setFormStatus({ type: 'error', message: 'Hi ha hagut un error. Torna-ho a provar.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form field change with error clearing
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (formStatus.message) {
      setFormStatus({ type: '', message: '' });
    }
  };

  // Scroll to section
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-gray-900'}`}>
                ArquiNorma
              </span>
            </button>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('features')} 
                className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Funcionalitats
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')} 
                className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Com funciona
              </button>
              <button 
                onClick={() => scrollToSection('faq')} 
                className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                FAQ
              </button>
              <Link 
                to="/pricing" 
                className={`text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Preus
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link 
                to="/login" 
                className={`hidden sm:block text-sm font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-700 hover:text-gray-900'}`}
              >
                Iniciar sessió
              </Link>
              <button
                onClick={() => scrollToSection('waitlist')}
                className="px-4 py-2 bg-amber-400 text-gray-900 text-sm font-semibold rounded-lg hover:bg-amber-500 transition-colors shadow-md shadow-amber-400/20"
              >
                Sol·licita Accés
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-gray-50 pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-amber-200/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-100/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Nova plataforma per arquitectes
              </div>
              
              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-title text-gray-900 leading-tight mb-6">
                Estalvia temps buscant normativa. Tota la informació en segons.
              </h1>
              
              {/* Subheadline */}
              <div className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 space-y-2">
                <p>
                  Accedeix a +35k Documents normatius de 947 municipis amb només una pregunta.
                </p>
                <p className="font-semibold text-gray-900">
                  Prova el primer assistent normatiu per a arquitectes.
                </p>
              </div>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => scrollToSection('waitlist')}
                  className="px-8 py-4 bg-amber-400 text-gray-900 text-lg font-semibold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-400/40 hover:-translate-y-0.5"
                >
                  Prova-ho ara
                </button>
              </div>
              
              {/* Social Proof Mini */}
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  {randomInitials.map((initials, i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {waitingListCount !== null ? `+${waitingListCount}` : '+10'}
                  </span> arquitectes esperen a provar-ho
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative w-full" style={{ maxWidth: '115%' }}>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-lg px-4 py-1.5 text-sm text-gray-400 border border-gray-200">
                      app.arquinorma.cat
                    </div>
                  </div>
                </div>
                
                {/* App Mockup */}
                <div className="p-4 bg-gray-50">
                  {/* Chat Interface Mockup */}
                  <div className="space-y-3">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="bg-amber-400 text-gray-900 rounded-2xl rounded-tr-md px-3 py-2 max-w-xs">
                        <p className="text-sm">Quines limitacions volumètriques te la construcció d'un edifici d'habitatges a l'eixample?</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-3 py-2 max-w-lg shadow-sm">
                        <div className="space-y-2 text-sm text-gray-700">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">📄 Resum de la normativa aplicable</h4>
                            <p className="text-gray-600">
                              Les limitacions volumètriques estan regulades pel Pla General Metropolità. Els plans especials i estudis de detall no poden augmentar la superficie edificable.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1.5">📖 Articles rellevants</h4>
                            <div className="space-y-1.5">
                              <div>
                                <p className="font-medium text-gray-900">Article 193 - Limitacions</p>
                                <p className="text-gray-600 italic">
                                  "Els plans especials i estudis de detall no poden augmentar la superfície edificable, alterar el tipus de zonificació ni augmentar el nombre d'habitatges fixat en la planificació prèvia."
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Article 191 - Contingut de la normativa</p>
                                <p className="text-gray-600 mb-1">Estableix els paràmetres volumètrics per a les diferents zones, específicament per a les "Zones d'eixample intensiu":</p>
                                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                                  <li>Edificabilitat neta: 1,50 m2 planta/m2 sòl</li>
                                  <li>Densitat màxima: 150 habitatges/ha</li>
                                  <li>Ocupació màxima: 60%</li>
                                  <li>Alçada màxima: 27,45 m</li>
                                  <li>Nombre màxim de plantes: Planta Baixa + 7 plantes</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Article 192 - Tipus d'ordenació</p>
                                <p className="text-gray-600 italic">
                                  "Els plans especials i estudis de detall poden autoritzar l'aplicació de qualsevol altre tipus d'ordenació previst al Pla General."
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">🔗 Enllaços directes als documents</h4>
                            <div className="flex items-center gap-2 text-xs text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                              <span>Ordenances Edificació - Pàgina 57</span>
                      </div>
                    </div>
                    
                          <div className="pt-2 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-900 mb-1">📝 Nota</h4>
                            <p className="text-xs text-gray-500 italic">
                              L'assistent només utilitza informació extreta textualment dels documents oficials.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">947 municipis</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Respostes en &lt;3s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
              Tot el que necessites per treballar més ràpid
            </h2>
            <p className="text-lg text-gray-600">
              Deixa de perdre hores buscant en documents. ArquiNorma t'ajuda a trobar 
              la informació que necessites en segons.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-400 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold font-title text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos / Trust Bar */}
      {SHOW_PARTNER_LOGOS && PARTNER_LOGOS.length > 0 && (
        <section className="py-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 mb-8">
              Dissenyat per arquitectes, per a arquitectes de Catalunya
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              {PARTNER_LOGOS.map((logo, index) => (
                <div 
                  key={index}
                  className="relative flex flex-col items-center justify-center group"
                >
                  <div className="h-24 max-w-[280px] flex items-center justify-center">
                    <img 
                      src={`/logos/${logo.filename}`}
                      alt={logo.name || `Partner logo ${index + 1}`}
                      className="h-full w-auto object-contain transition-all duration-300"
                      style={{ 
                        filter: 'grayscale(100%) brightness(0.6) contrast(1.1)',
                        opacity: 0.7
                      }}
                      onError={(e) => {
                        // Hide broken images
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  {/* Company name below logo */}
                  {logo.name && (
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <p className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        {logo.name}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
              Cansat de buscar normativa?
            </h2>
            <p className="text-lg text-gray-600">
              Troba informació fiable i contrastada, de forma ràpida i efectiva.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-amber-300 to-transparent" />
                )}
                
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 text-gray-900 rounded-2xl text-2xl font-bold mb-4 shadow-lg shadow-amber-400/30">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold font-title text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {SHOW_TESTIMONIALS && (
        <section className="py-20 lg:py-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
                El que diuen els nostres usuaris
              </h2>
              <p className="text-lg text-gray-600">
                Arquitectes de tot Catalunya ja confien en ArquiNorma
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <div 
                  key={index}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Quote Icon */}
                  <svg className="w-10 h-10 text-amber-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  
                  <p className="text-gray-700 mb-6">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      {SHOW_PRICING && (
        <section id="pricing" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
              Plans simples, sense sorpreses
            </h2>
            <p className="text-lg text-gray-600">
              Tria el pla que s'adapti a les teves necessitats. Canvia o cancel·la quan vulguis.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`relative bg-white rounded-2xl p-6 ${
                  tier.popular 
                    ? 'border-2 border-amber-400 shadow-xl shadow-amber-100/50' 
                    : 'border border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-amber-400 text-gray-900 text-sm font-semibold rounded-full">
                      Més popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold font-title text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">€{tier.price.toFixed(2)}</span>
                    <span className="text-gray-500">/mes</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {feature.included ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                        {typeof feature.value === 'string' && feature.included && (
                          <span className="font-medium text-gray-900"> — {feature.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => scrollToSection('waitlist')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    tier.popular
                      ? 'bg-amber-400 text-gray-900 hover:bg-amber-500 shadow-md shadow-amber-400/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-16 max-w-5xl mx-auto">
            <h3 className="text-xl font-bold font-title text-gray-900 text-center mb-8">
              Comparació detallada
            </h3>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 bg-gray-50">
                        Característica
                      </th>
                      {PRICING_TIERS.map((tier) => (
                        <th key={tier.id} className={`py-4 px-6 text-center text-sm font-semibold ${tier.popular ? 'bg-amber-50 text-amber-900' : 'bg-gray-50 text-gray-900'}`}>
                          {tier.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {PRICING_TIERS[0].features.map((_, featureIndex) => (
                      <tr key={featureIndex} className="hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {PRICING_TIERS[0].features[featureIndex].name}
                        </td>
                        {PRICING_TIERS.map((tier) => {
                          const feature = tier.features[featureIndex];
                          if (!feature) return <td key={tier.id} className="py-4 px-6 text-center">—</td>;
                          return (
                            <td key={tier.id} className={`py-4 px-6 text-center text-sm ${tier.popular ? 'bg-amber-50/50' : ''}`}>
                              {feature.included ? (
                                typeof feature.value === 'string' ? (
                                  <span className="font-medium text-gray-900">{feature.value}</span>
                                ) : (
                                  <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                )
                              ) : (
                                <svg className="w-5 h-5 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Studio extra feature */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-4 px-6 text-sm text-gray-700">Membres d'equip</td>
                      <td className="py-4 px-6 text-center text-sm text-gray-400">1</td>
                      <td className="py-4 px-6 text-center text-sm bg-amber-50/50 text-gray-400">1</td>
                      <td className="py-4 px-6 text-center text-sm font-medium text-gray-900">10 inclosos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Waiting List Section */}
      <section id="waitlist" className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Section Header */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/10 text-amber-400 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              Accés anticipat disponible
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-white mb-4">
              Prova-ho abans que la resta
            </h2>
            <p className="text-lg text-gray-400 mb-6 hidden">
              Uneix-te a la llista d'espera. Rebràs accés prioritari quan llancem.
            </p>

            {/* Promotional Message */}
            <div className="mb-8 p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
              <p className="text-amber-300 font-medium text-center">
                Apunta't i rep 1 mes de prova gratuït.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleWaitingListSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <input
                  type="text"
                  placeholder="Nom complet *"
                  value={formData.full_name}
                  onChange={(e) => handleFormChange('full_name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                    formErrors.full_name ? 'border-red-400' : 'border-white/20'
                  }`}
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Correu electrònic *"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                    formErrors.email ? 'border-red-400' : 'border-white/20'
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
                )}
              </div>

              {/* Company (optional) */}
              <input
                type="text"
                placeholder="Empresa (opcional)"
                value={formData.company}
                onChange={(e) => handleFormChange('company', e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-amber-400 text-gray-900 font-semibold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                    Enviant...
                  </div>
                ) : (
                  'Sol·licita Accés'
                )}
              </button>

              {/* Status Message */}
              {formStatus.message && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${
                  formStatus.type === 'success' 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {formStatus.type === 'success' ? (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{formStatus.message}</span>
                </div>
              )}
            </form>

            {/* Privacy Note */}
            <p className="mt-6 text-sm text-gray-500">
              Respectem la teva privacitat. No compartirem el teu correu amb tercers.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
              Encara tens dubtes sobre el nostre assistent?
            </h2>
            <p className="text-lg text-gray-600">
              Respostes a les preguntes més comunes sobre ArquiNorma
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => (
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
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA after FAQ */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">
              Encara tens preguntes? Contacta'ns i et respondrem amb gust.
            </p>
            <button
              onClick={() => scrollToSection('waitlist')}
              className="px-8 py-4 bg-amber-400 text-gray-900 text-lg font-semibold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-400/40"
            >
              Prova-ho gratuïtament
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      {SHOW_FINAL_CTA && (
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/50 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-200/50 rounded-full blur-3xl" />
              
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold font-title text-gray-900 mb-4">
                  Preparat per revolucionar la teva manera de treballar?
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Uneix-te als arquitectes que ja estan estalviant hores de feina amb ArquiNorma.
                </p>
                <button
                  onClick={() => scrollToSection('waitlist')}
                  className="px-8 py-4 bg-amber-400 text-gray-900 text-lg font-semibold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-400/40"
                >
                  Començar ara — És gratis
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xl font-bold">ArquiNorma</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                El primer assistent normatiu per a arquitectes.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Producte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Funcionalitats</button></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Preus</Link></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">Com funciona</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Política de privacitat</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Termes d'ús</Link></li>
                <li><Link to="/legal" className="hover:text-white transition-colors">Avís legal</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contacte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:arquinorma.cat@gmail.com" className="hover:text-white transition-colors">Privacitat</a></li>
                <li><a href="mailto:arquinorma.cat@gmail.com" className="hover:text-white transition-colors">Suport</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} ArquiNorma. Tots els drets reservats.
            </p>
            <div className="flex items-center gap-4">
              {/* Social Links */}
              <a href="mailto:arquinorma.cat@gmail.com" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/arquinorma" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

