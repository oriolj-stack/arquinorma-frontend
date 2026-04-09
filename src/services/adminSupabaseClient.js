/**
 * Admin Supabase Client — SECURITY NOTICE
 *
 * The service role key MUST NOT be exposed in the browser bundle.
 * Admin operations that need to bypass RLS must be performed via
 * authenticated backend endpoints (FastAPI), not from the frontend.
 *
 * This file now returns the regular (anon-key) Supabase client for all callers.
 * Admin pages should call the FastAPI /api/admin/* endpoints instead of
 * directly accessing Supabase with a privileged key.
 *
 * TODO (Sprint B): Audit all usages of getAdminSupabase() across admin pages
 * and replace each one with the appropriate /api/admin/* backend call.
 */

import { supabase } from '../supabaseClient';

/**
 * @deprecated Use authenticated FastAPI /api/admin/* endpoints instead.
 * Returns the regular Supabase client — service role key is NOT available in the browser.
 */
export const getAdminSupabaseClient = () => {
  if (import.meta.env.DEV) {
    console.warn(
      '[adminSupabaseClient] Service role key is not available in the browser. ' +
      'Use /api/admin/* backend endpoints for privileged operations.'
    );
  }
  return supabase;
};

/**
 * @deprecated Use authenticated FastAPI /api/admin/* endpoints instead.
 */
export const getAdminSupabase = (_isDevUser = false) => {
  return supabase;
};

export default { getAdminSupabaseClient, getAdminSupabase };
