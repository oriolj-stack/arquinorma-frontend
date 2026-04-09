import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Introduïu una adreça de correu electrònic vàlida.");
      setLoading(false);
      return;
    }

    try {
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          // Supabase will append the recovery token to this URL
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (sbError) {
        setError(`No s'ha pogut enviar el correu: ${sbError.message}`);
      } else {
        setSent(true);
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
            Recuperar contrasenya
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Introduïu el vostre correu i us enviarem un enllaç per restablir la contrasenya.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg space-y-6">
          {/* Success state */}
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Correu enviat</h3>
              <p className="text-sm text-gray-600">
                Si hi ha un compte associat a <strong>{email}</strong>, rebreu un correu amb
                l'enllaç per restablir la contrasenya. Reviseu també la carpeta de correu no desitjat.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 text-sm font-medium text-cte-primary hover:text-cte-primary-dark transition duration-200"
              >
                ← Tornar a l'inici de sessió
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adreça de correu electrònic
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                  placeholder="el-vostre@correu.com"
                  disabled={loading}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cte-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviant…
                  </span>
                ) : (
                  'Enviar enllaç de recuperació'
                )}
              </button>

              <p className="text-center text-sm text-gray-600">
                Recordeu la contrasenya?{' '}
                <Link to="/login" className="font-medium text-cte-primary hover:text-cte-primary-dark transition duration-200">
                  Iniciar sessió
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
