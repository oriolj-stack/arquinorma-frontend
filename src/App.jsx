import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from '/src/pages/LoginPage';
import SignupPage from '/src/pages/SignupPage';
import ChatPage from '/src/pages/ChatPage';
import PaymentPage from '/src/pages/PaymentPage';
import PricingPage from '/src/pages/PricingPage';
import UserAccountPage from '/src/pages/UserAccountPage';
import ProjectsPage from '/src/pages/ProjectsPage';
import ProjectChatPage from '/src/pages/ProjectChatPage';
import SubscriptionPage from '/src/pages/SubscriptionPage';
import LandingPage from '/src/pages/LandingPage';
import PrivacyPolicyPage from '/src/pages/PrivacyPolicyPage';
import LegalNoticePage from '/src/pages/LegalNoticePage';
import TermsOfUsePage from '/src/pages/TermsOfUsePage';
import ProtectedRoute from '/src/components/ProtectedRoute';
import { supabase } from './supabaseClient';
import './App.css';
import StaffLoginPage from '/src/pages/StaffLoginPage';
import AdminUploadPage from '/src/pages/AdminUploadPage';
import AdminListPage from '/src/pages/AdminListPage';
import AdminWaitingListPage from '/src/pages/AdminWaitingListPage';
import EarlyAccessElite7f4a from '/src/pages/EarlyAccessElite7f4a';

/**
 * Navigation Bar Component
 * 
 * Displays navigation links and user information for authenticated users.
 * The navigation bar is only visible when users are logged in and not on the login page.
 * 
 * Features:
 * - Responsive design with mobile menu
 * - Active route highlighting
 * - User information display
 * - Logout functionality
 * - Professional styling with TailwindCSS
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user object
 * @param {Function} props.onLogout - Logout handler function
 */
const NavigationBar = ({ user, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navigation on login page, landing page, staff routes, subscription page, early access page, or if user is not authenticated
  if (location.pathname === '/login' || 
      location.pathname === '/' ||
      location.pathname === '/subscription' ||
      location.pathname === '/private-beta' ||
      location.pathname.startsWith('/staff') || 
      location.pathname.startsWith('/admin') || 
      !user) {
    return null;
  }

  /**
   * Gets CSS classes for navigation links based on active state
   * @param {string} path - The path to check against current location
   * @returns {string} CSS classes for the navigation link
   */
  const getLinkClasses = (path) => {
    const baseClasses = 'px-3 py-2 rounded-md text-sm font-medium transition duration-200';
    const activeClasses = 'bg-indigo-700 text-white';
    const inactiveClasses = 'text-indigo-100 hover:bg-indigo-500 hover:text-white';
    
    return `${baseClasses} ${location.pathname === path ? activeClasses : inactiveClasses}`;
  };

  /**
   * Handles logout process
   */
  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await onLogout();
    }
  };

  /**
   * Toggles mobile menu visibility
   */
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-cte-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left side - Logo and main navigation */}
          <div className="flex items-center">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-cte-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h1 className="text-white text-xl font-bold">ArquiNorma</h1>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link to="/projects" className={getLinkClasses('/projects')}>
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Projectes
                </Link>
                <Link to="/chat" className={getLinkClasses('/chat')}>
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  Xat CTE
                </Link>
                {/* 
                  Subscription upgrades are now managed in User Preferences (UserAccountPage)
                  The Upgrade button has been removed from the header navigation
                */}
              </div>
            </div>
          </div>

          {/* Right side - User menu and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* User Info (Desktop) */}
            <div className="hidden md:flex items-center space-x-3">
              <Link 
                to="/account" 
                className="flex items-center space-x-2 hover:bg-white hover:bg-opacity-10 rounded-md px-2 py-1 transition duration-200"
              >
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <span className="text-white text-opacity-90 text-sm font-medium">
                  {user.email?.split('@')[0] || 'User'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-cte-primary-dark hover:bg-orange-800 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Tancar
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-white text-opacity-90 hover:text-white p-2 rounded-md transition duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orange-600 border-opacity-30">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link to="/projects" className="block px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500 hover:text-white">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Projectes
              </Link>
              <Link to="/chat" className="block px-3 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-500 hover:text-white">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Xat CTE
              </Link>
              {/* 
                Subscription upgrades are now managed in User Preferences (UserAccountPage)
                The Upgrade button has been removed from the mobile navigation
              */}
            </div>
            
            {/* Mobile User Info and Logout */}
            <div className="pt-4 pb-3 border-t border-orange-600 border-opacity-30">
              <div className="px-2">
                <Link 
                  to="/account"
                  className="flex items-center mb-3 p-2 rounded-md hover:bg-white hover:bg-opacity-10 transition duration-200"
                >
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white">{user.email?.split('@')[0] || 'User'}</div>
                    <div className="text-xs text-white text-opacity-70">{user.email}</div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-cte-primary-dark hover:bg-orange-800 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Tancar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

/**
 * Main App Component - ArquiNorma Application Root
 * 
 * This is the main application component that handles:
 * - Routing configuration with React Router DOM
 * - Authentication state management with Supabase
 * - Protected route implementation
 * - Navigation bar display
 * - Global loading states
 * 
 * ROUTING STRUCTURE:
 * - /login → LoginPage (public, redirects authenticated users)
 * - /chat → ChatPage (protected, main chat interface)
 * - /admin → AdminPage (protected, document management)
 * - / → Redirects based on authentication status
 * - * → Catch-all redirects to appropriate page
 * 
 * AUTHENTICATION LOGIC:
 * - Uses Supabase Auth for session management
 * - Maintains authentication state across browser sessions
 * - Automatically refreshes expired tokens
 * - Listens for authentication state changes
 * - Provides logout functionality
 */
function App() {
  // Authentication state management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Effect to initialize authentication state and set up auth state listener
   * 
   * This effect:
   * 1. Gets the current session on component mount
   * 2. Sets up a listener for authentication state changes
   * 3. Handles session refresh and token management
   * 4. Cleans up the listener on component unmount
   */
  useEffect(() => {
    let mounted = true; // Flag to prevent state updates after unmount

    /**
     * Gets the initial session from Supabase
     */
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setAuthError(error.message);
        } else {
          if (mounted) {
            setUser(session?.user || null);
            console.log('Initial session loaded:', session?.user?.email || 'No user');
          }
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        if (mounted) {
          setAuthError('Failed to load authentication state');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Get initial session
    getInitialSession();

    /**
     * Set up authentication state listener
     * 
     * This listener responds to:
     * - User login/logout events
     * - Token refresh events
     * - Session expiration
     * - Password reset events
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        
        if (mounted) {
          setUser(session?.user || null);
          setLoading(false);
          setAuthError(null); // Clear any previous auth errors
        }

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in successfully');
            break;
          case 'SIGNED_OUT':
            console.log('User signed out');
            break;
          case 'TOKEN_REFRESHED':
            console.log('Auth token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('User profile updated');
            break;
          case 'PASSWORD_RECOVERY':
            console.log('Password recovery initiated');
            break;
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Handles user logout
   * 
   * This function:
   * 1. Calls Supabase auth.signOut()
   * 2. Clears local authentication state
   * 3. Handles any logout errors
   * 4. Provides user feedback
   */
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        setAuthError('Failed to sign out. Please try again.');
      } else {
        setUser(null);
        setAuthError(null);
        console.log('User signed out successfully');
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      setAuthError('An unexpected error occurred during logout.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loading state display
   * Shows a professional loading screen while checking authentication
   */
  if (loading) {
  return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading ArquiNorma...</p>
          <p className="text-sm text-gray-500">Checking authentication status</p>
        </div>
      </div>
    );
  }

  /**
   * Authentication error display
   * Shows error message if authentication initialization fails
   */
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition duration-200"
          >
            Retry
        </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation Bar - shown for authenticated users (except on login page) */}
        <NavigationBar user={user} onLogout={handleLogout} />

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            {/* 
              PUBLIC ROUTE: Login Page
              - Accessible to all users
              - Redirects authenticated users to /chat
              - Handles user authentication
            */}
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to="/chat" replace />
                ) : (
                  <LoginPage />
                )
              } 
            />

            {/* 
              PUBLIC ROUTE: Signup Page
              - Accessible to all users
              - Redirects authenticated users to /chat
              - Handles user registration with Supabase Auth
            */}
            <Route 
              path="/signup" 
              element={
                user ? (
                  <Navigate to="/chat" replace />
                ) : (
                  <SignupPage />
                )
              } 
            />

            {/* 
              PROTECTED ROUTE: Chat Page
              - Main chat interface for document Q&A
              - Only accessible to authenticated users
              - Redirects unauthenticated users to /login
              - Uses ChatBox and CitationList components
            */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute user={user}>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              PROTECTED ROUTE: Projects Page
              - Displays user's architectural projects in a responsive grid
              - Each project card shows title, type, location, and creation date
              - Clickable cards navigate to project-specific chat pages
              - Includes "New Project" button for project creation
              - Only accessible to authenticated users
            */}
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute user={user}>
                  <ProjectsPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              PROTECTED ROUTE: Project Chat Page
              - Project-specific chat interface for AI conversations
              - Displays project context and chat history
              - Handles project-based Q&A with persistent messages
              - Only accessible to authenticated users who own the project
            */}
            <Route 
              path="/projects/:id/chat" 
              element={
                <ProtectedRoute user={user}>
                  <ProjectChatPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              PROTECTED ROUTE: Payment Page
              - Stripe payment interface for subscriptions
              - Only accessible to authenticated users
              - Provides secure payment processing
              - Handles subscription upgrades and billing
            */}
            <Route 
              path="/payment" 
              element={
                <ProtectedRoute user={user}>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              PROTECTED ROUTE: Pricing Page
              - Displays subscription tiers (Basic, Pro, Studio)
              - Only accessible to authenticated users
              - Creates Stripe checkout sessions for subscriptions
              - Handles subscription selection and payment flow
            */}
            <Route 
              path="/pricing" 
              element={
                <ProtectedRoute user={user}>
                  <PricingPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              PROTECTED ROUTE: User Account Page
              - User account management interface
              - Only accessible to authenticated users
              - Provides personal info, subscription, and billing management
              - Tab-based interface for easy navigation
            */}
            <Route 
              path="/account" 
              element={
                <ProtectedRoute user={user}>
                  <UserAccountPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              PROTECTED ROUTE: Subscription Management Page
              - Full-page subscription management (Cursor-style)
              - Current subscription overview
              - Payment methods management
              - Plan upgrades/downgrades
              - Billing information
            */}
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute user={user}>
                  <SubscriptionPage />
                </ProtectedRoute>
              } 
            />

            {/* 
              STAFF ROUTES: Staff authentication and admin panel
              - /staff/login: Staff authentication page
              - /admin/upload: PDF upload interface for staff
            */}
            <Route 
              path="/staff/login" 
              element={<StaffLoginPage />} 
            />

            <Route 
              path="/admin/upload" 
              element={<AdminUploadPage />} 
            />

            <Route 
              path="/admin/list" 
              element={<AdminListPage />} 
            />

            <Route 
              path="/admin/waiting-list" 
              element={<AdminWaitingListPage />} 
            />

            {/* 
              DEFAULT ROUTE: Root Path
              - Redirects to appropriate page based on authentication status
              - Authenticated users: /chat (main application)
              - Unauthenticated users: /login
            */}
            {/* 
              PUBLIC ROUTE: Landing Page
              - Main marketing page for ArquiNorma
              - Shows features, pricing, and waiting list form
              - Redirects authenticated users to projects page
            */}
            <Route 
              path="/" 
              element={
                user ? <Navigate to="/projects" replace /> : <LandingPage />
              } 
            />

            {/* 
              PUBLIC ROUTE: Privacy Policy
              - Accessible to all users (authenticated and unauthenticated)
            */}
            <Route 
              path="/privacy" 
              element={<PrivacyPolicyPage />} 
            />

            {/* 
              PUBLIC ROUTE: Legal Notice (Avis Legal)
              - Accessible to all users (authenticated and unauthenticated)
            */}
            <Route 
              path="/legal" 
              element={<LegalNoticePage />} 
            />

            {/* 
              PUBLIC ROUTE: Terms of Use (Termes d'ús)
              - Accessible to all users (authenticated and unauthenticated)
            */}
            <Route 
              path="/terms" 
              element={<TermsOfUsePage />} 
            />

            {/* 
              PUBLIC ROUTE: Early Access Elite (Private Beta Registration)
              - Accessible only via direct URL: /private-beta
              - NOT linked in navigation (obscure URL for private beta)
              - Allows beta users to register and create accounts
            */}
            <Route 
              path="/private-beta" 
              element={<EarlyAccessElite7f4a />} 
            />

            {/* 
              CATCH-ALL ROUTE: Handle undefined routes
              - Redirects to appropriate page based on authentication status
              - Prevents 404 errors for invalid URLs
              - Maintains consistent user experience
            */}
            <Route 
              path="*" 
              element={
                <Navigate to={user ? "/projects" : "/"} replace />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

/*
ROUTING AND AUTHENTICATION ARCHITECTURE:

1. AUTHENTICATION STATE MANAGEMENT:
   - Uses React hooks (useState, useEffect) for state management
   - Integrates with Supabase Auth for session handling
   - Maintains authentication state across browser sessions
   - Automatic token refresh and session management
   - Real-time authentication state updates

2. ROUTE PROTECTION STRATEGY:
   - ProtectedRoute component wraps sensitive routes
   - Automatic redirection for unauthenticated users
   - Preserves intended destination after login
   - Prevents direct URL access to protected content

3. NAVIGATION SYSTEM:
   - Responsive navigation bar with mobile support
   - Active route highlighting for better UX
   - User information display and logout functionality
   - Hidden navigation on login page for clean UX

4. ROUTING LOGIC:
   - /login: Public route with auth redirect
   - /chat: Protected main application interface
   - /admin: Protected document management interface
   - /: Smart redirect based on auth status
   - *: Catch-all for undefined routes

5. ERROR HANDLING:
   - Authentication error display with retry option
   - Loading states during auth initialization
   - Graceful handling of network issues
   - User-friendly error messages

6. SECURITY CONSIDERATIONS:
   - All sensitive routes are protected
   - Authentication state is managed centrally
   - Proper session handling with Supabase
   - Secure logout with state clearing

7. USER EXPERIENCE:
   - Seamless authentication flow
   - Persistent login state
   - Loading indicators during transitions
   - Responsive design for all devices
   - Professional styling with TailwindCSS

This architecture ensures a secure, scalable, and user-friendly
single-page application with proper authentication and routing.
*/