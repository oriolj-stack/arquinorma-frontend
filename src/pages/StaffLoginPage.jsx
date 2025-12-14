import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * StaffLoginPage Component - Staff/Admin authentication interface
 */
const StaffLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/upload';

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      console.log('Staff login attempt...');
      
      // Check for development tokens first
      if (env.app.isDevelopment) {
        console.log('Development mode detected');
        const devTokens = {
          'staff@arquinorma.dev': { token: 'staff_dev_token_123', role: 'staff' },
          'admin@arquinorma.dev': { token: 'admin_dev_token_123', role: 'admin' }
        };

        console.log('Checking dev tokens for:', email.trim());
        if (devTokens[email.trim()] && password === devTokens[email.trim()].token) {
          console.log('Development token authentication successful');
          
          const mockUser = {
            id: `dev_${devTokens[email.trim()].role}_1`,
            email: email.trim(),
            role: devTokens[email.trim()].role,
            full_name: `${devTokens[email.trim()].role.charAt(0).toUpperCase() + devTokens[email.trim()].role.slice(1)} User`  // ← Fixed: added .role before .slice
          };

          localStorage.setItem('dev_staff_user', JSON.stringify(mockUser));
          
          console.log(`Development ${mockUser.role} login successful:`, mockUser.email);
          navigate(from, { replace: true });
          return;
        } else {
          console.log('Development token check failed');
        }
      }
      
      console.log('Attempting Supabase authentication...');
      // Regular Supabase authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('Supabase auth response:', { data, authError });

      if (authError) {
        console.error('Staff authentication error:', authError);
        setError(`Authentication failed: ${authError.message}`);
        return;
      }

      if (data?.user) {
        console.log('Staff authentication successful:', data.user.email);
        
        // Try to get user profile, but don't fail if it doesn't exist
        let userRole = 'user'; // default role
        
        try {
          console.log('Fetching user profile for ID:', data.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          console.log('Profile query result:', { profile, profileError });

          if (profileError) {
            console.warn('Profile not found, creating default profile:', profileError);
            
            // Create a default profile for the user
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.email.split('@')[0],
                role: 'staff' // Default to staff for staff login
              });

            console.log('Profile insert result:', { insertError });

            if (insertError) {
              console.error('Failed to create profile:', insertError);
              setError(`Failed to create user profile: ${insertError.message}`);
              return;
            }
            
            userRole = 'staff';
          } else {
            userRole = profile?.role || 'user';
          }
        } catch (err) {
          console.error('Error handling profile:', err);
          setError(`Error accessing user profile: ${err.message}`);
          return;
        }

        // Validate staff/admin role
        if (!['staff', 'admin', 'super_admin'].includes(userRole.toLowerCase())) {
          console.warn('Insufficient permissions for user:', data.user.email, 'Role:', userRole);
          setError('Access denied. Staff or admin permissions required.');
          await supabase.auth.signOut();
          return;
        }

        console.log('Staff role verified:', userRole);
        navigate(from, { replace: true });
      }

    } catch (err) {
      console.error('Unexpected error during staff login:', err);
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(`Unexpected error: ${err.message || 'Please try again or contact support.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter, value) => {
    setter(value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-amber-500">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Staff Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your staff credentials to access the admin panel
          </p>
          {env.app.isDevelopment && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700 font-medium">Development Mode</p>
              <p className="text-xs text-blue-600 mt-1">
                Use: <strong>staff@arquinorma.dev</strong> / <strong>staff_dev_token_123</strong>
              </p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleStaffLogin}>
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg space-y-6">
            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start">
                <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email Input Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Staff Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => handleInputChange(setEmail, e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200 text-sm"
                placeholder="Enter your staff email"
                disabled={loading}
              />
            </div>

            {/* Password Input Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => handleInputChange(setPassword, e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200 text-sm"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Staff Portal'
                )}
              </button>
            </div>

            {/* Back to User Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Not a staff member?{' '}
                <Link
                  to="/login"
                  className="font-medium text-amber-600 hover:text-amber-500 transition duration-200"
                >
                  User Login
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2024 ArquiNorma Staff Portal. All rights reserved.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffLoginPage;
