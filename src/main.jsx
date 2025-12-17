import React from 'react';
import ReactDOM from 'react-dom/client';
import { Elements } from '@stripe/react-stripe-js';
import App from '/src/App.jsx';
import '/src/index.css';
import { stripePromise } from '/src/stripeClient.js';
// Initialize i18n for internationalization support
import '/src/i18n.js';

/**
 * ArquiNorma Frontend Entry Point
 * 
 * This is the main entry point for the ArquiNorma React application.
 * It sets up the React application and renders it into the DOM.
 * 
 * FEATURES:
 * - React 18+ with createRoot for better performance
 * - TailwindCSS imported for styling
 * - Strict Mode enabled for development debugging
 * - Error boundary ready for production error handling
 * 
 * DEPENDENCIES:
 * - React 19.x for modern React features
 * - ReactDOM 19.x for DOM rendering
 * - TailwindCSS for utility-first styling
 * - App component with routing and authentication
 * 
 * ENVIRONMENT:
 * - Development: Includes React DevTools and debugging
 * - Production: Optimized build with error boundaries
 */

/**
 * Get the root DOM element where React will mount
 * This element should exist in public/index.html
 */
const rootElement = document.getElementById('root');

/**
 * Validate that the root element exists
 * Provides helpful error message if DOM element is missing
 */
if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure you have a <div id="root"></div> in your HTML file.'
  );
}


/**
 * Create React 18+ root for improved performance and features
 * Uses the new createRoot API instead of legacy ReactDOM.render
 */
const root = ReactDOM.createRoot(rootElement);

/**
 * Render the ArquiNorma application
 * 
 * STRUCTURE:
 * - React.StrictMode: Enables additional development checks
 * - App: Main application component with routing and authentication
 * 
 * React.StrictMode helps identify:
 * - Components with unsafe lifecycles
 * - Legacy string ref API usage
 * - Deprecated findDOMNode usage
 * - Unexpected side effects
 * - Legacy context API usage
 */
// Conditionally wrap with Stripe Elements only if Stripe is configured
const AppWrapper = stripePromise ? (
  <Elements stripe={stripePromise}>
    <App />
  </Elements>
) : (
  <App />
);

root.render(
  <React.StrictMode>
    {AppWrapper}
  </React.StrictMode>
);

/*
DEVELOPMENT VS PRODUCTION BEHAVIOR:

1. DEVELOPMENT MODE:
   - React.StrictMode enables additional warnings and checks
   - Components may render twice to detect side effects
   - React DevTools available for debugging
   - Hot module replacement with Vite for fast development

2. PRODUCTION MODE:
   - React.StrictMode has no runtime overhead
   - Optimized bundle with tree shaking and minification
   - Error boundaries catch and handle runtime errors
   - Service worker caching for better performance

BROWSER COMPATIBILITY:
   - Modern browsers with ES6+ support
   - React 19 requires browsers that support:
     - ES6 Classes
     - Arrow functions
     - Destructuring
     - Template literals
     - Promises

PERFORMANCE OPTIMIZATIONS:
   - React 18+ concurrent features for better UX
   - Code splitting at the route level
   - Lazy loading of components
   - Optimized re-renders with proper state management

ERROR HANDLING:
   - React error boundaries catch JavaScript errors
   - Supabase handles authentication errors
   - Network errors handled at the API level
   - User-friendly error messages throughout the app

ACCESSIBILITY:
   - Semantic HTML structure
   - ARIA labels and roles where needed
   - Keyboard navigation support
   - Screen reader compatibility
   - High contrast color schemes

This entry point provides a solid foundation for the ArquiNorma
frontend application with modern React practices and production-ready configuration.
*/