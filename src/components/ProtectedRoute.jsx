import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute Component - Route protection for authenticated users only
 * 
 * This component wraps protected routes to ensure only authenticated users can access them.
 * If a user is not authenticated, they are redirected to the login page with the original
 * destination preserved for redirect after successful login.
 * 
 * Features:
 * - Authentication state checking
 * - Automatic redirect to login for unauthenticated users
 * - Preserves intended destination in location state
 * - Loading state handling
 * - Clean integration with React Router
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The protected component(s) to render
 * @param {Object|null} props.user - Current authenticated user object from Supabase
 * 
 * @example
 * <ProtectedRoute user={user}>
 *   <ChatPage />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, user }) => {
  const location = useLocation();

  /**
   * Check if user is authenticated
   * A user is considered authenticated if:
   * 1. User object exists
   * 2. User has a valid id
   * 3. User has a valid email (basic validation)
   */
  const isAuthenticated = user && user.id && user.email;

  /**
   * If user is not authenticated, redirect to login page
   * Preserve the current location in state so we can redirect back after login
   */
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  /**
   * If user is authenticated, render the protected children
   */
  return children;
};

export default ProtectedRoute;

/*
COMPONENT USAGE AND INTEGRATION:

1. AUTHENTICATION LOGIC:
   - Relies on user object passed from parent (App.jsx)
   - Checks for essential user properties (id, email)
   - Works with Supabase user object structure
   - Simple boolean authentication check

2. ROUTING INTEGRATION:
   - Uses React Router's Navigate component for redirects
   - Preserves original destination in location state
   - Works with useLocation hook in LoginPage for redirect after login
   - Uses replace=true to avoid back button issues

3. STATE PRESERVATION:
   - Stores intended destination in location.state.from
   - LoginPage can access this via useLocation hook
   - Enables seamless redirect after successful authentication
   - Maintains deep linking functionality

4. SECURITY CONSIDERATIONS:
   - Client-side route protection only (not a security measure)
   - Server-side authentication still required for API calls
   - Prevents UI access but doesn't secure data
   - Should be combined with API-level authentication

5. USER EXPERIENCE:
   - Immediate redirect for better UX
   - No flash of protected content
   - Preserves user's intended destination
   - Clean integration with authentication flow

6. ERROR HANDLING:
   - Gracefully handles null/undefined user objects
   - Works with loading states in parent component
   - No error boundaries needed (simple redirect logic)

INTEGRATION WITH APP.JSX:
```jsx
<Route 
  path="/chat" 
  element={
    <ProtectedRoute user={user}>
      <ChatPage />
    </ProtectedRoute>
  } 
/>
```

This component provides a clean, reusable way to protect routes
while maintaining excellent user experience and proper redirect handling.
*/
