import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

// Use the centralized API base URL from env config
const API_BASE = env.api.baseUrl;

/**
 * AdminListPage Component - Towns management interface for staff/admin users
 */
const AdminListPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [municipis, setMunicipis] = useState([]);
  const [municipisLoading, setMunicipisLoading] = useState(true);
  const [municipisError, setMunicipisError] = useState(null);
  const [filteredMunicipis, setFilteredMunicipis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComarca, setSelectedComarca] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [paginatedMunicipis, setPaginatedMunicipis] = useState([]);
  
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
          setLoading(false);
          return;
        } else {
          console.log('No development user found, setting up default dev user');
          // Set up a default development user
          const defaultDevUser = {
            id: 'dev_staff_1',
            email: 'staff@arquinorma.dev',
            role: 'staff',
            full_name: 'Staff User'
          };
          localStorage.setItem('dev_staff_user', JSON.stringify(defaultDevUser));
          setUser(defaultDevUser);
          setLoading(false);
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
        .from('users')
        .select('role, email, full_name')
        .eq('id', session.user.id)
        .single();

      if (profileError || !['staff', 'admin', 'super_admin'].includes(profile?.role?.toLowerCase())) {
        console.error('Accés denegat. Es requereixen permisos de personal.');
        setTimeout(() => navigate('/staff/login'), 2000);
        return;
      }

      setUser({ ...session.user, role: profile.role, full_name: profile.full_name });
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Load towns data from Supabase
  useEffect(() => {
    const loadTowns = async () => {
      try {
        setMunicipisLoading(true);
        setMunicipisError(null);
        console.log('Loading towns from:', `${API_BASE}/api/towns`);
        const response = await fetch(`${API_BASE}/api/towns`);
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success && data.towns) {
          setMunicipis(data.towns);
          setFilteredMunicipis(data.towns);
          console.log(`Loaded ${data.count} towns from Supabase`);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error loading towns from Supabase:', error);
        setMunicipisError(`Error al carregar municipis: ${error.message}`);
        // Fallback to empty array if API fails
        setMunicipis([]);
        setFilteredMunicipis([]);
      } finally {
        setMunicipisLoading(false);
      }
    };

    if (!loading) {
      console.log('Starting to load towns, loading state:', loading);
      loadTowns();
    }
  }, [loading]);

  // Filter and sort towns based on search term, selected province, and sorting
  useEffect(() => {
    let filtered = municipis;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(town => 
        town.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        town.province.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by comarca
    if (selectedComarca) {
      filtered = filtered.filter(town => 
        town.province === selectedComarca
      );
    }

    // Filter by region
    if (selectedRegion) {
      filtered = filtered.filter(town => 
        getRegionFromComarca(town.province) === selectedRegion
      );
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      // Handle different sort fields
      if (sortField === 'region') {
        aValue = getRegionFromComarca(a.province);
        bValue = getRegionFromComarca(b.province);
      } else if (sortField === 'updated_at') {
        aValue = new Date(a.updated_at || 0).getTime();
        bValue = new Date(b.updated_at || 0).getTime();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      // Handle string comparison (case-insensitive)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredMunicipis(filtered);
  }, [municipis, searchTerm, selectedComarca, selectedRegion, sortField, sortDirection]);

  // Handle pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredMunicipis.slice(startIndex, endIndex);
    setPaginatedMunicipis(paginated);
  }, [filteredMunicipis, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedComarca, selectedRegion, sortField, sortDirection]);

  // Pagination controls
  const totalPages = Math.ceil(filteredMunicipis.length / itemsPerPage);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Map comarques to regions (províncies)
  const getRegionFromComarca = (comarca) => {
    const comarcaToRegion = {
      // Barcelona region
      'Barcelonès': 'Barcelona',
      'Baix Llobregat': 'Barcelona',
      'Vallès Occidental': 'Barcelona',
      'Vallès Oriental': 'Barcelona',
      'Maresme': 'Barcelona',
      'Garraf': 'Barcelona',
      'Alt Penedès': 'Barcelona',
      'Baix Penedès': 'Barcelona',
      'Anoia': 'Barcelona',
      'Moianès': 'Barcelona',
      'Lluçanès': 'Barcelona',
      // Girona region
      'Gironès': 'Girona',
      'Baix Empordà': 'Girona',
      'Alt Empordà': 'Girona',
      'Selva': 'Girona',
      'Garrotxa': 'Girona',
      'Pla de l\'Estany': 'Girona',
      'Ripollès': 'Girona',
      'Cerdanya': 'Girona',
      // Tarragona region
      'Tarragonès': 'Tarragona',
      'Alt Camp': 'Tarragona',
      'Baix Camp': 'Tarragona',
      'Conca de Barberà': 'Tarragona',
      'Priorat': 'Tarragona',
      'Ribera d\'Ebre': 'Tarragona',
      'Terra Alta': 'Tarragona',
      'Baix Ebre': 'Tarragona',
      'Montsià': 'Tarragona',
      // Lleida region
      'Segrià': 'Lleida',
      'Noguera': 'Lleida',
      'Urgell': 'Lleida',
      'Pla d\'Urgell': 'Lleida',
      'Segarra': 'Lleida',
      'Garrigues': 'Lleida',
      'Solsonès': 'Lleida',
      'Alt Urgell': 'Lleida',
      'Pallars Jussà': 'Lleida',
      'Pallars Sobirà': 'Lleida',
      'Alta Ribagorça': 'Lleida',
      'Val d\'Aran': 'Lleida'
    };
    return comarcaToRegion[comarca] || 'Altres';
  };

  /**
   * Handles sorting
   */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Handles document click to open from storage
   */
  const handleDocumentClick = async (townName, documentName) => {
    try {
      const response = await fetch(`${API_BASE}/api/towns/${encodeURIComponent(townName)}/documents/${encodeURIComponent(documentName)}/url`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.signed_url) {
        window.open(result.signed_url, '_blank');
      } else {
        throw new Error('No signed URL received');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      alert(`Error al obrir el document: ${error.message}`);
    }
  };

  /**
   * Handles logout
   */
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

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ca-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading if user is not loaded yet
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregant Portal del Personal...</p>
        </div>
      </div>
    );
  }

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
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Pujar Documents
                </button>
                <button
                  onClick={() => navigate('/admin/list')}
                  className="bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Gestionar Municipis
                </button>
                <button
                  onClick={() => navigate('/admin/waiting-list')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Llista d'Espera
                </button>
              </nav>

              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.full_name || user.email}</span>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {user.role}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Page Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Gestionar Municipis</h2>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona municipis i els seus documents del sistema.
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="w-full">
              {/* Error Display */}
              {municipisError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {municipisError}
                  </div>
                  <div className="mt-2 text-sm">
                    <p>Verifica que:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>El servidor backend estigui executant-se en http://localhost:8000</li>
                      <li>La connexió a la base de dades sigui correcta</li>
                      <li>L'endpoint /api/towns estigui disponible</li>
                    </ul>
                    <button
                      onClick={() => {
                        setMunicipisError(null);
                        setMunicipisLoading(true);
                        // Trigger reload by updating a dependency
                        const loadTowns = async () => {
                          try {
                            setMunicipisLoading(true);
                            setMunicipisError(null);
                            console.log('Retrying to load towns from:', `${API_BASE}/api/towns`);
                            const response = await fetch(`${API_BASE}/api/towns`);
                            
                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const data = await response.json();
                            
                            if (data.success && data.towns) {
                              setMunicipis(data.towns);
                              setFilteredMunicipis(data.towns);
                              console.log(`Loaded ${data.count} towns from Supabase`);
                            } else {
                              throw new Error('Invalid response format');
                            }
                          } catch (error) {
                            console.error('Error loading towns from Supabase:', error);
                            setMunicipisError(`Error al carregar municipis: ${error.message}`);
                            setMunicipis([]);
                            setFilteredMunicipis([]);
                          } finally {
                            setMunicipisLoading(false);
                          }
                        };
                        loadTowns();
                      }}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Tornar a intentar
                    </button>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comarca
                  </label>
                  <select 
                    value={selectedComarca}
                    onChange={(e) => setSelectedComarca(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Totes les comarques</option>
                    {Array.from(new Set(municipis.map(m => m.province))).sort().map(comarca => (
                      <option key={comarca} value={comarca}>{comarca}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Províncies
                  </label>
                  <select 
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Totes les províncies</option>
                    <option value="Barcelona">Barcelona</option>
                    <option value="Girona">Girona</option>
                    <option value="Tarragona">Tarragona</option>
                    <option value="Lleida">Lleida</option>
                  </select>
                </div>
                
                <div className="flex-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cercar municipis
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cercar per nom del municipi o comarca..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        Nom del Municipi {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('province')}
                      >
                        Comarca {sortField === 'province' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('region')}
                      >
                        Províncies {sortField === 'region' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updated_at')}
                      >
                        Última Actualització {sortField === 'updated_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Web del Codi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {municipisLoading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mr-2"></div>
                            Carregant municipis...
                          </div>
                        </td>
                      </tr>
                    ) : paginatedMunicipis.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          {municipis.length === 0 ? 'No s\'han trobat municipis' : 'No s\'han trobat resultats per als filtres aplicats'}
                        </td>
                      </tr>
                    ) : (
                      paginatedMunicipis.map((town) => (
                        <tr key={town.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {town.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {town.province}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getRegionFromComarca(town.province)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {town.updated_at ? formatDate(town.updated_at) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {town.documents && town.documents.length > 0 ? (
                                town.documents.map((doc, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleDocumentClick(town.name, doc.name)}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
                                    title={`Click to open ${doc.name}`}
                                  >
                                    {doc.name}
                                  </button>
                                ))
                              ) : (
                                <span className="text-gray-400">Sense documents</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {town.code_website ? (
                              <a
                                href={town.code_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                Visitar
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
                              Pujar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
          </div>

              {/* Summary */}
              <div className="mt-6 text-sm text-gray-600">
                {municipisLoading ? (
                  'Carregant municipis...'
                ) : (
                  <>
                    Mostrant {paginatedMunicipis.length} de {filteredMunicipis.length} municipis (pàgina {currentPage} de {totalPages})
                    {searchTerm && (
                      <span className="ml-2 text-blue-600">
                        (filtrat per: "{searchTerm}")
                      </span>
                    )}
                    {selectedComarca && (
                      <span className="ml-2 text-blue-600">
                        (comarca: {selectedComarca})
                      </span>
                    )}
                    {selectedRegion && (
                      <span className="ml-2 text-blue-600">
                        (província: {selectedRegion})
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrant pàgina {currentPage} de {totalPages} ({filteredMunicipis.length} municipis totals)
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-2 text-sm rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Següent
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Funcions de Gestió</h3>
          <div className="text-sm text-blue-800">
              <h4 className="font-semibold mb-2">🏘️ Municipis:</h4>
              <ul className="space-y-1">
                <li>• Veure tots els municipis i els seus documents</li>
                <li>• Filtrar municipis per comarca i província</li>
                <li>• Cercar municipis per nom</li>
                <li>• Pujar documents per a municipis específics</li>
                <li>• Veure documents amb URLs signades</li>
                <li>• Esborrar documents quan ja no siguin necessaris</li>
              </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminListPage;