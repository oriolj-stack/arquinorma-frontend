import React, { useState, useEffect, useCallback } from 'react';

// Use proxy in development, direct URL in production
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000');

const TownsTable = () => {
  const [towns, setTowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTowns, setTotalTowns] = useState(0);
  const [expandedTown, setExpandedTown] = useState(null);
  const [townDocuments, setTownDocuments] = useState({});
  const [documentsLoading, setDocumentsLoading] = useState({});
  const [documentsPage, setDocumentsPage] = useState({});

  // Fetch all towns (client-side pagination)
  const fetchTowns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/api/towns`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Add documents_count field to each town (placeholder for now)
        const townsWithCounts = (data.towns || []).map(town => ({
          ...town,
          documents_count: town.documents?.length || 0
        }));
        setTowns(townsWithCounts);
        setTotalTowns(townsWithCounts.length);
        setTotalPages(Math.ceil(townsWithCounts.length / 50));
      } else {
        throw new Error(data.error || 'Failed to fetch towns');
      }
      
    } catch (err) {
      console.error('Error fetching towns:', err);
      setError('Error al carregar municipis. Si us plau, torna-ho a provar.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch towns on mount
  useEffect(() => {
    fetchTowns();
  }, [fetchTowns]);

  // Fetch documents for a town
  const fetchTownDocuments = useCallback(async (townId, page = 1, append = false) => {
    try {
      setDocumentsLoading(prev => ({ ...prev, [townId]: true }));
      
      const response = await fetch(`${API_BASE}/api/admin/towns/${townId}/documents?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const newDocuments = data.documents || [];
        
        if (append) {
          setTownDocuments(prev => ({
            ...prev,
            [townId]: [...(prev[townId] || []), ...newDocuments]
          }));
        } else {
          setTownDocuments(prev => ({
            ...prev,
            [townId]: newDocuments
          }));
        }
        
        setDocumentsPage(prev => ({
          ...prev,
          [townId]: page
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch documents');
      }
      
    } catch (err) {
      console.error('Error fetching documents:', err);
      alert('Error al carregar documents. Si us plau, torna-ho a provar.');
    } finally {
      setDocumentsLoading(prev => ({ ...prev, [townId]: false }));
    }
  }, []);

  // Handle view documents click
  const handleViewDocuments = useCallback((townId) => {
    if (expandedTown === townId) {
      setExpandedTown(null);
    } else {
      setExpandedTown(townId);
      if (!townDocuments[townId]) {
        fetchTownDocuments(townId, 1, false);
      }
    }
  }, [expandedTown, townDocuments, fetchTownDocuments]);

  // Handle load more documents
  const handleLoadMoreDocuments = useCallback((townId) => {
    const nextPage = (documentsPage[townId] || 1) + 1;
    fetchTownDocuments(townId, nextPage, true);
  }, [documentsPage, fetchTownDocuments]);

  // Pagination controls
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Client-side pagination
  const paginatedTowns = useMemo(() => {
    const startIndex = (currentPage - 1) * 50;
    const endIndex = startIndex + 50;
    return towns.slice(startIndex, endIndex);
  }, [towns, currentPage]);

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

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => fetchTowns(currentPage)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tornar a provar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestió de Municipis</h2>
        <p className="text-gray-600">
          Mostrant {paginatedTowns.length} de {totalTowns} municipis (pàgina {currentPage} de {totalPages})
        </p>
      </div>

      {/* Towns Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom del Municipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comarca
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Províncies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTowns.map((town) => (
                <React.Fragment key={town.id}>
                  <tr className="hover:bg-gray-50">
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {town.documents_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDocuments(town.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {expandedTown === town.id ? 'Amagar documents' : 'Veure documents'}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Documents Row */}
                  {expandedTown === town.id && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900">
                            Documents de {town.name}
                          </h4>
                          
                          {documentsLoading[town.id] && !townDocuments[town.id] ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {townDocuments[town.id] && townDocuments[town.id].length > 0 ? (
                                <>
                                  <div className="grid gap-3">
                                    {townDocuments[town.id].map((doc, index) => (
                                      <div key={doc.id || index} className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1">
                                            <h5 className="text-sm font-medium text-gray-900">
                                              {doc.title || 'Document sense títol'}
                                            </h5>
                                            <p className="text-xs text-gray-500 mt-1">
                                              Actualitzat: {formatDate(doc.last_updated || doc.updated_at)}
                                            </p>
                                            {doc.storage_path && (
                                              <p className="text-xs text-gray-400 mt-1">
                                                {doc.storage_path}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            {doc.version && (
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                v{doc.version}
                                              </span>
                                            )}
                                            {doc.archived && (
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                Arxivat
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Load More Button */}
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => handleLoadMoreDocuments(town.id)}
                                      disabled={documentsLoading[town.id]}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {documentsLoading[town.id] ? (
                                        <div className="flex items-center">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Carregant...
                                        </div>
                                      ) : (
                                        'Carregar més documents'
                                      )}
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  No s'han trobat documents per aquest municipi.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrant pàgina {currentPage} de {totalPages} ({totalTowns} municipis totals)
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
  );
};

export default TownsTable;
