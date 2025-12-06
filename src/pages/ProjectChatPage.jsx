import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProjectChat from '../components/ProjectChat';

/**
 * ProjectChatPage Component for ArquiNorma
 * 
 * This page handles chat conversations within a specific project context.
 * Uses the ProjectChat component for persistent messaging with the backend.
 */

const ProjectChatPage = () => {
  // URL parameters
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [project, setProject] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load project data from Supabase
   */
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoadingProject(true);
        
        // Fetch real project data from Supabase
        console.log('Loading project data for ID:', projectId);
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) {
          console.error('Error loading project:', projectError);
          setError('Project not found');
          return;
        }

        console.log('Raw project data from Supabase:', projectData);
        // Format the project data to match expected structure
        const formattedProject = {
          id: projectData.id,
          title: projectData.title,
          type: projectData.project_type || projectData.type,
          location: {
            province: projectData.location_province || projectData.location?.province,
            city: projectData.location_city || projectData.location?.city,
            street: projectData.location_street || projectData.location?.street,
            number: projectData.location_number || projectData.location?.number
          },
          status: projectData.status || 'active',
          created_at: projectData.created_at
        };
        console.log('Formatted project data:', formattedProject);
        setProject(formattedProject);

      } catch (error) {
        console.error('Error loading project:', error);
        setError(error.message || 'Error loading project');
      } finally {
        setIsLoadingProject(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cte-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregant projecte...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error carregant el projecte</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-cte-primary hover:bg-cte-primary-dark text-white px-4 py-2 rounded-md transition-colors duration-200"
          >
            Tornar als projectes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Project Info */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/projects')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project?.title}</h1>
                <p className="text-sm text-gray-600">
                  {project?.type} • {project?.location?.city}, {project?.location?.province}
                </p>
              </div>
            </div>

            {/* Project Actions */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500">
                {project?.status === 'active' ? 'Actiu' : project?.status}
              </span>
              <button
                onClick={() => navigate('/projects')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                Guardar i sortir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container - Use the persistent ProjectChat component */}
      <div className="flex-1">
        <ProjectChat projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectChatPage;