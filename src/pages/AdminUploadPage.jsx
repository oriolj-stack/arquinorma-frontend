import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import AdminHeader from '../components/Admin/AdminHeader';

/**
 * AdminUploadPage Component - PDF upload interface for staff/admin users
 */
const AdminUploadPage = () => {
  // Form state management
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check for development user first
      if (env.app.isDevelopment) {
        console.log('Checking for development user...');
        const devUser = localStorage.getItem('dev_staff_user');
        if (devUser) {
          console.log('Development user found:', devUser);
          const parsedUser = JSON.parse(devUser);
          setUser(parsedUser);
          return;
        } else {
          console.log('No development user found, redirecting to login');
          navigate('/staff/login');
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

      if (profileError || !['staff', 'admin', 'super_admin'].includes(profile?.role?.toLowerCase())) {
        setError('Accés denegat. Es requereixen permisos de personal.');
        setTimeout(() => navigate('/staff/login'), 2000);
        return;
      }

      setUser({ ...session.user, role: profile.role, full_name: profile.full_name });
    };

    checkAuth();
  }, [navigate]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  /**
   * Handles file selection and validation
   */
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    setSuccess('');
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
        setError('Si us plau, selecciona només un fitxer PDF.');
      setFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setError('La mida del fitxer ha de ser inferior a 10MB.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    
    // Auto-generate title from filename if not set
    if (!title) {
      const fileName = selectedFile.name.replace(/\.pdf$/i, '');
      setTitle(fileName);
    }
  };

  /**
   * Handles PDF upload to backend
   */
  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Si us plau, selecciona un fitxer PDF per pujar.');
      return;
    }

    if (!user) {
      setError('Es requereix autenticació. Si us plau, torna a iniciar sessió.');
      navigate('/staff/login');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      let authToken = null;

      // Get authentication token
      if (env.app.isDevelopment && localStorage.getItem('dev_staff_user')) {
        // Use development token
        authToken = 'staff_dev_token_123';
        console.log('Using development token for upload:', authToken);
      } else {
        // Get current session token
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token;
        console.log('Using Supabase token for upload');
      }
      
      if (!authToken) {
        throw new Error('No hi ha cap token d\'autenticació vàlid');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (category) formData.append('category', category);

      console.log('Uploading to backend:', env.api.baseUrl);
      console.log('Auth token (first 20 chars):', authToken.substring(0, 20) + '...');

      // Upload to backend
      const response = await fetch(`${env.api.baseUrl}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok) {
        throw new Error(result.detail || `La pujada ha fallat: ${response.status}`);
      }

      // Success
      setSuccess(
        `✅ Upload successful! 
        📄 Document: ${result.document_title}
        📊 Pages processed: ${result.pages_processed}
        �� Embeddings generated: ${result.embeddings_generated}
        ⏱️ Processing time: ${result.processing_time_seconds.toFixed(2)}s`
      );

      // Reset form
      setFile(null);
      setTitle('');
      setCategory('');
      
      // Reset file input
      const fileInput = document.getElementById('pdf-file');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      
      let errorMessage = 'La pujada ha fallat. ';
      
      if (err.message.includes('401')) {
        errorMessage += 'L\'autenticació ha fallat. Si us plau, torna a iniciar sessió.';
        setTimeout(() => navigate('/staff/login'), 2000);
      } else if (err.message.includes('403')) {
        errorMessage += 'Accés denegat. Es requereixen permisos de personal.';
      } else if (err.message.includes('400')) {
        errorMessage += 'Fitxer o sol·licitud no vàlids. Si us plau, verifica el teu fitxer PDF.';
      } else if (err.message.includes('500')) {
        errorMessage += 'Error del servidor. Si us plau, torna-ho a provar més tard.';
      } else {
        errorMessage += err.message || 'Si us plau, torna-ho a provar.';
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };


  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregant Portal del Personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <AdminHeader user={user} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Page Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pujar Document PDF</h2>
            <p className="mt-1 text-sm text-gray-600">
              Puja documents PDF per fer-los disponibles per al chatbot d'ArquiNorma. 
              Els documents es processaran i indexaran automàticament.
            </p>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="p-6 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                <div className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <pre className="whitespace-pre-line font-mono text-xs">{success}</pre>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <div className="flex items-start">
                  <svg className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700 mb-2">
                Fitxer PDF *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-amber-400 transition duration-200">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="pdf-file" className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500">
                      <span>Puja un fitxer PDF</span>
                      <input
                        id="pdf-file"
                        name="pdf-file"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={handleFileSelect}
                        disabled={uploading}
                      />
                    </label>
                    <p className="pl-1">o arrossega i deixa anar</p>
                  </div>
                  <p className="text-xs text-gray-500">Fitxers PDF fins a 10MB</p>
                  {file && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Títol del Document
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200"
                placeholder="Introdueix el títol del document (s'omple automàticament des del nom del fitxer)"
                disabled={uploading}
              />
              <p className="mt-1 text-xs text-gray-500">Opcional - s'utilitzarà el nom del fitxer si no es proporciona</p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200"
                disabled={uploading}
              >
                <option value="">Selecciona categoria (opcional)</option>
                <option value="building-codes">Codi de l'Edificació</option>
                <option value="regulations">Reglaments</option>
                <option value="standards">Normes</option>
                <option value="guidelines">Directrius</option>
                <option value="specifications">Especificacions Tècniques</option>
                <option value="other">Altres</option>
              </select>
            </div>

            {/* Upload Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={!file || uploading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processant Document...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    Pujar Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Com Funciona el Processament de Documents</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">�� Passos de Processament:</h4>
              <ul className="space-y-1">
                <li>• Validació PDF i pujada a Supabase Storage</li>
                <li>• Extracció de text de cada pàgina</li>
                <li>• Fragmentació del contingut per un processament òptim</li>
                <li>• Generació d'embeddings d'IA amb OpenAI</li>
                <li>• Emmagatzematge a base de dades vectorial per consultes del chatbot</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✅ Requisits:</h4>
              <ul className="space-y-1">
                <li>• Només format PDF</li>
                <li>• Mida màxima del fitxer: 10MB</li>
                <li>• PDFs basats en text (no imatges escanejades)</li>
                <li>• Es requereixen permisos de personal o administrador</li>
                <li>• Token d'autenticació vàlid</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUploadPage;
