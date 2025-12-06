/**
 * API Client for ArquiNorma Frontend
 * 
 * This module provides a centralized way to make API calls to the backend.
 * It handles URL configuration, authentication, and error handling consistently.
 * 
 * Features:
 * - Automatic backend URL resolution
 * - Authentication token handling
 * - Consistent error handling
 * - Development/production environment support
 */

import { env } from '../config/env';

/**
 * Get the base URL for API calls
 * In development, this can use either the proxy or direct backend URL
 * In production, this uses the configured backend URL
 */
const getApiBaseUrl = () => {
  // In development, we can use the proxy (relative URLs) or direct backend URL
  if (env.app.isDevelopment) {
    // Option 1: Use proxy (requires Vite proxy configuration)
    // return '/api';
    
    // Option 2: Use direct backend URL (more reliable)
    return env.api.baseUrl + '/api';
  }
  
  // In production, always use the configured backend URL
  return env.api.baseUrl + '/api';
};

/**
 * Get authentication headers
 * @param {string} token - Supabase access token
 * @returns {Object} Headers object with authorization
 */
const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {Object} options - Fetch options
 * @param {string} token - Supabase access token
 * @returns {Promise<Response>} Fetch response
 */
export const apiRequest = async (endpoint, options = {}, token = null) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add authentication if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers
  };
  
  console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
  if (config.headers?.Authorization) {
    console.log(`🔐 Token (first 20 chars): ${config.headers.Authorization.substring(7, 27)}...`);
  }
  
  try {
    const response = await fetch(url, config);
    
    // Log response for debugging
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    return response;
  } catch (error) {
    console.error(`❌ API Request failed:`, error);
    throw error;
  }
};

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint
 * @param {string} token - Supabase access token
 * @returns {Promise<Response>} Fetch response
 */
export const apiGet = (endpoint, token) => {
  return apiRequest(endpoint, { method: 'GET' }, token);
};

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {string} token - Supabase access token
 * @returns {Promise<Response>} Fetch response
 */
export const apiPost = (endpoint, data, token) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }, token);
};

/**
 * Make a PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @param {string} token - Supabase access token
 * @returns {Promise<Response>} Fetch response
 */
export const apiPut = (endpoint, data, token) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }, token);
};

/**
 * Make a DELETE request
 * @param {string} endpoint - API endpoint
 * @param {string} token - Supabase access token
 * @returns {Promise<Response>} Fetch response
 */
export const apiDelete = (endpoint, token) => {
  return apiRequest(endpoint, { method: 'DELETE' }, token);
};

/**
 * Parse API response safely
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed JSON data
 */
export const parseApiResponse = async (response) => {
  const responseText = await response.text();
  
  try {
    const data = JSON.parse(responseText);
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data?.detail || `HTTP ${response.status}: ${responseText}`,
        status: response.status
      };
    }
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    console.error("Response text:", responseText);
    console.error("Response status:", response.status);
    
    throw new Error(`Invalid JSON response: ${parseError.message}. Status: ${response.status}, Body: ${responseText}`);
  }
};

/**
 * Make an API request and parse the response
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {string} token - Supabase access token
 * @returns {Promise<Object>} Parsed response data
 */
export const apiCall = async (endpoint, options = {}, token = null) => {
  const response = await apiRequest(endpoint, options, token);
  return await parseApiResponse(response);
};

// Export the base URL getter for debugging
export { getApiBaseUrl };

export default {
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  parseApiResponse,
  apiCall,
  getApiBaseUrl
};
