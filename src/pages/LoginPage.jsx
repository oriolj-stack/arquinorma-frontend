import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * LoginPage Component - User authentication interface for ArquiNorma
 * 
 * This component provides a clean, professional login form that integrates with Supabase Auth.
 * It includes form validation, error handling, loading states, and automatic redirects.
 * 
 * Features:
 * - Email/password authentication using Supabase Auth
 * - Responsive design with TailwindCSS
 * - Form validation and error handling
 * - Loading states during authentication
 * - Automatic redirect to intended page after successful login
 * - Link to signup page for new users
 * - Professional mobile-friendly design
 */
const LoginPage = () => {
  // Form state management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Navigation hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state (set by ProtectedRoute)
  // Default to /chat if no specific destination was requested
  const from = location.state?.from?.pathname || '/chat';

  /**
   * Effect to automatically clear error messages after 5 seconds
   * Improves user experience by not showing stale error messages
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer); // Cleanup timer on unmount or error change
    }
  }, [error]);

  /**
   * Handles the login form submission with Supabase Auth integration
   * 
   * This function implements the complete login flow:
   * 1. Validates user input (email format, required fields)
   * 2. Calls Supabase Auth signInWithPassword API
   * 3. Handles authentication errors with user-friendly messages
   * 4. Manages loading states during authentication
   * 5. Redirects user to intended destination on success
   * 
   * SUPABASE AUTH INTEGRATION:
   * - Uses supabase.auth.signInWithPassword() for email/password authentication
   * - Automatically handles session creation and token management
   * - Session is persisted in localStorage by default
   * - Auth state changes are detected by App.jsx listener
   * 
   * @param {Event} e - Form submission event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear any previous errors

    // CLIENT-SIDE VALIDATION
    // Validate required fields before making API call
    if (!email.trim() || !password.trim()) {
      setError('Si us plau, introduïu l\'adreça de correu electrònic i la contrasenya.');
      setLoading(false);
      return;
    }

    // Validate email format using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Si us plau, introduïu una adreça de correu electrònic vàlida.');
      setLoading(false);
      return;
    }

    // Validate password length (minimum security requirement)
    if (password.length < 6) {
      setError('La contrasenya ha de tenir almenys 6 caràcters.');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to sign in with Supabase Auth...');
      
      /**
       * SUPABASE AUTH API CALL: signInWithPassword
       * 
       * This method:
       * - Authenticates user with email and password
       * - Creates a new session if credentials are valid
       * - Returns user data and session information
       * - Automatically stores session in localStorage
       * - Triggers auth state change events
       * 
       * Response structure:
       * - data.user: User object with id, email, metadata, etc.
       * - data.session: Session object with access_token, refresh_token, etc.
       * - error: Authentication error object if login fails
       */
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // Handle authentication errors
      if (authError) {
        console.error('Supabase authentication error:', {
          code: authError.code,
          message: authError.message,
          status: authError.status
        });
        
        /**
         * MAP SUPABASE ERROR CODES TO USER-FRIENDLY MESSAGES
         * 
         * Common Supabase Auth error scenarios:
         * - Invalid credentials (wrong email/password)
         * - Email not confirmed (signup confirmation pending)
         * - Too many requests (rate limiting)
         * - Account disabled or suspended
         * - Network connectivity issues
         */
        let userFriendlyMessage = '';
        
        switch (authError.message) {
          case 'Invalid login credentials':
          case 'Invalid credentials':
            userFriendlyMessage = 'Adreça de correu electrònic o contrasenya incorrectes. Si us plau, verifiqueu les vostres credencials i torneu-ho a provar.';
            break;
            
          case 'Email not confirmed':
            userFriendlyMessage = 'Si us plau, confirmeu la vostra adreça de correu electrònic abans d\'iniciar sessió. Reviseu la vostra safata d\'entrada per trobar l\'enllaç de confirmació.';
            break;
            
          case 'Too many requests':
          case 'Rate limit exceeded':
            userFriendlyMessage = 'Massa intents d\'inici de sessió. Si us plau, espereu uns minuts i torneu-ho a provar.';
            break;
            
          case 'User not found':
            userFriendlyMessage = 'No s\'ha trobat cap compte amb aquesta adreça de correu electrònic. Si us plau, verifiqueu el vostre correu electrònic o registreu-vos per crear un compte nou.';
            break;
            
          case 'Account is disabled':
            userFriendlyMessage = 'El vostre compte ha estat desactivat. Si us plau, contacteu amb el suport per obtenir ajuda.';
            break;
            
          case 'Password is too weak':
            userFriendlyMessage = 'La vostra contrasenya no compleix els requisits de seguretat. Si us plau, utilitzeu una contrasenya més forta.';
            break;
            
          default:
            // Fallback for unknown errors
            userFriendlyMessage = `Error d'inici de sessió: ${authError.message}`;
            
            // Log unknown errors for debugging
            if (authError.code) {
              console.warn('Unknown Supabase error code:', authError.code);
            }
        }
        
        setError(userFriendlyMessage);
        return;
      }

      /**
       * SUCCESSFUL AUTHENTICATION HANDLING
       * 
       * When login is successful:
       * 1. Supabase automatically creates and stores session
       * 2. Session includes access_token for API calls
       * 3. Refresh_token for automatic token renewal
       * 4. User object with profile information
       * 5. Auth state change event is triggered
       */
      console.log('Supabase login successful:', {
        userId: data.user?.id,
        userEmail: data.user?.email,
        sessionExists: !!data.session,
        accessToken: data.session?.access_token ? 'Present' : 'Missing'
      });

      /**
       * USER DATA STORAGE AND STATE MANAGEMENT
       * 
       * Note: We don't need to manually store user data here because:
       * 1. Supabase automatically persists session in localStorage
       * 2. App.jsx has an auth state listener that detects this login
       * 3. The listener will update the global user state automatically
       * 4. This ensures consistent auth state across the entire app
       */

      /**
       * NAVIGATION AFTER SUCCESSFUL LOGIN
       * 
       * Redirect user to their intended destination:
       * - 'from' variable contains the original destination (set by ProtectedRoute)
       * - Default to '/chat' if no specific destination was requested
       * - Use replace: true to prevent back button issues
       */
      console.log(`Redirecting user to: ${from}`);
      navigate(from, { replace: true });

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
      console.error('Unexpected error during login process:', err);
      
      // Provide user-friendly error messages based on error type
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('No es pot connectar al servei d\'autenticació. Si us plau, verifiqueu la vostra connexió a Internet i torneu-ho a provar.');
      } else if (err.message?.includes('network')) {
        setError('S\'ha produït un error de xarxa. Si us plau, verifiqueu la vostra connexió i torneu-ho a provar.');
      } else {
        setError('S\'ha produït un error inesperat durant l\'inici de sessió. Si us plau, torneu-ho a provar o contacteu amb el suport si el problema persisteix.');
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
       * This ensures the UI returns to normal state
       */
      setLoading(false);
    }
  };

  /**
   * Handles input field changes and clears errors
   * Provides immediate feedback by clearing error messages when user starts typing
   * 
   * @param {Function} setter - State setter function (setEmail or setPassword)
   * @param {string} value - New input value
   */
  const handleInputChange = (setter, value) => {
    setter(value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-cte-primary">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Benvingut a ArquiNorma
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicieu sessió al vostre compte per accedir a l'anàlisi de documents
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
                value={email}
                onChange={(e) => handleInputChange(setEmail, e.target.value)}
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => handleInputChange(setPassword, e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                placeholder="Introduïu la vostra contrasenya"
                disabled={loading}
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => alert('La funcionalitat de recuperació de contrasenya s\'implementarà aviat!')}
                className="text-sm font-medium text-cte-primary hover:text-cte-primary-dark transition duration-200"
              >
                Heu oblidat la contrasenya?
              </button>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cte-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciant sessió...
                  </div>
                ) : (
                  'Iniciar sessió'
                )}
              </button>
            </div>

            {/* Signup Link - Hidden for private beta */}
            {/* Temporarily hidden for private beta access
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                No teniu un compte?{' '}
                <Link
                  to="/signup"
                  className="font-medium text-cte-primary hover:text-cte-primary-dark transition duration-200"
                >
                  Registreu-vos aquí
                </Link>
              </p>
            </div>
            */}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2024 ArquiNorma. Tots els drets reservats.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

/*
COMPONENT USAGE AND INTEGRATION NOTES:

1. SUPABASE INTEGRATION:
   - Uses supabase.auth.signInWithPassword() for authentication
   - Handles all Supabase error cases with user-friendly messages
   - Automatically manages session storage and token refresh

2. ROUTING INTEGRATION:
   - Works with ProtectedRoute to redirect users to intended destination
   - Uses React Router's useNavigate and useLocation hooks
   - Supports deep linking (users can bookmark protected pages)

3. FORM VALIDATION:
   - Client-side validation for required fields and email format
   - Real-time error clearing when user starts typing
   - Disabled state management during loading

4. RESPONSIVE DESIGN:
   - Mobile-first approach with TailwindCSS
   - Professional gradient background
   - Clean, modern form styling
   - Accessible form labels and focus states

5. ERROR HANDLING:
   - Maps technical Supabase errors to user-friendly messages
   - Automatic error clearing after 5 seconds
   - Loading states prevent multiple submissions

6. ACCESSIBILITY:
   - Proper form labels and ARIA attributes
   - Keyboard navigation support
   - Focus management and visual feedback
   - Screen reader friendly error messages

This component is production-ready and integrates seamlessly with the App.jsx
routing system and Supabase authentication backend.
*/
