# API Client Guide - ArquiNorma Frontend

## Problem Solved

The frontend was receiving HTML responses instead of JSON from the backend API, causing "Invalid JSON response" errors. This happened because:

1. **Wrong URL Resolution**: Frontend was making requests to `/api/projects/...` (relative URLs)
2. **No Proxy Configuration**: Vite proxy was disabled, so requests went to frontend server (port 3000) instead of backend (port 8000)
3. **Inconsistent API Calls**: Different components used different approaches for API calls

## Solution Implemented

### 1. Centralized API Client (`src/utils/apiClient.js`)

Created a robust API client that handles:
- ✅ Automatic backend URL resolution
- ✅ Authentication token management
- ✅ Consistent error handling
- ✅ Development/production environment support
- ✅ Safe JSON parsing with detailed error messages

### 2. Environment Configuration

The API client uses the environment configuration from `src/config/env.js`:
- **Development**: Uses `VITE_BACKEND_URL` (defaults to `http://127.0.0.1:8000`)
- **Production**: Uses the configured backend URL
- **Fallback**: Can use Vite proxy if configured

### 3. Vite Proxy Configuration (Optional)

Updated `vite.config.js` to include proxy configuration for development:
```javascript
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    secure: false,
  }
}
```

## Usage Examples

### Before (Problematic)
```javascript
// ❌ This would hit the frontend server instead of backend
const response = await fetch('/api/projects/123/messages', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### After (Fixed)
```javascript
// ✅ Using the API client
import { apiGet, apiPost, parseApiResponse } from '../utils/apiClient';

// GET request
const response = await apiGet('/projects/123/messages', token);
const result = await parseApiResponse(response);

// POST request
const response = await apiPost('/projects/123/messages', {
  content: 'Hello',
  metadata: {}
}, token);
```

## API Client Methods

### Core Methods
- `apiGet(endpoint, token)` - GET request
- `apiPost(endpoint, data, token)` - POST request
- `apiPut(endpoint, data, token)` - PUT request
- `apiDelete(endpoint, token)` - DELETE request
- `parseApiResponse(response)` - Safe JSON parsing

### Utility Methods
- `apiRequest(endpoint, options, token)` - Generic request
- `apiCall(endpoint, options, token)` - Request with automatic parsing
- `getApiBaseUrl()` - Get current API base URL

## Error Handling

The API client provides comprehensive error handling:

```javascript
try {
  const response = await apiGet('/projects/123/messages', token);
  const result = await parseApiResponse(response);
  
  if (result.success) {
    // Handle success
    setMessages(result.data);
  } else {
    // Handle API error
    throw new Error(result.error);
  }
} catch (error) {
  // Handle network/parsing errors
  console.error('API Error:', error.message);
  setError(error.message);
}
```

## Environment Variables

Required environment variables in `.env.local`:

```bash
# Backend API URL
VITE_BACKEND_URL=http://127.0.0.1:8000

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key
```

## Migration Guide

### For Existing Components

1. **Import the API client**:
   ```javascript
   import { apiGet, apiPost, parseApiResponse } from '../utils/apiClient';
   ```

2. **Replace fetch calls**:
   ```javascript
   // Before
   const response = await fetch('/api/endpoint', options);
   
   // After
   const response = await apiGet('/endpoint', token);
   const result = await parseApiResponse(response);
   ```

3. **Update error handling**:
   ```javascript
   // Before
   if (!response.ok) {
     const errorText = await response.text();
     throw new Error(errorText);
   }
   
   // After
   if (!result.success) {
     throw new Error(result.error);
   }
   ```

## Benefits

1. **Consistent API Calls**: All components use the same API client
2. **Better Error Handling**: Detailed error messages and safe JSON parsing
3. **Environment Flexibility**: Works in development and production
4. **Authentication**: Automatic token handling
5. **Debugging**: Built-in request/response logging
6. **Type Safety**: Consistent response structure

## Testing

To test the API client:

1. **Start the backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Check browser console** for API request logs:
   ```
   🌐 API Request: GET http://127.0.0.1:8000/api/projects/123/messages
   📡 API Response: 200 OK
   ```

## Troubleshooting

### Common Issues

1. **"Invalid JSON response"**: Check that backend is running on the correct port
2. **CORS errors**: Ensure backend CORS is configured for frontend URL
3. **Authentication errors**: Verify Supabase token is valid
4. **Network errors**: Check that `VITE_BACKEND_URL` is correct

### Debug Mode

The API client logs all requests and responses. Check browser console for:
- 🌐 API Request logs
- 📡 API Response logs
- ❌ Error logs

This makes debugging much easier than the previous approach.



















