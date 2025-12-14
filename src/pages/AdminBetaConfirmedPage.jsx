import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import { apiGet } from '../services/api';
import AdminHeader from '../components/Admin/AdminHeader';

/**
 * Admin Beta Confirmed Page
 * 
 * Displays confirmed beta testers from beta_registrations table.
 * Clean, professional table UI for architects.
 */

const AdminBetaConfirmedPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      // Check for development user first
      if (env.app.isDevelopment) {
        const devUser = localStorage.getItem('dev_staff_user');
        if (devUser) {
          const parsedUser = JSON.parse(devUser);
          setUser(parsedUser);
          setLoading(false);
          loadConfirmedUsers();
          return;
        } else {
          // Set up a default development user
          const defaultDevUser = {
            id: 'dev_staff_1',
            email: 'staff@arquinorma.dev',
            role: 'staff',
            full_name: 'Staff User'
          };
          localStorage.setItem('dev_staff_user', JSON.stringify(defaultDevUser));
          setUser(defaultDevUser);
          setLoading(false);
          loadConfirmedUsers();
          return;
        }
      }

      // Regular Supabase authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/staff/login');
        return;
      }

      // Verify staff role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, email, full_name')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error checking user profile:', profileError);
        setError('Error verificant el teu perfil. Torna-ho a provar.');
        setLoading(false);
        return;
      }

      if (!['staff', 'admin', 'super_admin'].includes(profile?.role?.toLowerCase())) {
        console.error('Accés denegat. Es requereixen permisos de personal.');
        setError('No tens permisos per accedir a aquesta secció. Es requereixen permisos de staff o admin.');
        setLoading(false);
        return;
      }

      setUser({ ...session.user, role: profile.role, full_name: profile.full_name, email: profile.email });
      setLoading(false);

      // Load data
      loadConfirmedUsers();
    };

    checkAuth();
  }, [navigate]);

  const loadConfirmedUsers = async () => {
    try {
      setError(null);
      console.log('🔍 Loading confirmed beta users...');
      
      // Check if we have a session (for API auth)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Current session:', session ? `User: ${session.user.email}` : 'No session');
      
      if (!session && !env.app.isDevelopment) {
        setError('No tens sessió activa. Torna a iniciar sessió.');
        setUsers([]);
        return;
      }

      const response = await apiGet('/api/admin/beta/confirmed');
      console.log('🔍 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        
        // Try to parse as JSON for better error messages
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorJson.message || errorText;
        } catch {
          // Not JSON, use as-is
        }
        
        // Don't redirect on API errors - just show error message
        // The user is already authenticated, API errors are different from auth errors
        if (response.status === 401) {
          setError('Sessió expirada o no vàlida. Torna a iniciar sessió.');
        } else if (response.status === 403) {
          setError('No tens permisos per accedir a aquesta secció. Contacta amb l\'administrador.');
        } else {
          setError(`Error del servidor (${response.status}): ${errorDetail}`);
        }
        setUsers([]); // Set empty array on error
        return;
      }

      const data = await response.json();
      console.log('✅ Loaded confirmed users:', data.users?.length || 0, 'users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('❌ Exception loading confirmed beta users:', err);
      setError(err.message || 'Error carregant els usuaris confirmats');
      setUsers([]); // Set empty array on error
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ca-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Carregant...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Beta Navigation */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/beta/confirmed"
              className="text-sm font-medium text-gray-900"
            >
              Confirmats
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/beta/candidates"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Candidats
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold font-title text-gray-900 mb-2">
              Beta Testers Confirmats
            </h1>
            <p className="text-gray-600">
              Usuaris amb accés a la beta privada
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Confirmats</p>
            <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
          </div>
        </div>

        {/* Table */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg mb-2">No hi ha usuaris confirmats</p>
            <p className="text-gray-500 text-sm">
              Els usuaris confirmats apareixeran aquí quan se'ls hagi concedit accés a la beta.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preguntes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Accés
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.company || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.questions_used || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.tokens_used || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{formatDate(user.granted_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBetaConfirmedPage;

