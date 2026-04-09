import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/**
 * ResetPasswordPage
 *
 * Handles the second half of the Supabase password-reset flow.
 * Supabase emails the user a link that redirects to this page
 * with a recovery token embedded in the URL hash fragment.
 * The Supabase client automatically detects and exchanges this token,
 * firing a PASSWORD_RECOVERY auth state event.
 *
 * Flow:
 *  1. User lands here from the reset email link.
 *  2. supabase.auth.onAuthStateChange fires with event = 'PASSWORD_RECOVERY'.
 *  3. We show the new-password form.
 *  4. On submit, supabase.auth.updateUser({ password }) sets the new password.
 *  5. Redirect to /login with a success message.
 */
const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);   // true once Supabase validates the token
  const [tokenError, setTokenError] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event.
    // Supabase processes the hash token automatically when the page loads.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
        }
        if (event === 'SIGNED_IN' && ready) {
          // Token already processed — keep ready state
        }
      }
    );

    // Fallback: if there is already a session (user navigated here while logged in
    // AND there is a recovery token in the hash), Supabase may already have exchanged
    // the token before the listener was attached.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // If neither fires within 5 s the token is probably missing / expired.
    const timeout = setTimeout(() => {
      setReady((r) => {
        if (!r) setTokenError(true);
        return r;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contrasenya ha de tenir almenys 8 caràcters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les contrasenyes no coincideixen.');
      return;
    }

    setLoading(true);
    try {
      const { error: sbError } = await supabase.auth.updateUser({ password });
      if (sbError) {
        setError(`No s'ha pogut actualitzar la contrasenya: ${sbError.message}`);
      } else {
        setSuccess(true);
        // Give the user 2 s to read the success message before redirecting
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    } catch (err) {
      setError('S\'ha produït un error inesperat. Si us plau, torneu-ho a provar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link
            to="/"
            className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-cte-primary hover:bg-cte-primary-dark transition duration-200 cursor-pointer inline-block"
            title="Tornar a la pàgina principal"
          >
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Nova contrasenya
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Introduïu la nova contrasenya per al vostre compte.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">

          {/* ── Token expired / missing ── */}
          {tokenError && !ready && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Enllaç no vàlid o caducat</h3>
              <p className="text-sm text-gray-600">
                L'enllaç de recuperació ha expirat o ja s'ha usat. Sol·liciteu un de nou.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block mt-2 px-4 py-2 text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark rounded-md transition duration-200"
              >
                Sol·licitar nou enllaç
              </Link>
            </div>
          )}

          {/* ── Waiting for Supabase to validate token ── */}
          {!tokenError && !ready && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <svg className="animate-spin h-8 w-8 text-cte-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-500">Verificant l'enllaç…</p>
            </div>
          )}

          {/* ── Success ── */}
          {success && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contrasenya actualitzada</h3>
              <p className="text-sm text-gray-600">
                La vostra contrasenya s'ha canviat correctament. Us redirigim a l'inici de sessió…
              </p>
            </div>
          )}

          {/* ── New password form ── */}
          {ready && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nova contrasenya
                  <span className="text-xs text-gray-400 ml-1">(mínim 8 caràcters)</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                  placeholder="Nova contrasenya"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmeu la contrasenya
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                  placeholder="Repetiu la contrasenya"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cte-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Actualitzant…
                  </span>
                ) : (
                  'Establir nova contrasenya'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
