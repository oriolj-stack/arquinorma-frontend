import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * SignupPage Component - User registration interface for ArquiNorma
 * 
 * This component provides a comprehensive signup form that integrates with Supabase Auth.
 * It includes form validation, password strength checking, error handling, and success messaging.
 * 
 * Features:
 * - Email/password/confirm password registration
 * - Client-side validation with real-time feedback
 * - Password strength indicator
 * - Supabase Auth integration with signUp
 * - Success/error message handling
 * - Automatic redirect to login after successful signup
 * - Professional responsive design with TailwindCSS
 * - Accessibility features and keyboard navigation
 */
const SignupPage = () => {
  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const navigate = useNavigate();

  /**
   * Effect to automatically clear error and success messages after 5 seconds
   */
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  /**
   * Effect to calculate password strength when password changes
   */
  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  /**
   * Calculates password strength based on various criteria
   * 
   * @param {string} password - The password to evaluate
   * @returns {number} Strength score from 0-4
   */
  const calculatePasswordStrength = (password) => {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/[0-9]/.test(password)) score++; // numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // special characters
    
    // Return normalized score (0-4)
    return Math.min(score, 4);
  };

  /**
   * Gets color class for password strength indicator
   * 
   * @returns {string} Tailwind color classes
   */
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  /**
   * Gets strength label for password indicator
   * 
   * @returns {string} Strength description
   */
  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
        return 'Molt feble';
      case 1:
        return 'Feble';
      case 2:
        return 'Regular';
      case 3:
        return 'Bona';
      case 4:
        return 'Forte';
      default:
        return '';
    }
  };

  /**
   * Handles input field changes and clears errors
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  /**
   * Validates the signup form before submission
   * 
   * @returns {Object} Validation result with isValid boolean and error message
   */
  const validateForm = () => {
    // Check required fields
    if (!formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      return {
        isValid: false,
        error: 'Tots els camps són obligatoris.'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return {
        isValid: false,
        error: 'Si us plau, introduïu una adreça de correu electrònic vàlida.'
      };
    }

    // Validate password length
    if (formData.password.length < 6) {
      return {
        isValid: false,
        error: 'La contrasenya ha de tenir almenys 6 caràcters.'
      };
    }

    // Validate password strength (require at least "Fair")
    if (passwordStrength < 2) {
      return {
        isValid: false,
        error: 'La contrasenya és massa feble. Si us plau, incloeu majúscules, minúscules i números.'
      };
    }

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      return {
        isValid: false,
        error: 'Les contrasenyes no coincideixen.'
      };
    }

    return { isValid: true, error: null };
  };

  /**
   * Handles the signup form submission with Supabase Auth integration
   * 
   * This function implements the complete signup flow:
   * 1. Validates form data client-side
   * 2. Calls Supabase Auth signUp API
   * 3. Handles different signup scenarios (confirmation required vs immediate access)
   * 4. Provides appropriate user feedback
   * 5. Redirects to login page on success
   * 
   * SUPABASE AUTH INTEGRATION:
   * - Uses supabase.auth.signUp() for user registration
   * - Handles email confirmation workflow
   * - Automatically creates user profile in auth.users table
   * - Manages different signup responses based on email confirmation settings
   * 
   * @param {Event} e - Form submission event
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // CLIENT-SIDE VALIDATION
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to sign up with Supabase Auth...');

      /**
       * SUPABASE AUTH API CALL: signUp
       * 
       * This method:
       * - Creates a new user account with email and password
       * - Sends email confirmation if email confirmation is enabled
       * - Returns user data and session information
       * - May or may not create an immediate session based on email confirmation settings
       * 
       * Response scenarios:
       * 1. Email confirmation required: user created but no session
       * 2. Email confirmation disabled: user created with immediate session
       * 3. User already exists: returns appropriate error
       */
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          // Additional user metadata can be added here
          data: {
            full_name: '', // Can be extended later
            avatar_url: '',
            created_at: new Date().toISOString()
          }
        }
      });

      // Handle authentication errors
      if (authError) {
        console.error('Supabase signup error:', {
          code: authError.code,
          message: authError.message,
          status: authError.status
        });

        /**
         * MAP SUPABASE SIGNUP ERROR CODES TO USER-FRIENDLY MESSAGES
         * 
         * Common Supabase Auth signup error scenarios:
         * - User already registered with this email
         * - Invalid email format (server-side validation)
         * - Password too weak (server-side validation)
         * - Rate limiting (too many signup attempts)
         * - Email domain restrictions
         */
        let userFriendlyMessage = '';

        switch (authError.message) {
          case 'User already registered':
          case 'A user with this email address has already been registered':
            userFriendlyMessage = 'Ja existeix un compte amb aquesta adreça de correu electrònic. Si us plau, intenteu iniciar sessió en lloc de registrar-vos.';
            break;

          case 'Password should be at least 6 characters':
            userFriendlyMessage = 'La contrasenya ha de tenir almenys 6 caràcters.';
            break;

          case 'Signup is disabled':
            userFriendlyMessage = 'El registre de nous comptes està desactivat actualment. Si us plau, contacteu amb el suport.';
            break;

          case 'Too many requests':
          case 'Rate limit exceeded':
            userFriendlyMessage = 'Massa intents de registre. Si us plau, espereu uns minuts i torneu-ho a provar.';
            break;

          case 'Invalid email':
            userFriendlyMessage = 'Si us plau, introduïu una adreça de correu electrònic vàlida.';
            break;

          default:
            userFriendlyMessage = `Error de registre: ${authError.message}`;
            
            // Log unknown errors for debugging
            if (authError.code) {
              console.warn('Unknown Supabase signup error code:', authError.code);
            }
        }

        setError(userFriendlyMessage);
        return;
      }

      /**
       * SUCCESSFUL SIGNUP HANDLING
       * 
       * Supabase signup can have different outcomes:
       * 1. User created + session created (email confirmation disabled)
       * 2. User created + no session (email confirmation required)
       * 3. User already exists but not confirmed (resend confirmation)
       */
      console.log('Supabase signup successful:', {
        userId: data.user?.id,
        userEmail: data.user?.email,
        sessionExists: !!data.session,
        emailConfirmed: data.user?.email_confirmed_at ? true : false
      });

      // Handle different signup scenarios
      if (data.user && data.session) {
        // SCENARIO 1: Immediate access (email confirmation disabled)
        setSuccessMessage('Compte creat amb èxit! Redirigint al xat...');
        
        // Redirect to chat page since user is immediately logged in
        setTimeout(() => {
          navigate('/chat', { replace: true });
        }, 2000);

      } else if (data.user && !data.session) {
        // SCENARIO 2: Email confirmation required
        setSuccessMessage(
          'Compte creat amb èxit! Si us plau, reviseu el vostre correu electrònic per confirmar el vostre compte abans d\'iniciar sessió.'
        );
        
        // Redirect to login page with confirmation message
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Si us plau, confirmeu la vostra adreça de correu electrònic per completar el registre.' 
            }
          });
        }, 5000);

      } else {
        // SCENARIO 3: Unexpected response
        console.warn('Unexpected signup response:', data);
        setError('La creació del compte s\'ha completat, però hi ha hagut una resposta inesperada. Si us plau, intenteu iniciar sessió.');
      }

    } catch (err) {
      /**
       * HANDLE UNEXPECTED ERRORS
       * 
       * These could include:
       * - Network connectivity issues
       * - Supabase service unavailable
       * - Browser compatibility issues
       * - JavaScript runtime errors
       */
      console.error('Unexpected error during signup process:', err);
      
      // Provide user-friendly error messages based on error type
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('No es pot connectar al servei de registre. Si us plau, verifiqueu la vostra connexió a Internet i torneu-ho a provar.');
      } else if (err.message?.includes('network')) {
        setError('S\'ha produït un error de xarxa. Si us plau, verifiqueu la vostra connexió i torneu-ho a provar.');
      } else {
        setError('S\'ha produït un error inesperat durant el registre. Si us plau, torneu-ho a provar o contacteu amb el suport si el problema persisteix.');
      }

      // Log error details for debugging (in development)
      if (env.app.isDevelopment) {
        console.error('Full error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }

    } finally {
      /**
       * CLEANUP AND STATE RESET
       * 
       * Always reset loading state regardless of success/failure
       */
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-cte-primary">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Uniu-vos a ArquiNorma
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Creeu el vostre compte per començar a analitzar documents amb IA
          </p>
        </div>

        {/* Signup Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg space-y-6">
            
            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email Input Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adreça de correu electrònic
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                placeholder="Introduïu la vostra adreça de correu electrònic"
                disabled={loading}
              />
            </div>

            {/* Password Input Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contrasenya
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                placeholder="Creeu una contrasenya forta"
                disabled={loading}
              />
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Força de la contrasenya:</span>
                    <span className={`font-medium ${
                      passwordStrength >= 3 ? 'text-green-600' : 
                      passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Utilitzeu 8+ caràcters amb majúscules, minúscules, números i símbols
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contrasenya
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary transition duration-200 text-sm ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-cte-primary'
                }`}
                placeholder="Confirmeu la vostra contrasenya"
                disabled={loading}
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Les contrasenyes no coincideixen</p>
              )}
            </div>

            {/* Signup Button */}
            <div>
              <button
                type="submit"
                disabled={loading || passwordStrength < 2 || formData.password !== formData.confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cte-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creant compte...
                  </div>
                ) : (
                  'Crear compte'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Ja teniu un compte?{' '}
                <Link
                  to="/login"
                  className="font-medium text-cte-primary hover:text-cte-primary-dark transition duration-200"
                >
                  Inicieu sessió aquí
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              En crear un compte, accepteu els nostres Termes de Servei i Política de Privacitat
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;

/*
COMPONENT FEATURES AND INTEGRATION:

1. SUPABASE AUTH INTEGRATION:
   - Uses supabase.auth.signUp() for user registration
   - Handles email confirmation workflow automatically
   - Supports both immediate access and email confirmation modes
   - Integrates with Supabase user management system

2. COMPREHENSIVE FORM VALIDATION:
   - Real-time password strength checking
   - Email format validation with regex
   - Password confirmation matching
   - Required field validation
   - Minimum security requirements

3. PASSWORD SECURITY:
   - Visual password strength indicator
   - Strength calculation based on multiple criteria
   - Real-time feedback as user types
   - Minimum strength requirements for submission

4. USER EXPERIENCE:
   - Loading states during registration
   - Success/error message handling with auto-dismiss
   - Disabled states during processing
   - Responsive design for all devices
   - Professional styling with TailwindCSS

5. ERROR HANDLING:
   - Comprehensive Supabase error mapping
   - User-friendly error messages
   - Network error handling
   - Development debugging support

6. ACCESSIBILITY:
   - Proper form labels and ARIA attributes
   - Keyboard navigation support
   - Screen reader friendly content
   - High contrast color schemes
   - Focus management

7. ROUTING INTEGRATION:
   - Seamless integration with React Router
   - Proper redirect handling after signup
   - State preservation for login page
   - Clean URL management

This component provides a complete, production-ready signup experience
with professional security practices and excellent user experience.
*/
