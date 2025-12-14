import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { env } from '../../config/env';

/**
 * Shared Admin Header Component
 * 
 * Provides consistent navigation across all admin pages.
 * Includes tabs for: Pujar Documents, Gestionar Municipis, Llista d'Espera, Beta
 */
const AdminHeader = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (confirm('Estàs segur que vols tancar la sessió?')) {
      // Clear development user if in dev mode
      if (env.app.isDevelopment) {
        localStorage.removeItem('dev_staff_user');
      } else {
        await supabase.auth.signOut();
      }
      navigate('/staff/login');
    }
  };

  const getTabClasses = (path) => {
    const isActive = location.pathname === path || 
                     (path === '/admin/list' && location.pathname === '/admin') ||
                     (path.startsWith('/admin/beta') && location.pathname.startsWith('/admin/beta'));
    
    if (isActive) {
      return 'bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200';
    }
    return 'text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Portal del Personal ArquiNorma</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-4">
              <button
                onClick={() => navigate('/admin/upload')}
                className={getTabClasses('/admin/upload')}
              >
                Pujar Documents
              </button>
              <button
                onClick={() => navigate('/admin/list')}
                className={getTabClasses('/admin/list')}
              >
                Gestionar Municipis
              </button>
              <button
                onClick={() => navigate('/admin/waiting-list')}
                className={getTabClasses('/admin/waiting-list')}
              >
                Llista d'Espera
              </button>
              <button
                onClick={() => navigate('/admin/beta/candidates')}
                className={getTabClasses('/admin/beta')}
              >
                Beta
              </button>
            </nav>

            <div className="text-sm text-gray-600">
              <span className="font-medium">{user?.full_name || user?.email}</span>
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {user?.role}
              </span>
              {env.app.isDevelopment && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  DEV
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;

