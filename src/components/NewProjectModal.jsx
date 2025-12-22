import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * NewProjectModal Component for ArquiNorma
 * 
 * This modal handles the creation of new architectural projects.
 * It provides a form with validation and integrates with Supabase for data persistence.
 * 
 * Features:
 * - Form validation for all required fields
 * - Supabase integration for project creation
 * - Success/error toast notifications
 * - Responsive design with TailwindCSS
 * - Catalan language support
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {Function} props.onProjectCreated - Function to call after successful project creation
 * @param {Function} props.onError - Function to call when an error occurs (for toast notifications)
 * @param {Function} props.onSuccess - Function to call when operation succeeds (for toast notifications)
 */
const NewProjectModal = ({ isOpen, onClose, onProjectCreated, onError, onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    province: '',
    street: '',
    number: '',
    town: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Loading and feedback states
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  
  // Towns data
  const [towns, setTowns] = useState([]);
  const [loadingTowns, setLoadingTowns] = useState(false);

  /**
   * Reset form when modal opens/closes
   */
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        title: '',
        type: '',
        province: '',
        street: '',
        number: '',
        town: ''
      });
      setFormErrors({});
      setCreateError('');
      setCreateSuccess('');
      
      // Load towns when modal opens
      loadTowns();
    }
  }, [isOpen]);

  /**
   * Handle ESC key to close modal
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isCreating) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isCreating]);

  /**
   * Load towns from the API
   */
  const loadTowns = async () => {
    setLoadingTowns(true);
    try {
      // Use backend API URL
      const baseUrl = env.api.baseUrl?.endsWith('/') ? env.api.baseUrl.slice(0, -1) : env.api.baseUrl;
      const url = `${baseUrl}/api/towns`;
      console.log('Loading towns from URL:', url);
      console.log('env.api.baseUrl:', env.api.baseUrl);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load towns: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Sort towns alphabetically by name
      const sortedTowns = (data.towns || []).sort((a, b) => {
        return a.name.localeCompare(b.name, 'ca', { numeric: true });
      });
      
      setTowns(sortedTowns);
      console.log(`Loaded ${sortedTowns.length} towns successfully`);
    } catch (error) {
      console.error('Error loading towns:', error);
      setTowns([]);
    } finally {
      setLoadingTowns(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If town is selected, automatically fill province
    if (field === 'town' && value) {
      const selectedTown = towns.find(t => t.name === value);
      if (selectedTown && selectedTown.province) {
        setFormData(prev => ({
          ...prev,
          town: value,
          province: selectedTown.province
        }));
      }
    }
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      errors.title = 'El títol és obligatori';
    } else if (formData.title.trim().length < 2) {
      errors.title = 'El títol ha de tenir almenys 2 caràcters';
    } else if (formData.title.trim().length > 200) {
      errors.title = 'El títol ha de tenir menys de 200 caràcters';
    }
    
    // Type validation
    if (!formData.type) {
      errors.type = 'El tipus de projecte és obligatori';
    }
    
    // Location validation
    if (!formData.province.trim()) {
      errors.province = 'La província és obligatòria';
    }
    
    if (!formData.street.trim()) {
      errors.street = 'El carrer és obligatori';
    }
    
    if (!formData.number.trim()) {
      errors.number = 'El número és obligatori';
    }
    
    // Town validation
    if (!formData.town) {
      errors.town = 'El municipi és obligatori';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission - Create new project in Supabase
   */
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsCreating(true);
    setCreateError('');
    setCreateSuccess('');
    
    try {
      console.log('Creating project in Supabase...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('No active session. Please log in again.');
      }

      // Prepare project data for Supabase
      // Note: Town name is stored as-is (display format)
      // Backend will normalize it to canonical format for storage/retrieval operations
      const projectData = {
        user_id: session.user.id,
        title: formData.title.trim(),
        type: formData.type,
        location_province: formData.province.trim(),
        location_city: formData.town.trim(),
        location_street: formData.street.trim(),
        location_number: formData.number.trim(),
        town: formData.town
      };

      console.log('Project data:', projectData);

      // Insert project into Supabase
      const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(`Failed to create project: ${insertError.message}`);
      }

      console.log('Project created successfully:', newProject);

      // Show success message
      setCreateSuccess('Projecte creat correctament');
      
      // Call success callback for toast notification
      if (onSuccess) {
        onSuccess('Projecte creat correctament');
      }
      
      // Call project created callback to refresh the project list
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      // Close modal after a brief delay
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage = `Error creating project: ${error.message}`;
      setCreateError(errorMessage);
      
      // Call error callback for toast notification
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Close modal and reset form
   */
  const handleClose = () => {
    if (isCreating) return; // Prevent closing while creating
    
    setFormData({
      title: '',
      type: '',
      province: '',
      street: '',
      number: '',
      town: ''
    });
    setFormErrors({});
    setCreateError('');
    setCreateSuccess('');
    onClose();
  };

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Crear nou projecte</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            disabled={isCreating}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {createSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-sm text-green-800">{createSuccess}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm text-red-800">{createError}</span>
              </div>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Títol del projecte *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Introduïu el títol del projecte"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition-colors duration-200 ${
                formErrors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isCreating}
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
            )}
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipus de projecte *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition-colors duration-200 ${
                formErrors.type ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isCreating}
            >
              <option value="">Seleccioneu el tipus de projecte</option>
              <option value="Habitatge">Habitatge</option>
              <option value="Equipament">Equipament</option>
              <option value="Unifamiliar">Unifamiliar</option>
              <option value="Paisatge">Paisatge</option>
              <option value="Comercial">Comercial</option>
              <option value="Oficines">Oficines</option>
              <option value="Urbà">Urbà</option>
              <option value="Rehabilitació">Rehabilitació</option>
            </select>
            {formErrors.type && (
              <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
            )}
          </div>

          {/* Town Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Municipi *
            </label>
            <select
              value={formData.town}
              onChange={(e) => handleInputChange('town', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition-colors duration-200 ${
                formErrors.town ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isCreating || loadingTowns}
            >
              <option value="">
                {loadingTowns ? 'Carregant municipis...' : 'Seleccioneu el municipi'}
              </option>
              {towns.map((town) => (
                <option key={town.name} value={town.name}>
                  {town.name}
                </option>
              ))}
            </select>
            {formErrors.town && (
              <p className="mt-1 text-sm text-red-600">{formErrors.town}</p>
            )}
            {!loadingTowns && towns.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                No s'han pogut carregar els municipis. Intenteu-ho més tard.
              </p>
            )}
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informació de localització</h3>
            
            {/* Province */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Província *
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                placeholder="p. ex., Barcelona, Girona"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition-colors duration-200 ${
                  formErrors.province ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isCreating}
              />
              {formErrors.province && (
                <p className="mt-1 text-sm text-red-600">{formErrors.province}</p>
              )}
            </div>

            {/* Street and Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carrer *
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Nom del carrer"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition-colors duration-200 ${
                    formErrors.street ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isCreating}
                />
                {formErrors.street && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.street}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  placeholder="123"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-transparent transition-colors duration-200 ${
                    formErrors.number ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isCreating}
                />
                {formErrors.number && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.number}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            disabled={isCreating}
          >
            Cancel·lar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-white bg-cte-primary hover:bg-cte-primary-dark rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creant...
              </>
            ) : (
              'Crear'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;


