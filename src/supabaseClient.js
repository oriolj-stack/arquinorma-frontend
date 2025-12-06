import { createClient } from '@supabase/supabase-js';
import { env } from './config/env';

/**
 * Supabase Client Configuration for ArquiNorma
 * 
 * This file initializes and exports the Supabase client for use throughout the application.
 * The client provides access to authentication, database, storage, and real-time features.
 * 
 * Environment variables are managed by the centralized env configuration.
 * All validation is handled automatically when the env module is imported.
 */

/**
 * Create and configure Supabase client
 * 
 * The client is configured with:
 * - Automatic session persistence in localStorage
 * - Automatic token refresh
 * - Real-time subscriptions support
 * - Row Level Security (RLS) enforcement
 */
const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    // Configure authentication behavior
    autoRefreshToken: true,      // Automatically refresh expired tokens
    persistSession: true,        // Persist session in localStorage
    detectSessionInUrl: true,    // Handle auth redirects (email confirmation, etc.)
    
    // Configure session storage (default is localStorage)
    storage: window.localStorage,
    
    // Configure auth event callbacks (optional)
    // onAuthStateChange: (event, session) => {
    //   console.log('Auth state changed:', event, session);
    // }
  },
  
  // Configure global settings - NO ROLE HEADERS
  global: {
    headers: {
      'X-Client-Info': 'arquinorma-frontend'
    }
  },
  
  // Configure real-time settings
  realtime: {
    params: {
      eventsPerSecond: 10,      // Rate limiting for real-time events
    }
  }
});

/**
 * Export the configured Supabase client
 * This client can be used throughout the application for:
 * - Authentication (sign up, sign in, sign out)
 * - Database queries (select, insert, update, delete)
 * - Storage operations (file uploads, downloads)
 * - Real-time subscriptions
 */
export { supabase };

/*
USAGE EXAMPLES:

1. AUTHENTICATION:
   ```javascript
   import { supabase } from './supabaseClient';
   
   // Sign up new user
   const { data, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'securepassword123'
   });
   
   // Sign in existing user
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'securepassword123'
   });
   
   // Sign out current user
   const { error } = await supabase.auth.signOut();
   
   // Get current session
   const { data: { session } } = await supabase.auth.getSession();
   
   // Listen to auth state changes
   supabase.auth.onAuthStateChange((event, session) => {
     console.log(event, session);
   });
   ```

2. DATABASE QUERIES:
   ```javascript
   import { supabase } from './supabaseClient';
   
   // Select data
   const { data, error } = await supabase
     .from('documents')
     .select('*')
     .eq('user_id', userId);
   
   // Insert data
   const { data, error } = await supabase
     .from('documents')
     .insert([
       { title: 'My Document', content: 'Document content' }
     ]);
   
   // Update data
   const { data, error } = await supabase
     .from('documents')
     .update({ title: 'Updated Title' })
     .eq('id', documentId);
   
   // Delete data
   const { data, error } = await supabase
     .from('documents')
     .delete()
     .eq('id', documentId);
   ```

3. STORAGE OPERATIONS:
   ```javascript
   import { supabase } from './supabaseClient';
   
   // Upload file
   const { data, error } = await supabase.storage
     .from('documents')
     .upload('folder/filename.pdf', file);
   
   // Download file
   const { data, error } = await supabase.storage
     .from('documents')
     .download('folder/filename.pdf');
   
   // Get public URL
   const { data } = supabase.storage
     .from('documents')
     .getPublicUrl('folder/filename.pdf');
   ```

4. REAL-TIME SUBSCRIPTIONS:
   ```javascript
   import { supabase } from './supabaseClient';
   
   // Subscribe to table changes
   const subscription = supabase
     .channel('documents-channel')
     .on('postgres_changes', 
       { event: 'INSERT', schema: 'public', table: 'documents' },
       (payload) => {
         console.log('New document:', payload.new);
       }
     )
     .subscribe();
   
   // Unsubscribe when component unmounts
   subscription.unsubscribe();
   ```

5. ERROR HANDLING:
   ```javascript
   import { supabase } from './supabaseClient';
   
   const handleDatabaseOperation = async () => {
     try {
       const { data, error } = await supabase
         .from('documents')
         .select('*');
       
       if (error) {
         console.error('Supabase error:', error);
         // Handle specific error cases
         switch (error.code) {
           case 'PGRST116':
             console.log('No rows found');
             break;
           case '42501':
             console.log('Insufficient permissions');
             break;
           default:
             console.log('Unknown error:', error.message);
         }
         return;
       }
       
       // Handle successful response
       console.log('Data:', data);
       
     } catch (err) {
       console.error('Unexpected error:', err);
     }
   };
   ```

SECURITY NOTES:
- The anon key is safe to use in frontend code
- Row Level Security (RLS) should be enabled on all tables
- Use the service_role key only in backend/server environments
- Never expose the service_role key in frontend code
- All database operations are subject to RLS policies

ENVIRONMENT SETUP:
Environment variables are managed by the centralized env configuration.
Create a .env.local file in your frontend directory with:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key
VITE_BACKEND_URL=http://localhost:8000
```

This client is production-ready and includes proper error handling,
configuration, and comprehensive usage examples for all Supabase features.
*/
