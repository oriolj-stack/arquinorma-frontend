import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import { apiGet, apiPost } from '../services/api';
import AdminHeader from '../components/Admin/AdminHeader';

/**
 * Admin Beta Candidates Page
 * 
 * Displays beta candidates from beta_testers table.
 * Allows sending beta and early access invitations.
 * Clean, professional table UI for architects.
 */

const AdminBetaCandidatesPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

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
          loadCandidates();
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
          loadCandidates();
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
      loadCandidates();
    };

    checkAuth();
  }, [navigate]);

  const loadCandidates = async () => {
    try {
      setError(null);
      console.log('🔍 Loading beta candidates...');
      
      // Check if we have a session (for API auth)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 Current session:', session ? `User: ${session.user.email}` : 'No session');
      
      if (!session && !env.app.isDevelopment) {
        setError('No tens sessió activa. Torna a iniciar sessió.');
        setCandidates([]);
        return;
      }

      const response = await apiGet('/api/admin/beta/candidates');
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
        setCandidates([]); // Set empty array on error
        return;
      }

      const data = await response.json();
      console.log('✅ Loaded candidates:', data.candidates?.length || 0, 'candidates');
      setCandidates(data.candidates || []);
    } catch (err) {
      console.error('❌ Exception loading beta candidates:', err);
      setError(err.message || 'Error carregant els candidats');
      setCandidates([]); // Set empty array on error
    }
  };

  const sendBetaInvite = async (email) => {
    try {
      setSendingInvite({ email, type: 'beta' });
      setMessage({ type: '', text: '' });

      const response = await apiPost('/api/admin/beta/send-beta-invite', { email });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconegut' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      showMessage('success', `Invite beta enviat a ${email}`);
      loadCandidates(); // Reload to update status
    } catch (err) {
      console.error('Error sending beta invite:', err);
      showMessage('error', err.message || 'Error enviant la invitació');
    } finally {
      setSendingInvite(null);
    }
  };

  const sendEarlyAccessInvite = async (email) => {
    try {
      setSendingInvite({ email, type: 'early' });
      setMessage({ type: '', text: '' });

      const response = await apiPost('/api/admin/beta/send-early-access', { email });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconegut' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      showMessage('success', `Invite d'accés anticipat enviat a ${email}`);
      loadCandidates(); // Reload to update status
    } catch (err) {
      console.error('Error sending early access invite:', err);
      showMessage('error', err.message || 'Error enviant la invitació');
    } finally {
      setSendingInvite(null);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
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

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader user={user} />
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
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Confirmats
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/beta/candidates"
              className="text-sm font-medium text-gray-900"
            >
              Candidats
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold font-title text-gray-900 mb-2">
              Candidats Beta
            </h1>
            <p className="text-gray-600">
              Gestió de candidats per a la beta privada
            </p>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p>{message.text}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Candidats</p>
            <p className="text-2xl font-semibold text-gray-900">{candidates.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Invitats a Beta</p>
            <p className="text-2xl font-semibold text-gray-900">
              {candidates.filter(c => c.invited_to_beta).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Accés Anticipat</p>
            <p className="text-2xl font-semibold text-gray-900">
              {candidates.filter(c => c.invited_to_early_access).length}
            </p>
          </div>
        </div>

        {/* Table */}
        {candidates.length === 0 ? (
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
            <p className="text-gray-600 text-lg mb-2">No hi ha candidats</p>
            <p className="text-gray-500 text-sm">
              Els candidats que es registrin a través del formulari apareixeran aquí.
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
                      Data Registre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invitat a Beta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accés Anticipat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidates.map((candidate) => {
                    const isSending = sendingInvite?.email === candidate.email;
                    const isSendingBeta = isSending && sendingInvite?.type === 'beta';
                    const isSendingEarly = isSending && sendingInvite?.type === 'early';

                    return (
                      <tr key={candidate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{candidate.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(candidate.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {candidate.invited_to_beta ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {candidate.invited_to_early_access ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sí
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {!candidate.invited_to_beta && (
                              <button
                                onClick={() => sendBetaInvite(candidate.email)}
                                disabled={isSending}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSendingBeta ? 'Enviant...' : 'Invitar Beta'}
                              </button>
                            )}
                            {!candidate.invited_to_early_access && (
                              <button
                                onClick={() => sendEarlyAccessInvite(candidate.email)}
                                disabled={isSending}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSendingEarly ? 'Enviant...' : 'Accés Anticipat'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBetaCandidatesPage;

