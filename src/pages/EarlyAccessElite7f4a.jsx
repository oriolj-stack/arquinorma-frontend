import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Early Access Elite Signup Page
 * 
 * Private beta registration page accessible only via direct URL:
 * /private-beta
 * 
 * This page is NOT linked in navigation - access is by invitation only.
 */

/**
 * Get the API base URL for beta registration
 * In development: uses production Vercel URL (since API is serverless)
 * In production: uses relative URL (works with Vercel)
 */
const getApiBaseUrl = () => {
  // In development, use production URL since API routes are Vercel serverless functions
  if (import.meta.env.DEV) {
    // Use production URL for local development
    // This allows testing the form locally against the deployed API
    return 'https://arquinorma.cat';
  }
  // In production, use relative URL (works with Vercel)
  return '';
};

export default function EarlyAccessElite7f4a() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    role: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear message when user starts typing
    if (msg) setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const formData = {
        email: form.email,
        password: form.password,
        name: form.name,
        company: form.company,
        role: form.role,
        additional_metadata: { notes: form.notes }
      };

      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/api/beta-register`;
      
      console.log('Calling beta-register API:', apiUrl);
      console.log('Form data:', { ...formData, password: '***' }); // Don't log password
      
      let resp;
      try {
        resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          // Don't include credentials for CORS compatibility
          credentials: 'omit'
        });
      } catch (networkError) {
        console.error('Network error:', networkError);
        // Handle network errors (CORS, connection refused, etc.)
        if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
          throw new Error('Error de connexió: No s\'ha pogut connectar amb el servidor. Verifiqueu la vostra connexió a Internet.');
        }
        throw new Error(`Error de xarxa: ${networkError.message}`);
      }

      // Check if response is OK and has content
      if (!resp.ok) {
        // Try to parse error response
        let errorMessage = 'Error del servidor';
        try {
          const errorData = await resp.json();
          errorMessage = errorData.error || errorData.message || `Error ${resp.status}: ${resp.statusText}`;
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = `Error ${resp.status}: ${resp.statusText || 'Error desconegut'}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response
      let data;
      try {
        const text = await resp.text();
        if (!text) {
          throw new Error('Resposta buida del servidor');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Error al processar la resposta del servidor. Si us plau, torneu-ho a provar.');
      }

      // Check response using success field
      if (!data || data.success !== true) {
        throw new Error(data?.error || 'Error desconegut durant el registre');
      }

      // Success
      setMsg({
        type: 'success',
        text: 'Accés concedit! El vostre compte s\'ha creat. Ara podeu iniciar sessió amb les vostres credencials.'
      });

      // Clear form
      setForm({ name: '', email: '', password: '', company: '', role: '', notes: '' });

    } catch (err) {
      console.error('Registration error:', err);
      setMsg({
        type: 'error',
        text: err.message || 'No s\'ha pogut crear el compte. Si us plau, torneu-ho a provar.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-lg w-full">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-cte-primary mb-4">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Accés Exclusiu Anticipat
            </h1>
            <p className="text-gray-600 text-sm">
              Accés beta privat per a professionals seleccionats
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition duration-200"
                placeholder="El vostre nom complet"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correu electrònic <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition duration-200"
                placeholder="el.vostre.correu@exemple.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contrasenya <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition duration-200"
                placeholder="Mínim 6 caràcters"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">Mínim 6 caràcters</p>
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={form.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition duration-200"
                placeholder="La vostra empresa o despatx"
                disabled={loading}
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Càrrec
              </label>
              <input
                id="role"
                name="role"
                type="text"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition duration-200"
                placeholder="p. ex., Arquitecte, Director de projecte"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes addicionals
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition duration-200 resize-none"
                placeholder="Qualsevol informació addicional..."
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !form.email || !form.password || !form.name}
              className="w-full py-3 px-4 bg-cte-primary hover:bg-cte-primary-dark text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cte-primary focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creant compte...
                </span>
              ) : (
                'Sol·licitar accés'
              )}
            </button>
          </form>

          {/* Message Display */}
          {msg && (
            <div className={`mt-6 p-4 rounded-lg ${
              msg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-start">
                {msg.type === 'success' ? (
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{msg.text}</p>
                  {msg.type === 'success' && (
                    <div className="mt-3">
                      <Link
                        to="/login"
                        className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800 underline"
                      >
                        Anar a la pàgina d'inici de sessió →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footnote */}
          <p className="mt-6 text-xs text-center text-gray-500">
            Aquest accés es pot revocar en qualsevol moment.
          </p>
        </div>
      </div>
    </div>
  );
}

