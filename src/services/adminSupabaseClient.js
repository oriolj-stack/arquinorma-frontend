/**
 * Admin Supabase Client
 * 
 * Creates a Supabase client with service role key for admin operations.
 * ONLY USE IN DEVELOPMENT MODE OR BACKEND!
 * 
 * This bypasses RLS policies and should only be used for admin operations
 * when regular RLS policies prevent access (e.g., dev mode with localStorage user).
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

let adminClient = null;

/**
 * Get admin Supabase client (service role - bypasses RLS)
 * Only available in development mode
 */
export const getAdminSupabaseClient = () => {
  if (!env.app.isDevelopment) {
    console.warn('Admin client only available in development mode');
    return null;
  }

  if (!adminClient) {
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.warn('⚠️ VITE_SUPABASE_SERVICE_ROLE_KEY not set - admin client unavailable');
      console.warn('💡 To fix: Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
      console.warn('💡 You can find it in Supabase Dashboard > Settings > API > service_role key');
      console.warn('💡 After adding it, restart your dev server');
      return null;
    }

    adminClient = createClient(env.supabase.url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return adminClient;
};

/**
 * Get the appropriate Supabase client for admin operations
 * In dev mode with dev user: uses admin client (bypasses RLS)
 * In production: uses regular client (respects RLS)
 */
export const getAdminSupabase = (isDevUser = false) => {
  if (isDevUser && env.app.isDevelopment) {
    const admin = getAdminSupabaseClient();
    if (admin) {
      console.log('✅ Using admin Supabase client (bypasses RLS)');
      return admin;
    } else {
      console.warn('⚠️ Admin client not available, falling back to regular client');
    }
  }
  
  // Fallback to regular client
  const { supabase } = require('../supabaseClient');
  return supabase;
};

export default {
  getAdminSupabaseClient,
  getAdminSupabase
};

