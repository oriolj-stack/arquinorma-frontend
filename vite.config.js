import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ArquiNorma Frontend - Vite Configuration
// Optimized for production deployment on Vercel/Netlify

export default defineConfig({
  plugins: [react()],
  
  // Base path configuration
  // Use '/' for root domain deployment (recommended)
  // Use '/arquinorma/' if deploying to a subdomain or subpath
  base: '/',
  
  // Build configuration
  build: {
    // Output directory (dist is default and works with most platforms)
    outDir: 'dist',
    
    // Generate source maps for better debugging in production
    sourcemap: true,
    
    // Optimize bundle size
    minify: 'terser',
    
    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Supabase chunk
          supabase: ['@supabase/supabase-js'],
          // Stripe chunk
          stripe: ['@stripe/stripe-js']
        }
      }
    },
    
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
    
    // Asset handling
    assetsDir: 'assets',
    
    // Clean output directory before build
    emptyOutDir: true
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    
    // Proxy configuration for development
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // Don't rewrite the path - keep /api prefix
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Proxy Stripe endpoints to backend
      '/stripe': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy webhooks to backend
      '/webhooks': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Preview server configuration (for testing production builds locally)
  preview: {
    port: 4173,
    host: true
  },
  
  // Environment variables configuration
  define: {
    // Define global constants at build time
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Resolve configuration
  resolve: {
    // Path aliases for cleaner imports
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@utils': '/src/utils'
    }
  },
  
  // CSS configuration
  css: {
    // PostCSS configuration (for TailwindCSS)
    postcss: './postcss.config.js',
    
    // CSS modules configuration (if needed)
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // Optimization configuration
  optimizeDeps: {
    // Include dependencies that should be pre-bundled
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@stripe/stripe-js'
    ],
    
    // Exclude dependencies from pre-bundling
    exclude: []
  },
  
  // ESBuild configuration for faster builds
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})

/*
DEPLOYMENT CONFIGURATION NOTES:

1. VERCEL DEPLOYMENT:
   - Vercel automatically detects Vite projects
   - Build command: npm run build
   - Output directory: dist
   - Install command: npm install

2. NETLIFY DEPLOYMENT:
   - Build command: npm run build
   - Publish directory: dist
   - Install command: npm install

3. BASE PATH CONFIGURATION:
   - For root domain: base: '/'
   - For subdomain/subpath: base: '/your-path/'
   - Update this based on your deployment URL structure

4. ENVIRONMENT VARIABLES:
   - All environment variables must be prefixed with VITE_
   - Set these in your deployment platform's dashboard
   - Never commit .env files with real values

5. OPTIMIZATION:
   - Manual chunks improve caching
   - Source maps help with debugging
   - Tree shaking removes unused code
   - Terser minification reduces bundle size

This configuration is optimized for production deployment
with proper chunking, optimization, and platform compatibility.
*/