import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import env from '../config/env';
import { toast } from 'sonner';

/**
 * PrivateDocumentUpload Component
 * 
 * Studio-only upload interface for private PDFs
 * Features:
 * - Town selection dropdown
 * - Multi-file upload support
 * - Per-file status tracking
 * - Deterministic success messages (new + duplicate)
 * - Progress indicators
 */
const PrivateDocumentUpload = ({ onUploadComplete }) => {
  const [towns, setTowns] = useState([]);
  const [selectedTown, setSelectedTown] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadStatuses, setUploadStatuses] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [loadingTowns, setLoadingTowns] = useState(true);

  const API_BASE_URL = env.api.baseUrl;

  // Load towns on mount
  useEffect(() => {
    loadTowns();
  }, []);

  /**
   * Load towns from database
   */
  const loadTowns = async () => {
    try {
      setLoadingTowns(true);
      const { data, error } = await supabase
        .from('towns')
        .select('id, name, province')
        .order('name');

      if (error) throw error;

      setTowns(data || []);
      
      // Pre-select Catalunya if exists
      const catalunya = data?.find(t => t.name === 'Catalunya');
      if (catalunya) {
        setSelectedTown(catalunya.id);
      }
    } catch (error) {
      console.error('Error loading towns:', error);
    } finally {
      setLoadingTowns(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length !== selectedFiles.length) {
      toast.error('Només s\'accepten arxius PDF');
    }

    setFiles(pdfFiles);
    
    // Initialize statuses
    const statuses = {};
    pdfFiles.forEach(file => {
      statuses[file.name] = {
        status: 'pending',
        message: 'Esperant...',
        progress: 0
      };
    });
    setUploadStatuses(statuses);
  };

  /**
   * Update status for a specific file
   */
  const updateFileStatus = (fileName, status, message, progress = null) => {
    setUploadStatuses(prev => ({
      ...prev,
      [fileName]: {
        status,
        message,
        progress: progress !== null ? progress : prev[fileName]?.progress || 0
      }
    }));
  };

  /**
   * Upload a single file
   */
  const uploadSingleFile = async (file) => {
    const fileName = file.name;
    
    try {
      // Step 1: Checking document
      updateFileStatus(fileName, 'checking', 'Comprovant document...', 10);
      await sleep(300); // Brief pause for UX

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autenticat');
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('town_id', selectedTown);
      formData.append('title', file.name.replace('.pdf', ''));

      // Step 2: Processing document
      updateFileStatus(fileName, 'processing', 'Processant document...', 40);

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/private-documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      // Step 3: Finalizing
      updateFileStatus(fileName, 'finalizing', 'Finalitzant...', 80);
      await sleep(300);

      if (!response.ok) {
        // Handle specific errors
        if (response.status === 409) {
          // Note: 409 should not occur with new deduplication logic
          // Backend now returns 200 with "already_processed" message
          const errorData = await response.json();
          updateFileStatus(
            fileName, 
            'success', 
            '✓ Document ja processat anteriorment',
            100
          );
          return {
            success: true,
            duplicate: true,
            fileName,
            message: errorData.detail
          };
        } else if (response.status === 403) {
          throw new Error('Accés denegat. Subscripció Studio requerida.');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Error ${response.status}`);
        }
      }

      const result = await response.json();

      // Check if document was already processed
      const isDuplicate = result.message === 'already_processed';

      // Success!
      if (isDuplicate) {
        // Document already existed - show as success
        updateFileStatus(
          fileName,
          'success',
          '✓ Document ja processat anteriorment',
          100
        );
      } else {
        // New document processed successfully
        updateFileStatus(
          fileName,
          'success',
          `✓ Document carregat correctament (${result.pages_processed} pàgines, ${result.chunks_created} fragments)`,
          100
        );
      }

      return {
        success: true,
        duplicate: isDuplicate,
        fileName,
        result
      };

    } catch (error) {
      console.error(`Error uploading ${fileName}:`, error);
      updateFileStatus(fileName, 'error', `✗ Error: ${error.message}`, 0);
      return {
        success: false,
        fileName,
        error: error.message
      };
    }
  };

  /**
   * Upload all selected files
   */
  const handleUpload = async () => {
    if (!selectedTown) {
      toast.error('Selecciona un municipi');
      return;
    }

    if (files.length === 0) {
      toast.error('Selecciona almenys un arxiu PDF');
      return;
    }

    setIsUploading(true);

    try {
      // Upload files sequentially for better UX and status tracking
      const results = [];
      for (const file of files) {
        const result = await uploadSingleFile(file);
        results.push(result);
      }

      // Summary
      const successful = results.filter(r => r.success).length;
      const duplicates = results.filter(r => r.duplicate).length;
      const failed = results.filter(r => !r.success).length;

      console.log('Upload summary:', {
        total: files.length,
        successful,
        duplicates,
        failed
      });

      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete({
          total: files.length,
          successful,
          duplicates,
          failed,
          results
        });
      }

    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clear all files and reset
   */
  const handleClear = () => {
    setFiles([]);
    setUploadStatuses({});
  };

  /**
   * Helper function for delays
   */
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Get status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'checking':
      case 'processing':
      case 'finalizing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'checking':
      case 'processing':
      case 'finalizing':
        return (
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Pujar Documents Privats
      </h2>

      <div className="space-y-4">
        {/* Town Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Municipi
          </label>
          {loadingTowns ? (
            <div className="text-sm text-gray-500">Carregant municipis...</div>
          ) : (
            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecciona un municipi</option>
              {towns.map(town => (
                <option key={town.id} value={town.id}>
                  {town.name} {town.province && `(${town.province})`}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Els documents privats només seran visibles per tu
          </p>
        </div>

        {/* File Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arxius PDF
          </label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* File List with Statuses */}
        {files.length > 0 && (
          <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {files.map(file => {
              const status = uploadStatuses[file.name];
              return (
                <div key={file.name} className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(status?.status || 'pending')}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className={`text-xs ${getStatusColor(status?.status || 'pending')}`}>
                        {status?.message || 'Esperant...'}
                      </p>
                      
                      {/* Progress Bar */}
                      {status?.status !== 'pending' && status?.status !== 'success' && status?.status !== 'error' && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${status?.progress || 0}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* File Size */}
                    <div className="flex-shrink-0 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0 || !selectedTown}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              isUploading || files.length === 0 || !selectedTown
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Pujant...
              </span>
            ) : (
              `Pujar ${files.length} arxiu${files.length !== 1 ? 's' : ''}`
            )}
          </button>

          {files.length > 0 && !isUploading && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              Netejar
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Nota:</strong> Els documents privats es processen automàticament i només tu podràs consultar-los.
          Si un document ja existeix, es mostrarà com a "ja processat" sense tornar-lo a processar.
        </p>
      </div>
    </div>
  );
};

export default PrivateDocumentUpload;

