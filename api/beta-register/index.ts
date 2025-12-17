import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging (will appear in Vercel function logs)
console.log('Environment variables check:', {
  hasUrl: !!SUPABASE_URL,
  hasKey: !!SUPABASE_SERVICE_ROLE_KEY,
  urlLength: SUPABASE_URL?.length || 0,
  keyLength: SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  urlPreview: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'NOT SET',
  keyPreview: SUPABASE_SERVICE_ROLE_KEY ? `${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET',
  allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ')
});

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_SERVICE_ROLE_KEY,
    availableKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
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
      console.error('Current env state:', {
        SUPABASE_URL: SUPABASE_URL ? 'SET' : 'NOT SET',
        SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
        allSupabaseKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: Missing Supabase credentials',
        debug: {
          hasUrl: !!SUPABASE_URL,
          hasKey: !!SUPABASE_SERVICE_ROLE_KEY,
          availableKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
        }
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

    // 1) Check if user already exists in beta_registrations
    console.log('Checking if user already exists in beta_registrations:', email);
    const { data: existingReg, error: checkError } = await supabaseAdmin
      .from('beta_registrations')
      .select('id, user_id, email')
      .eq('email', email.trim())
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing registration:', checkError);
      return res.status(500).json({ 
        success: false,
        error: 'Error checking existing registration'
      });
    }

    if (existingReg) {
      console.log('User already registered in beta_registrations');
      return res.status(400).json({ 
        success: false,
        error: 'Aquest correu electrònic ja està registrat'
      });
    }

    // 2) Try to create user (or get existing user ID)
    console.log('Attempting to create user with email:', email);
    let user_id: string | null = null;
    
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
      const errorMsg = createError.message?.toLowerCase() || '';
      
      // Check if error is because user already exists
      if (errorMsg.includes('already') || 
          errorMsg.includes('exists') ||
          errorMsg.includes('registered') ||
          errorMsg.includes('duplicate')) {
        console.log('User already exists, attempting to find user ID');
        
        // User exists - we need to find their ID
        // List users and find by email (unfortunately Supabase doesn't have getByEmail)
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
          return res.status(500).json({ 
            success: false,
            error: 'Error checking existing user'
          });
        }
        
        const existingUser = usersList?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        if (existingUser) {
          user_id = existingUser.id;
          console.log('Found existing user ID:', user_id);
        } else {
          // User exists but we can't find them - this shouldn't happen
          console.error('User exists but could not find in list');
          return res.status(400).json({ 
            success: false,
            error: 'Aquest correu electrònic ja està registrat'
          });
        }
      } else {
        // Other error creating user
        return res.status(400).json({ 
          success: false,
          error: createError.message || 'Failed to create user'
        });
      }
    } else if (userData?.user?.id) {
      // User created successfully
      user_id = userData.user.id;
      console.log('User created successfully with ID:', user_id);
    } else {
      console.error('No user ID returned from createUser');
      return res.status(500).json({ 
        success: false,
        error: 'User created but no user ID returned' 
      });
    }

    if (!user_id) {
      console.error('No user_id available for beta registration');
      return res.status(500).json({ 
        success: false,
        error: 'Unable to get or create user ID'
      });
    }

    // 4) Insert into beta_registrations
    console.log('Inserting into beta_registrations table for user_id:', user_id);
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
    
    console.log('Beta registration data:', JSON.stringify(betaRegData, null, 2));
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('beta_registrations')
      .insert([betaRegData])
      .select();

    if (insertError) {
      console.error('insert error:', insertError);
      console.error('insert error details:', JSON.stringify(insertError, null, 2));
      return res.status(500).json({ 
        success: false,
        error: insertError.message || 'Failed to register beta access',
        details: insertError.details || insertError.hint || ''
      });
    }

    console.log('Beta registration completed successfully:', insertData);
    return res.status(201).json({ success: true, userId: user_id });

  } catch (err: any) {
    console.error('Beta registration error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: err.message || 'An unexpected server error occurred'
    });
  }
}

