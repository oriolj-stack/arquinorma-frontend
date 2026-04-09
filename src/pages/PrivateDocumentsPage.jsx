import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import env from '../config/env';
import PrivateDocumentUpload from '../components/PrivateDocumentUpload';
import { toast } from 'sonner';

/**
 * PrivateDocumentsPage Component
 * 
 * Studio-only page for managing private PDF documents
 * Features:
 * - Upload new private documents
 * - View all uploaded private documents
 * - Delete private documents
 * - Document status tracking
 */
const PrivateDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  const API_BASE_URL = env.api.baseUrl;

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  /**
   * Load user's private documents
   */
  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autenticat');
      }

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/private-documents/`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accés denegat. Subscripció Studio requerida.');
        }
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle upload completion
   */
  const handleUploadComplete = (summary) => {
    console.log('Upload complete:', summary);
    
    // Show success message
    let message = '';
    if (summary.successful > 0) {
      message = `✓ ${summary.successful} document${summary.successful !== 1 ? 's' : ''} processat${summary.successful !== 1 ? 's' : ''} correctament`;
      if (summary.duplicates > 0) {
        message += ` (${summary.duplicates} ja existien)`;
      }
    }
    if (summary.failed > 0) {
      message += ` ${summary.failed} error${summary.failed !== 1 ? 's' : ''}`;
    }
    
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);

    // Reload document list
    loadDocuments();
  };

  /**
   * Delete a document
   */
  const handleDelete = async (documentId, title) => {
    if (!confirm(`Estàs segur que vols eliminar "${title}"?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autenticat');
      }

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/private-documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      toast.success('Document eliminat correctament');

      // Reload list
      loadDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error(`Error eliminant el document: ${err.message}`);
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('ca-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Format file size
   */
  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status) => {
    const badges = {
      'completed': <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completat</span>,
      'processing': <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Processant</span>,
      'failed': <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Error</span>,
      'pending': <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pendent</span>
    };
    return badges[status] || <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Documents Privats
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gestiona els teus documents PDF privats. Només tu pots veure i consultar aquests documents.
          </p>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8">
            <PrivateDocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Els Meus Documents
            </h2>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showUpload ? 'Amagar Pujada' : 'Pujar Document'}
            </button>
          </div>

          {/* Loading State — skeleton rows */}
          {loading && (
            <div className="divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-red-600">{error}</p>
              <button
                onClick={loadDocuments}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Tornar a intentar
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && documents.length === 0 && (
            <div className="p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Cap document encara
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Comença pujant el teu primer document PDF privat.
              </p>
              {!showUpload && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Pujar Document
                </button>
              )}
            </div>
          )}

          {/* Documents Table */}
          {!loading && !error && documents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pàgines / Fragments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <svg className="h-8 w-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {doc.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {doc.storage_path}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.total_pages || 0} / {doc.total_chunks || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatSize(doc.file_size_bytes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && !error && documents.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Total: <span className="font-medium">{documents.length}</span> document{documents.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Sobre els Documents Privats
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Els documents privats només són visibles i consultables per tu</li>
                  <li>Es processen automàticament (extracció, fragmentació i indexació)</li>
                  <li>Pots enllaçar-los a un municipi per a millor organització</li>
                  <li>Si puges un document duplicat, es detecta automàticament</li>
                  <li>Aquesta funcionalitat requereix subscripció Studio</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateDocumentsPage;

