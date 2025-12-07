/**
 * Environment Configuration for ArquiNorma Frontend
 * 
 * This file centralizes all environment variable access and validation.
 * It provides a single source of truth for environment configuration
 * and ensures proper error handling for missing variables.
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous/public key
 * - VITE_STRIPE_PUBLIC_KEY: Your Stripe publishable key
 * - VITE_BACKEND_URL: Your backend API URL
 * 
 * Note: In Vite, environment variables must be prefixed with VITE_ to be accessible
 * in the frontend. These should be set in your .env.local file.
 */

/**
 * Get environment variable with validation and default value support
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if variable is not set
 * @param {boolean} required - Whether the variable is required
 * @returns {string} Environment variable value
 */
const getEnvVar = (key, defaultValue = '', required = false) => {
  const value = import.meta.env[key] || defaultValue;
  
  if (required && !value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please add ${key} to your .env.local file.\n` +
      `See the project README for setup instructions.`
    );
  }
  
  return value;
};

/**
 * Validate that all required environment variables are present
 * This runs immediately when the module is imported
 */
const validateEnvironment = () => {
  const missingVars = [];
  
  // Check required variables
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PUBLIC_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    // In development mode, just warn instead of error
    if (import.meta.env.DEV) {
      console.warn(
        '⚠️ Missing environment variables (using defaults):\n' +
        missingVars.map(v => `  - ${v}`).join('\n') +
        '\n\nTo set up properly, create a .env.local file with:\n' +
        'VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
        'VITE_SUPABASE_ANON_KEY=your-anon-key-here\n' +
        'VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key\n' +
        'VITE_BACKEND_URL=http://localhost:8000'
      );
    } else {
      console.error(
        '❌ Missing required environment variables:\n' +
        missingVars.map(v => `  - ${v}`).join('\n') +
        '\n\nPlease add these to your .env.local file:\n' +
        missingVars.map(v => `${v}=your-value-here`).join('\n')
      );
    }
  }
};

// Validate environment on module load
validateEnvironment();

/**
 * Environment configuration object
 * Provides typed access to all environment variables with validation
 */
export const env = {
  // Supabase Configuration
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL', 'https://placeholder.supabase.co', false),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY', 'placeholder-key', false),
  },
  
  // Stripe Configuration
  stripe: {
    publicKey: getEnvVar('VITE_STRIPE_PUBLIC_KEY', 'pk_test_placeholder', false),
    publishableKey: getEnvVar('VITE_STRIPE_PUBLIC_KEY', 'pk_test_placeholder', false), // Alias for compatibility
  },
  
  // Backend API Configuration
  api: {
    // In production, VITE_BACKEND_URL must be set to the Cloudflare Tunnel URL
    // In development, defaults to localhost:8000
    baseUrl: getEnvVar('VITE_BACKEND_URL', import.meta.env.DEV ? 'http://localhost:8000' : '', false),
  },
  
  // Application Configuration
  app: {
    environment: getEnvVar('VITE_ENVIRONMENT', 'development', false),
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    mode: import.meta.env.MODE,
  }
};

/**
 * Legacy support - individual exports for backward compatibility
 * @deprecated Use the env object instead
 */
export const SUPABASE_URL = env.supabase.url;
export const SUPABASE_ANON_KEY = env.supabase.anonKey;
export const STRIPE_PUBLIC_KEY = env.stripe.publicKey;
export const BACKEND_URL = env.api.baseUrl;

/**
 * Environment validation utility
 * Can be called manually to re-validate environment
 */
export const validateEnv = validateEnvironment;

/**
 * Get raw environment variable (for special cases)
 * @param {string} key - Environment variable key
 * @returns {string|undefined} Raw environment variable value
 */
export const getRawEnv = (key) => import.meta.env[key];

export default env;
