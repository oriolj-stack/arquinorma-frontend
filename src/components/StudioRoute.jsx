import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useSubscription from '../hooks/useSubscription';

/**
 * StudioRoute Component
 * 
 * Protects routes that require Studio tier subscription
 * Redirects non-Studio users to pricing page with upgrade prompt
 * 
 * Usage:
 * <StudioRoute>
 *   <PrivateDocumentsPage />
 * </StudioRoute>
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 */
const StudioRoute = ({ children }) => {
  const { subscription, loading } = useSubscription();
  const location = useLocation();

  // Show loading state while checking subscription
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificant subscripció...</p>
        </div>
      </div>
    );
  }

  // Check if user has Studio tier or Beta access
  // Beta users have tier='beta' with status='active'
  const hasAccess = subscription && (
    (subscription.tier === 'studio' && subscription.status === 'active') ||
    subscription.tier === 'beta'  // Beta users always have access (backend already returns status='active')
  );

  // If no access, redirect to pricing with message
  if (!hasAccess) {
    return (
      <Navigate 
        to="/pricing" 
        state={{ 
          from: location.pathname,
          requiredTier: 'studio',
          message: 'Aquesta funcionalitat només està disponible per a usuaris amb pla Estudi.'
        }} 
        replace 
      />
    );
  }

  // User has Studio access, render the protected component
  return children;
};

export default StudioRoute;

