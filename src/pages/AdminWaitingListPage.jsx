import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import AdminHeader from '../components/Admin/AdminHeader';
import {
  getWaitingListEntries,
  getWaitingListStats,
  addManualEntry,
  updateEntry,
  deleteEntry,
  deleteEntries,
  toggleVerified,
  toggleSuspicious,
  bulkToggleVerified,
  cleanupDuplicates,
  getUniqueSources,
  exportToCsv
} from '../services/waitingListService';

/**
 * Admin Waiting List Management Page
 * 
 * Comprehensive dashboard for managing waiting list entries.
 * Features:
 * - Table view with sorting, filtering, search
 * - Manual entry form
 * - Bulk actions
 * - Duplicate cleanup
 * - Export functionality
 */

// Catalan translations
const T = {
  title: 'Gestió de la Llista d\'Espera',
  subtitle: 'Gestiona els registres de la llista d\'espera',
  loading: 'Carregant...',
  noEntries: 'No hi ha entrades a la llista d\'espera',
  
  // Stats
  stats: {
    total: 'Total',
    verified: 'Verificats',
    suspicious: 'Sospitosos',
    today: 'Avui',
    thisWeek: 'Aquesta setmana',
    thisMonth: 'Aquest mes'
  },
  
  // Table headers
  table: {
    name: 'Nom',
    email: 'Email',
    company: 'Empresa',
    role: 'Rol',
    source: 'Font',
    status: 'Estat',
    createdAt: 'Data',
    notes: 'Notes',
    actions: 'Accions'
  },
  
  // Actions
  actions: {
    edit: 'Editar',
    delete: 'Eliminar',
    verify: 'Verificar',
    unverify: 'Desverificar',
    markSuspicious: 'Marcar sospitós',
    unmarkSuspicious: 'Desmarcar sospitós',
    addManual: 'Afegir manualment',
    cleanupDuplicates: 'Netejar duplicats',
    export: 'Exportar CSV',
    bulkDelete: 'Eliminar seleccionats',
    bulkVerify: 'Verificar seleccionats',
    selectAll: 'Seleccionar tot',
    deselectAll: 'Deseleccionar tot'
  },
  
  // Filters
  filters: {
    search: 'Cercar per nom, email o empresa...',
    source: 'Totes les fonts',
    verified: 'Tots els estats',
    verifiedOnly: 'Només verificats',
    notVerified: 'No verificats',
    suspicious: 'Sospitosos',
    dateFrom: 'Des de',
    dateTo: 'Fins a',
    clearFilters: 'Netejar filtres'
  },
  
  // Form
  form: {
    title: 'Afegir entrada manualment',
    fullName: 'Nom complet *',
    email: 'Email *',
    company: 'Empresa',
    role: 'Rol',
    notes: 'Notes internes',
    isVerified: 'Marcar com verificat',
    submit: 'Afegir',
    cancel: 'Cancel·lar'
  },
  
  // Edit modal
  edit: {
    title: 'Editar entrada',
    save: 'Desar canvis'
  },
  
  // Messages
  messages: {
    addSuccess: 'Entrada afegida correctament',
    updateSuccess: 'Entrada actualitzada correctament',
    deleteSuccess: 'Entrada eliminada correctament',
    bulkDeleteSuccess: 'Entrades eliminades correctament',
    bulkVerifySuccess: 'Entrades verificades correctament',
    cleanupSuccess: 'Duplicats eliminats:',
    noDuplicates: 'No s\'han trobat duplicats',
    exportSuccess: 'Fitxer exportat correctament',
    error: 'Hi ha hagut un error',
    confirmDelete: 'Estàs segur que vols eliminar aquesta entrada?',
    confirmBulkDelete: 'Estàs segur que vols eliminar les entrades seleccionades?',
    confirmCleanup: 'Això eliminarà totes les entrades duplicades (es mantindrà la més antiga). Continuar?'
  },
  
  // Pagination
  pagination: {
    showing: 'Mostrant',
    of: 'de',
    entries: 'entrades',
    previous: 'Anterior',
    next: 'Següent'
  }
};

// Sources for filtering
const SOURCES = [
  { value: '', label: T.filters.source },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'manual_entry', label: 'Entrada manual' }
];

// Verification filter options
const VERIFICATION_FILTERS = [
  { value: '', label: T.filters.verified },
  { value: 'verified', label: T.filters.verifiedOnly },
  { value: 'not_verified', label: T.filters.notVerified },
  { value: 'suspicious', label: T.filters.suspicious }
];

/**
 * Stats Card Component
 */
const StatCard = ({ title, value, icon, color = 'amber' }) => {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{title}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Add/Edit Entry Modal
 */
const EntryModal = ({ isOpen, onClose, onSubmit, entry = null, isSubmitting }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    role: 'architect',
    notes: '',
    is_verified: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (entry) {
      setFormData({
        full_name: entry.full_name || '',
        email: entry.email || '',
        company: entry.company || '',
        role: entry.role || 'architect',
        notes: entry.notes || '',
        is_verified: entry.is_verified || false
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        company: '',
        role: 'architect',
        notes: '',
        is_verified: false
      });
    }
    setErrors({});
  }, [entry, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nom és obligatori';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El correu és obligatori';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Correu no vàlid';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {entry ? T.edit.title : T.form.title}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {T.form.fullName}
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
                errors.full_name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {T.form.email}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!entry} // Can't change email for existing entries
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } ${entry ? 'bg-gray-100' : ''}`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {T.form.company}
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {T.form.role}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              <option value="architect">Arquitecte</option>
              <option value="architect_technical">Arquitecte Tècnic</option>
              <option value="student">Estudiant</option>
              <option value="engineer">Enginyer</option>
              <option value="other">Altre</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {T.form.notes}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              placeholder="Notes internes..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_verified"
              checked={formData.is_verified}
              onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
              className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
            />
            <label htmlFor="is_verified" className="text-sm text-gray-700">
              {T.form.isVerified}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {T.form.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? T.loading : (entry ? T.edit.save : T.form.submit)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Main Admin Waiting List Page Component
 */
const AdminWaitingListPage = () => {
  const navigate = useNavigate();
  
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Messages
  const [message, setMessage] = useState({ type: '', text: '' });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      // Check for development user first
      if (env.app.isDevelopment) {
        const devUser = localStorage.getItem('dev_staff_user');
        if (devUser) {
          const parsedUser = JSON.parse(devUser);
          setUser(parsedUser);
          setLoading(false);
          
          // In dev mode, try to sign in as the dev user to create a real session
          // This allows RLS policies to work properly
          try {
            // Check if we already have a session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.log('🔐 No session found, attempting to sign in as dev user...');
              // Try to sign in with a dev password (you may need to create this user in Supabase)
              // For now, we'll use the admin client approach
              console.log('⚠️ Using admin client for dev mode (RLS bypass)');
            } else {
              console.log('✅ Existing session found:', session.user.email);
            }
          } catch (err) {
            console.warn('Could not check/create session:', err);
          }
          
          loadData();
          return;
        } else {
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
          loadData();
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

      if (profileError) {
        console.error('Error checking user profile:', profileError);
        setMessage({ type: 'error', text: 'Error verificant el teu perfil. Torna-ho a provar.' });
        setLoading(false);
        return;
      }

      if (!['staff', 'admin', 'super_admin'].includes(profile?.role?.toLowerCase())) {
        console.error('Accés denegat. Es requereixen permisos de personal.');
        setMessage({ type: 'error', text: 'No tens permisos per accedir a aquesta secció. Es requereixen permisos de staff o admin.' });
        setLoading(false);
        return;
      }

      setUser({ ...session.user, role: profile.role, full_name: profile.full_name, email: profile.email });
      setLoading(false);

      // Load data
      loadData();
    };

    checkAuth();
  }, [navigate]);

  // Load entries when filters change
  useEffect(() => {
    if (!loading) {
      loadEntries();
    }
  }, [page, sortBy, sortOrder, searchTerm, sourceFilter, verificationFilter, dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadEntries(), loadStats()]);
    setLoading(false);
  };

  const loadEntries = async () => {
    const filters = {};
    
    if (sourceFilter) {
      filters.source = sourceFilter;
    }
    if (verificationFilter === 'verified') {
      filters.is_verified = true;
    } else if (verificationFilter === 'not_verified') {
      filters.is_verified = false;
    } else if (verificationFilter === 'suspicious') {
      filters.is_suspicious = true;
    }
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    if (dateTo) {
      filters.dateTo = dateTo + 'T23:59:59';
    }

    // Check if using dev user
    const isDevUser = env.app.isDevelopment && localStorage.getItem('dev_staff_user');

    const result = await getWaitingListEntries({
      page,
      pageSize,
      sortBy,
      sortOrder,
      searchTerm,
      filters,
      isDevUser: !!isDevUser
    });

    if (result.success) {
      console.log('✅ Successfully loaded entries:', result.entries.length);
      setEntries(result.entries);
      setTotalCount(result.count);
      setTotalPages(result.totalPages);
    } else {
      console.error('❌ Error loading entries:', result.error);
      showMessage('error', result.error || 'Error carregant les entrades');
      setEntries([]);
      setTotalCount(0);
      setTotalPages(0);
    }
  };

  const loadStats = async () => {
    const result = await getWaitingListStats();
    if (result.success) {
      setStats(result.stats);
    } else {
      console.error('Error loading stats:', result.error);
      // Don't show error message for stats, just log it
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  // Handle selection
  const handleSelectEntry = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === entries.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
      setSelectAll(true);
    }
  };

  // Handle add/edit
  const handleAddEntry = async (data) => {
    setIsSubmitting(true);
    const result = await addManualEntry(data);
    setIsSubmitting(false);

    if (result.success) {
      showMessage('success', T.messages.addSuccess);
      setShowAddModal(false);
      loadData();
    } else {
      showMessage('error', result.error || T.messages.error);
    }
  };

  const handleUpdateEntry = async (data) => {
    if (!editingEntry) return;

    setIsSubmitting(true);
    const result = await updateEntry(editingEntry.id, data);
    setIsSubmitting(false);

    if (result.success) {
      showMessage('success', T.messages.updateSuccess);
      setEditingEntry(null);
      loadEntries();
    } else {
      showMessage('error', result.error || T.messages.error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm(T.messages.confirmDelete)) return;

    const result = await deleteEntry(id);
    if (result.success) {
      showMessage('success', T.messages.deleteSuccess);
      loadData();
    } else {
      showMessage('error', result.error || T.messages.error);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(T.messages.confirmBulkDelete)) return;

    const result = await deleteEntries([...selectedIds]);
    if (result.success) {
      showMessage('success', T.messages.bulkDeleteSuccess);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadData();
    } else {
      showMessage('error', result.error || T.messages.error);
    }
  };

  // Handle bulk verify
  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) return;

    const result = await bulkToggleVerified([...selectedIds], true);
    if (result.success) {
      showMessage('success', T.messages.bulkVerifySuccess);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadData();
    } else {
      showMessage('error', result.error || T.messages.error);
    }
  };

  // Handle toggle verified/suspicious
  const handleToggleVerified = async (id, currentValue) => {
    const result = await toggleVerified(id, !currentValue);
    if (result.success) {
      loadEntries();
    }
  };

  const handleToggleSuspicious = async (id, currentValue) => {
    const result = await toggleSuspicious(id, !currentValue);
    if (result.success) {
      loadEntries();
    }
  };

  // Handle cleanup duplicates
  const handleCleanupDuplicates = async () => {
    if (!window.confirm(T.messages.confirmCleanup)) return;

    const result = await cleanupDuplicates();
    if (result.success) {
      if (result.deletedCount > 0) {
        showMessage('success', `${T.messages.cleanupSuccess} ${result.deletedCount}`);
        loadData();
      } else {
        showMessage('success', T.messages.noDuplicates);
      }
    } else {
      showMessage('error', result.error || T.messages.error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const csv = await exportToCsv({
        source: sourceFilter || undefined,
        is_verified: verificationFilter === 'verified' ? true : undefined
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `waiting-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', T.messages.exportSuccess);
    } catch (error) {
      showMessage('error', T.messages.error);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setSourceFilter('');
    setVerificationFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{T.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AdminHeader user={user} />
      
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{T.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{T.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard title={T.stats.total} value={stats.total || 0} icon="📋" color="gray" />
            <StatCard title={T.stats.verified} value={stats.verified || 0} icon="✅" color="green" />
            <StatCard title={T.stats.suspicious} value={stats.suspicious || 0} icon="⚠️" color="red" />
            <StatCard title={T.stats.today} value={stats.today || 0} icon="📅" color="blue" />
            <StatCard title={T.stats.thisWeek} value={stats.this_week || 0} icon="📆" color="amber" />
            <StatCard title={T.stats.thisMonth} value={stats.this_month || 0} icon="🗓️" color="amber" />
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              {T.actions.addManual}
            </button>

            <button
              onClick={handleCleanupDuplicates}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {T.actions.cleanupDuplicates}
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {T.actions.export}
            </button>

            {selectedIds.size > 0 && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <span className="text-sm text-gray-500">
                  {selectedIds.size} seleccionats
                </span>
                <button
                  onClick={handleBulkVerify}
                  className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                >
                  {T.actions.bulkVerify}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  {T.actions.bulkDelete}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={T.filters.search}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Verification Filter */}
            <select
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              {VERIFICATION_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {T.filters.clearFilters}
            </button>
          </div>

          {/* Date Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{T.filters.dateFrom}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{T.filters.dateTo}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>{T.noEntries}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                        />
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('full_name')}
                      >
                        <div className="flex items-center gap-1">
                          {T.table.name}
                          {sortBy === 'full_name' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-1">
                          {T.table.email}
                          {sortBy === 'email' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {T.table.company}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {T.table.source}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {T.table.status}
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-1">
                          {T.table.createdAt}
                          {sortBy === 'created_at' && (
                            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {T.table.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry) => (
                      <tr 
                        key={entry.id} 
                        className={`hover:bg-gray-50 ${entry.is_suspicious ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(entry.id)}
                            onChange={() => handleSelectEntry(entry.id)}
                            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{entry.full_name}</div>
                          {entry.role && entry.role !== 'architect' && (
                            <div className="text-xs text-gray-500">{entry.role}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.company || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.source === 'landing_page' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {entry.source || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleVerified(entry.id, entry.is_verified)}
                              className={`p-1 rounded ${
                                entry.is_verified 
                                  ? 'text-green-600 hover:bg-green-100' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={entry.is_verified ? T.actions.unverify : T.actions.verify}
                            >
                              <svg className="w-5 h-5" fill={entry.is_verified ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleSuspicious(entry.id, entry.is_suspicious)}
                              className={`p-1 rounded ${
                                entry.is_suspicious 
                                  ? 'text-red-600 hover:bg-red-100' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={entry.is_suspicious ? T.actions.unmarkSuspicious : T.actions.markSuspicious}
                            >
                              <svg className="w-5 h-5" fill={entry.is_suspicious ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingEntry(entry)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={T.actions.edit}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={T.actions.delete}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {T.pagination.showing} {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} {T.pagination.of} {totalCount} {T.pagination.entries}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {T.pagination.previous}
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {T.pagination.next}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <EntryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEntry}
        isSubmitting={isSubmitting}
      />

      {/* Edit Modal */}
      <EntryModal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSubmit={handleUpdateEntry}
        entry={editingEntry}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default AdminWaitingListPage;

