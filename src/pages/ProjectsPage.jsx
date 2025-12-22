import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import NewProjectModal from '../components/NewProjectModal';
import UpgradeModal from '../components/UpgradeModal';

/**
 * ProjectsPage Component for ArquiNorma
 * 
 * This page displays all architectural projects for the authenticated user.
 * Users can view their projects in a responsive grid layout and create new projects.
 */

const ProjectsPage = () => {
  // Navigation and state management
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Project creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Subscription and quota state
  const [subscription, setSubscription] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Project deletion state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, projectId: null });
  const [deleteModal, setDeleteModal] = useState({ visible: false, project: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Toast notification state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
  

  /**
   * Load subscription quota information
   */
  const loadSubscriptionQuota = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return;
      }

      // Ensure no double slashes
      const baseUrl = env.api.baseUrl?.endsWith('/') ? env.api.baseUrl.slice(0, -1) : env.api.baseUrl;
      const response = await fetch(`${baseUrl}/api/subscriptions/quota`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.quota) {
          setSubscription(data.quota);
        }
      }
    } catch (error) {
      console.error('Error loading subscription quota:', error);
    } finally {
      setQuotaLoading(false);
    }
  };

  /**
   * Load user data from Supabase Auth
   */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error loading user data:', error);
          setError('Error loading user data');
        } else {
          setUser(user);
          await Promise.all([loadProjects(), loadSubscriptionQuota()]);
        }
      } catch (error) {
        console.error('Unexpected error loading user data:', error);
        setError('Unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * Handle ESC key to close context menu
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (contextMenu.visible) {
          setContextMenu({ visible: false, x: 0, y: 0, projectId: null });
        }
        if (deleteModal.visible) {
          setDeleteModal({ visible: false, project: null });
        }
      }
    };

    const handleClickOutside = (event) => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, projectId: null });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible, deleteModal.visible]);

  /**
   * Load projects from Supabase
   */
  const loadProjects = async () => {
    try {
      console.log('Loading projects from Supabase...');
      
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

      console.log('Session found, fetching projects...');
      
      // Query projects from Supabase - RLS policies handle user filtering automatically
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.error('Supabase query error:', projectsError);
        throw new Error(`Failed to load projects: ${projectsError.message}`);
      }
      
      console.log('Projects loaded successfully:', projectsData?.length || 0);
      
      // Transform data to match expected format
      const formattedProjects = (projectsData || []).map(project => ({
        id: project.id,
        title: project.title,
        type: project.project_type || project.type, // Handle both field names
        location: {
          province: project.location_province || project.province,
          city: project.location_city || project.city,
          street: project.location_street || project.street,
          number: project.location_number || project.number
        },
        created_at: project.created_at
      }));
      
      setProjects(formattedProjects);
      console.log('Projects formatted and set:', formattedProjects.length);

    } catch (error) {
      console.error('Error loading projects:', error);
      setError(`Error loading projects: ${error.message}`);
      // Show toast notification instead of crashing
      setToast({
        visible: true,
        message: `Error loading projects: ${error.message}`,
        type: 'error'
      });
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'error' });
      }, 5000);
    }
  };

  /**
   * Handle project card click - navigate to project chat
   */
  const handleProjectClick = (projectId) => {
    // Navigate to project-specific chat page
    navigate(`/projects/${projectId}/chat`);
  };

  /**
   * Handle right-click on project card - show context menu
   */
  const handleProjectRightClick = (event, projectId) => {
    event.preventDefault(); // Prevent browser context menu
    
    // Use absolute screen coordinates for the context menu
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      projectId: projectId
    });
  };

  /**
   * Handle context menu delete option
   */
  const handleContextMenuDelete = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setDeleteModal({ visible: true, project: project });
      setContextMenu({ visible: false, x: 0, y: 0, projectId: null });
    }
  };

  /**
   * Handle project deletion using Supabase client
   */
  const handleDeleteProject = async () => {
    if (!deleteModal.project) return;
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      console.log('Deleting project:', deleteModal.project.id);
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('No active session. Please log in again.');
      }

      console.log('Deleting project from Supabase...');
      console.log('Project ID:', deleteModal.project.id);
      console.log('User ID:', session.user.id);

      // Delete project using Supabase client - RLS policies handle user authorization automatically
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteModal.project.id);

      if (deleteError) {
        console.error('Supabase delete error:', deleteError);
        throw new Error(`Failed to delete project: ${deleteError.message}`);
      }

      console.log('Project deleted successfully from Supabase');
      
      // Optimistic update - remove project from local state immediately
      setProjects(prev => prev.filter(p => p.id !== deleteModal.project.id));
      
      // Close modal
      setDeleteModal({ visible: false, project: null });
      
      // Show success toast
      setToast({
        visible: true,
        message: 'Projecte eliminat correctament',
        type: 'success'
      });
      
      // Auto-hide success toast after 3 seconds
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'success' });
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting project:', error);
      setDeleteError(error.message || 'Error al eliminar el projecte. Torneu-ho a provar.');
      
      // Show error toast
      setToast({
        visible: true,
        message: error.message || 'Error al eliminar el projecte. Torneu-ho a provar.',
        type: 'error'
      });
      
      // Auto-hide error toast after 5 seconds
      setTimeout(() => {
        setToast({ visible: false, message: '', type: 'error' });
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Close delete confirmation modal
   */
  const closeDeleteModal = () => {
    setDeleteModal({ visible: false, project: null });
    setDeleteError('');
  };

  /**
   * Handle new project creation modal with quota check
   */
  const handleNewProject = () => {
    // Check quota if subscription info is loaded
    if (subscription && !quotaLoading) {
      const projectsQuota = subscription.projects;
      // Beta users have unlimited access - always allow
      const isBeta = subscription.tier === 'beta';
      const canCreate = isBeta || projectsQuota.unlimited || 
        (projectsQuota.used < projectsQuota.limit);
      
      if (!canCreate) {
        // Show upgrade modal
        setShowUpgradeModal(true);
        return;
      }
    }
    
    // If quota check passes or not loaded yet, open modal
    setIsModalOpen(true);
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setIsModalOpen(false);
  };

  /**
   * Handle successful project creation
   */
  const handleProjectCreated = async (newProject) => {
    console.log('Project created successfully:', newProject);
    // Refresh the projects list to show the new project
    await loadProjects();
  };

  /**
   * Handle success toast notification
   */
  const handleSuccess = (message) => {
    setToast({
      visible: true,
      message: message,
      type: 'success'
    });
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'error' });
    }, 3000);
  };

  /**
   * Handle error toast notification
   */
  const handleError = (message) => {
    setToast({
      visible: true,
      message: message,
      type: 'error'
    });
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'error' });
    }, 5000);
  };

  /**
   * Format creation date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  /**
   * Format project type for display
   */
  const formatProjectType = (type) => {
    const typeMap = {
      'Habitatge': 'Habitatge',
      'Equipament': 'Equipament',
      'Unifamiliar': 'Unifamiliar',
      'Paisatge': 'Paisatge',
      'Industrial': 'Industrial',
      'Comercial': 'Comercial',
      'Other': 'Altres'
    };
    return typeMap[type] || type;
  };

  /**
   * Loading state display
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cte-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state display
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Projects</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Main projects page
   */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Projectes</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Quota indicator */}
              {subscription && !quotaLoading && (
                <div className="text-sm text-gray-600">
                  {subscription.tier === 'beta' ? (
                    <span className="text-purple-600 font-medium">Beta Tester - Unlimited</span>
                  ) : subscription.projects.unlimited ? (
                    <span className="text-green-600">Unlimited projects</span>
                  ) : (
                    <span>
                      {subscription.projects.used} / {subscription.projects.limit} projects
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={handleNewProject}
                disabled={subscription && !quotaLoading && subscription.tier !== 'beta' && !subscription.projects.unlimited && subscription.projects.used >= subscription.projects.limit}
                className="bg-cte-primary hover:bg-cte-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Projecte nou
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first architectural project.</p>
            <button
              onClick={handleNewProject}
              className="bg-cte-primary hover:bg-cte-primary-dark text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center mx-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Crea el teu primer projecte
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                onContextMenu={(e) => handleProjectRightClick(e, project.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-cte-primary hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative"
              >
                {/* Project Header with Date */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1 leading-tight group-hover:text-cte-primary transition-colors duration-200">
                        {project.title}
                      </h3>
                      <p className="text-sm font-medium text-cte-primary group-hover:text-cte-primary-dark transition-colors duration-200">
                        {formatProjectType(project.type)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatDate(project.created_at)}
                    </span>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{project.location.city}, {project.location.province}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      <span>{project.location.street}, {project.location.number}</span>
                    </div>
                  </div>
                </div>

                {/* Project Footer removed intentionally for a cleaner UI - cards remain fully clickable */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleContextMenuDelete(contextMenu.projectId)}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Eliminar
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Eliminar projecte</h2>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={isDeleting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Error Message */}
              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-sm text-red-800">{deleteError}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Segur que voleu eliminar aquest projecte?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Aquesta acció no es pot desfer. S'eliminarà permanentment el projecte:
                  </p>
                  <div className="bg-gray-50 rounded-md p-3 mb-4">
                    <p className="font-medium text-gray-900">{deleteModal.project?.title}</p>
                    <p className="text-sm text-gray-600">{deleteModal.project?.type} - {deleteModal.project?.location?.city}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                disabled={isDeleting}
              >
                Cancel·lar
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminant...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Creation Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onProjectCreated={handleProjectCreated}
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tier="pro"
        feature="unlimited projects"
        currentTier={subscription?.tier || 'free'}
        quotaInfo={subscription ? {
          projects: {
            used: subscription.projects.used,
            limit: subscription.projects.limit
          }
        } : null}
      />

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`rounded-lg shadow-lg p-4 flex items-center ${
            toast.type === 'error' 
              ? 'bg-red-50 border border-red-200 text-red-800' 
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            <div className="flex-shrink-0">
              {toast.type === 'error' ? (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setToast({ visible: false, message: '', type: 'error' })}
                className={`inline-flex rounded-md p-1.5 ${
                  toast.type === 'error' 
                    ? 'text-red-400 hover:text-red-600 hover:bg-red-100' 
                    : 'text-green-400 hover:text-green-600 hover:bg-green-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;