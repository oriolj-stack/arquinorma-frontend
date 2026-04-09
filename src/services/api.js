/**
 * ArquiNorma API Service
 * 
 * Centralized API client for communicating with the backend.
 * Handles authentication, error handling, and base URL configuration.
 */

import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * Get the backend API base URL
 * In development: uses localhost:8000
 * In production: uses VITE_BACKEND_URL (Cloudflare Tunnel URL)
 */
export const getApiBaseUrl = () => {
  const baseUrl = env.api.baseUrl;
  
  if (!baseUrl && !import.meta.env.DEV) {
    console.error(
      '❌ VITE_BACKEND_URL is not configured!\n' +
      'The frontend cannot communicate with the backend.\n' +
      'Please set VITE_BACKEND_URL in Vercel environment variables.'
    );
  }
  
  return baseUrl;
};

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = async () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
};

/**
 * Make an authenticated API request.
 * - Adds a 30-second abort timeout so a hung backend never freezes the UI.
 * - Intercepts 401 responses and signs the user out, then reloads to /login.
 *
 * @param {string} endpoint - API endpoint (e.g., '/api/towns')
 * @param {object} options  - Fetch options
 * @param {number} [timeoutMs=30000] - Request timeout in milliseconds
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}, timeoutMs = 30_000) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
      credentials: 'include',
      signal: controller.signal,
    });

    // Global 401 handler — expired/invalid token → sign out and redirect
    if (response.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
      // Return a never-resolving promise so callers don't need to handle this
      return new Promise(() => {});
    }

    return response;
  } finally {
    clearTimeout(timerId);
  }
};

/**
 * Make a GET request
 */
export const apiGet = async (endpoint) => {
  return apiRequest(endpoint, { method: 'GET' });
};

/**
 * Make a POST request
 */
export const apiPost = async (endpoint, body) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Make a PUT request
 */
export const apiPut = async (endpoint, body) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = async (endpoint) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};

/**
 * Health check - verify backend is reachable
 */
export const checkBackendHealth = async () => {
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return { ok: false, error: 'Backend URL not configured' };
    }
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { ok: true, data };
    } else {
      return { ok: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

export default {
  getApiBaseUrl,
  getAuthHeaders,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  checkBackendHealth,
};


