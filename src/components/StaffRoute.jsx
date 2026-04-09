import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/**
 * StaffRoute — Protects routes that require staff or admin role.
 *
 * Reads the Supabase session and checks the user's role in the `profiles`
 * table.  Only users with role = 'staff', 'admin', or 'super_admin' are
 * admitted.  Everyone else is redirected to /staff/login.
 *
 * Usage:
 *   <StaffRoute>
 *     <AdminUploadPage />
 *   </StaffRoute>
 */
const StaffRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setStatus('denied');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          if (!cancelled) setStatus('denied');
          return;
        }

        const STAFF_ROLES = ['staff', 'admin', 'super_admin'];
        if (!cancelled) {
          setStatus(STAFF_ROLES.includes(profile.role) ? 'allowed' : 'denied');
        }
      } catch {
        if (!cancelled) setStatus('denied');
      }
    };

    checkAccess();
    return () => { cancelled = true; };
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Verificant accés d'equip...</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <Navigate
        to="/staff/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

export default StaffRoute;
