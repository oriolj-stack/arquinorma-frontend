import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_SERVICE_ROLE_KEY
  });
  // Don't throw here - handle in the handler to return proper JSON response
}

const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get origin from request
    const origin = req.headers.origin || '';
    
    // Allow localhost and production domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'https://arquinorma.cat',
      'https://www.arquinorma.cat',
      'https://arquinorma-frontend.vercel.app'
    ];
    
    // Check if origin is allowed
    const isAllowedOrigin = origin && (
      allowedOrigins.includes(origin) || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1')
    );
    
    // Set CORS headers
    // Use specific origin if allowed, otherwise use * (but can't use credentials with *)
    if (isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'false');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      console.error('Supabase client not initialized - missing environment variables');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
      });
    }

    // Validate request body exists
    if (!req.body) {
      return res.status(400).json({ success: false, error: 'Request body is required' });
    }

    const { email, password, name, company, role, additional_metadata } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'email and password required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // 1) Create user with service role
    console.log('Creating user with email:', email);
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        name: name || null,
        company: company || null,
        role: role || null,
        beta: true,
        ...(additional_metadata || {})
      }
    });

    if (createError) {
      console.error('createUser error:', createError);
      return res.status(400).json({ 
        success: false,
        error: createError.message || 'Failed to create user'
      });
    }

    if (!userData?.user?.id) {
      console.error('No user ID returned from createUser');
      return res.status(500).json({ 
        success: false,
        error: 'User created but no user ID returned' 
      });
    }

    const user_id = userData.user.id;
    console.log('User created successfully with ID:', user_id);

    // 2) Insert into beta_registrations
    console.log('Inserting into beta_registrations table');
    const betaRegData: any = {
      email: email.trim(),
      user_id,
      granted: true,
      granted_at: new Date().toISOString(),
      questions_used: 0,
      tokens_used: 0
    };
    
    // Only include optional fields if they have values
    if (name) betaRegData.name = name;
    if (company) betaRegData.company = company;
    if (role) betaRegData.role = role;
    if (additional_metadata) betaRegData.additional_metadata = additional_metadata;
    
    const { error: insertError } = await supabaseAdmin
      .from('beta_registrations')
      .insert([betaRegData]);

    if (insertError) {
      console.error('insert error:', insertError);
      // Optionally delete the created user if insertion fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
        console.log('Deleted user after registration insert failed');
      } catch (deleteError) {
        console.error('Failed to delete user after registration insert failed:', deleteError);
      }
      return res.status(500).json({ 
        success: false,
        error: insertError.message || 'Failed to register beta access'
      });
    }

    console.log('Beta registration completed successfully');
    return res.status(201).json({ success: true });

  } catch (err: any) {
    console.error('Beta registration error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: err.message || 'An unexpected server error occurred'
    });
  }
}

