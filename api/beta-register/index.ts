import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { email, password, name, company, role, additional_metadata } = req.body;

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
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        company,
        role,
        beta: true,
        ...(additional_metadata || {})
      }
    });

    if (createError) {
      console.error('createUser error', createError);
      return res.status(400).json({ 
        success: false,
        error: createError.message || 'Failed to create user'
      });
    }

    if (!userData?.user?.id) {
      return res.status(400).json({ 
        success: false,
        error: 'User created but no user ID returned' 
      });
    }

    const user_id = userData.user.id;

    // 2) Insert into beta_registrations
    const { error: insertError } = await supabaseAdmin
      .from('beta_registrations')
      .insert([{
        email,
        name,
        company,
        role,
        additional_metadata: additional_metadata || {},
        user_id,
        granted: true,
        granted_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('insert error', insertError);
      // Optionally delete the created user if insertion fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
      } catch (deleteError) {
        console.error('Failed to delete user after registration insert failed:', deleteError);
      }
      return res.status(400).json({ 
        success: false,
        error: insertError.message || 'Failed to register beta access'
      });
    }

    return res.status(201).json({ success: true });

  } catch (err: any) {
    console.error('Beta registration error:', err);
    return res.status(400).json({ 
      success: false,
      error: err.message || 'An unexpected error occurred'
    });
  }
}

