/**
 * Waiting List Service
 * 
 * API helpers for interacting with the waiting_list table in Supabase.
 * Provides both public (form submission) and staff (admin) functionality.
 */

import { supabase } from '../supabaseClient';
import { getAdminSupabase } from './adminSupabaseClient';
import { env } from '../config/env';

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates the waiting list form data
 * @param {Object} data - Form data
 * @returns {Object} Validation result with isValid and errors
 */
export const validateWaitingListForm = (data) => {
  const errors = {};

  if (!data.full_name?.trim()) {
    errors.full_name = 'El nom és obligatori';
  } else if (data.full_name.trim().length < 2) {
    errors.full_name = 'El nom ha de tenir almenys 2 caràcters';
  }

  if (!data.email?.trim()) {
    errors.email = 'El correu electrònic és obligatori';
  } else if (!validateEmail(data.email.trim())) {
    errors.email = 'Introdueix un correu electrònic vàlid';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Check if email already exists in waiting list
 * Uses RPC function to check without exposing data
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} Whether the email exists
 */
export const checkEmailExists = async (email) => {
  try {
    const { data, error } = await supabase.rpc('check_waiting_list_email', {
      check_email: email.trim().toLowerCase()
    });

    if (error) {
      console.error('Error checking email:', error);
      // If RPC fails, try direct query (fallback)
      const { data: entries, error: queryError } = await supabase
        .from('waiting_list')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .limit(1);

      if (queryError) {
        // If both fail, assume it doesn't exist to not block signup
        return false;
      }
      return entries && entries.length > 0;
    }

    return data === true;
  } catch (err) {
    console.error('Error in checkEmailExists:', err);
    return false;
  }
};

/**
 * Submit a new waiting list entry (public)
 * Uses a SECURITY DEFINER function to bypass RLS for public submissions
 * @param {Object} formData - Form data containing full_name, email, company
 * @param {Object} metadata - Optional metadata (source, etc.)
 * @returns {Promise<Object>} Result object with success, message, and data
 */
export const submitWaitingListEntry = async (formData, metadata = {}) => {
  try {
    // Validate form data
    const validation = validateWaitingListForm(formData);
    if (!validation.isValid) {
      return {
        success: false,
        message: Object.values(validation.errors)[0],
        errors: validation.errors
      };
    }

    // Prepare metadata
    const fullMetadata = {
      userAgent: navigator?.userAgent || null,
      referrer: document?.referrer || null,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    // Use the RPC function to submit (bypasses RLS)
    const { data, error } = await supabase.rpc('submit_waiting_list_entry', {
      p_full_name: formData.full_name.trim(),
      p_email: formData.email.trim().toLowerCase(),
      p_company: formData.company?.trim() || null,
      p_role: formData.role || 'architect',
      p_source: metadata.source || 'landing_page',
      p_metadata: fullMetadata
    });

    if (error) {
      console.error('Error submitting waiting list entry:', error);
      return {
        success: false,
        message: 'Hi ha hagut un error. Torna-ho a provar.',
        error: error.message
      };
    }

    // Parse the response from the function
    if (data && data.success) {
      if (data.already_exists) {
        return {
          success: true,
          message: 'Ja estàs a la llista d\'espera! Et contactarem aviat.',
          alreadyExists: true
        };
      }
      return {
        success: true,
        message: '🎉 T\'has afegit a la llista d\'espera! Et contactarem aviat.',
        data
      };
    }

    // If function returned an error
    return {
      success: false,
      message: data?.message || 'Hi ha hagut un error. Torna-ho a provar.',
      error: data?.message
    };
  } catch (err) {
    console.error('Error in submitWaitingListEntry:', err);
    return {
      success: false,
      message: 'Hi ha hagut un error inesperat. Torna-ho a provar.',
      error: err.message
    };
  }
};

// ============================================================================
// STAFF FUNCTIONS (require authentication and staff role)
// ============================================================================

/**
 * Get all waiting list entries (staff only)
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Result with entries and count
 */
export const getWaitingListEntries = async (options = {}) => {
  const {
    page = 1,
    pageSize = 25,
    sortBy = 'created_at',
    sortOrder = 'desc',
    searchTerm = '',
    filters = {},
    isDevUser = false // Pass this from the component if using dev user
  } = options;

  try {
    console.log('🔍 Fetching waiting list entries with options:', { page, pageSize, sortBy, sortOrder, searchTerm, filters, isDevUser });
    
    // Use admin client in dev mode if using dev user (bypasses RLS)
    let client = supabase;
    let usingAdminClient = false;
    
    if (isDevUser && env.app.isDevelopment) {
      const adminClient = getAdminSupabase(true);
      if (adminClient) {
        client = adminClient;
        usingAdminClient = true;
        console.log('🔑 Using admin Supabase client (bypasses RLS)');
      } else {
        console.warn('⚠️ Admin client not available, using regular client (may fail due to RLS)');
      }
    }
    
    // First, let's check if we can access the table at all
    console.log('🔍 Testing table access with client:', usingAdminClient ? 'ADMIN (bypasses RLS)' : 'REGULAR (respects RLS)');
    const { data: testData, error: testError } = await client
      .from('waiting_list')
      .select('id')
      .limit(10); // Get more to see if data exists
    
    console.log('🔍 Test query result:', { 
      testData, 
      testError, 
      usingAdminClient,
      dataLength: testData?.length || 0,
      errorCode: testError?.code,
      errorMessage: testError?.message,
      errorHint: testError?.hint
    });
    
    if (testError) {
      console.error('❌ Cannot access waiting_list table:', testError);
      console.error('Error code:', testError.code);
      console.error('Error message:', testError.message);
      console.error('Error hint:', testError.hint);
      
      // If using regular client and getting RLS error, suggest using admin client
      if (testError.code === '42501' && !usingAdminClient && isDevUser) {
        console.error('💡 Suggestion: Set VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS in dev mode');
      }
      
      return { success: false, error: `Cannot access waiting_list table: ${testError.message} (Code: ${testError.code})`, entries: [], count: 0 };
    }
    
    // If no error but also no data, the table might be empty or RLS is silently blocking
    if (!testError && (!testData || testData.length === 0)) {
      console.warn('⚠️ Query succeeded but returned no data. This could mean:');
      console.warn('  1. The table is empty');
      console.warn('  2. RLS is silently filtering out all rows (even with admin client)');
      console.warn('  3. The table name or schema is incorrect');
    }

    let query = client
      .from('waiting_list')
      .select('*', { count: 'exact' });

    // Apply search
    if (searchTerm) {
      query = query.or(
        `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`
      );
    }

    // Apply filters
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }
    if (filters.is_suspicious !== undefined) {
      query = query.eq('is_suspicious', filters.is_suspicious);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    console.log('🔍 Executing query...');
    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching waiting list:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error hint:', error.hint);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { success: false, error: `${error.message} (Code: ${error.code})`, entries: [], count: 0 };
    }

    console.log(`✅ Loaded ${data?.length || 0} waiting list entries (total: ${count || 0})`);
    if (data && data.length > 0) {
      console.log('📋 Sample entry:', data[0]);
    }

    return {
      success: true,
      entries: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (err) {
    console.error('❌ Exception in getWaitingListEntries:', err);
    return { success: false, error: err.message, entries: [], count: 0 };
  }
};

/**
 * Get waiting list statistics (staff only)
 * @returns {Promise<Object>} Stats object
 */
export const getWaitingListStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_waiting_list_stats');

    if (error) {
      console.error('Error getting stats:', error);
      // Fallback to manual query
      const { data: entries, error: queryError } = await supabase
        .from('waiting_list')
        .select('id, is_verified, is_suspicious, source, created_at');

      if (queryError) {
        return { success: false, error: queryError.message };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: entries.length,
        verified: entries.filter(e => e.is_verified).length,
        suspicious: entries.filter(e => e.is_suspicious).length,
        today: entries.filter(e => new Date(e.created_at) >= today).length,
        this_week: entries.filter(e => new Date(e.created_at) >= weekAgo).length,
        this_month: entries.filter(e => new Date(e.created_at) >= monthAgo).length,
        by_source: entries.reduce((acc, e) => {
          const source = e.source || 'unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {})
      };

      return { success: true, stats };
    }

    return { success: true, stats: data };
  } catch (err) {
    console.error('Error in getWaitingListStats:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Add a manual entry (staff only)
 * @param {Object} data - Entry data
 * @returns {Promise<Object>} Result
 */
export const addManualEntry = async (data) => {
  try {
    const entryData = {
      full_name: data.full_name.trim(),
      email: data.email.trim().toLowerCase(),
      company: data.company?.trim() || null,
      role: data.role?.trim() || 'architect',
      source: 'manual_entry',
      notes: data.notes?.trim() || null,
      is_verified: data.is_verified || false,
      is_suspicious: false
    };

    const { data: entry, error } = await supabase
      .from('waiting_list')
      .insert([entryData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Aquest correu ja existeix a la llista.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, entry };
  } catch (err) {
    console.error('Error in addManualEntry:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update an entry (staff only)
 * @param {string} id - Entry ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result
 */
export const updateEntry = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('waiting_list')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, entry: data };
  } catch (err) {
    console.error('Error in updateEntry:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete an entry (staff only)
 * @param {string} id - Entry ID
 * @returns {Promise<Object>} Result
 */
export const deleteEntry = async (id) => {
  try {
    const { error } = await supabase
      .from('waiting_list')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error in deleteEntry:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete multiple entries (staff only)
 * @param {string[]} ids - Array of entry IDs
 * @returns {Promise<Object>} Result
 */
export const deleteEntries = async (ids) => {
  try {
    const { error } = await supabase
      .from('waiting_list')
      .delete()
      .in('id', ids);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, deletedCount: ids.length };
  } catch (err) {
    console.error('Error in deleteEntries:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Toggle verification status (staff only)
 * @param {string} id - Entry ID
 * @param {boolean} isVerified - New verification status
 * @returns {Promise<Object>} Result
 */
export const toggleVerified = async (id, isVerified) => {
  return updateEntry(id, { is_verified: isVerified });
};

/**
 * Toggle suspicious status (staff only)
 * @param {string} id - Entry ID
 * @param {boolean} isSuspicious - New suspicious status
 * @returns {Promise<Object>} Result
 */
export const toggleSuspicious = async (id, isSuspicious) => {
  return updateEntry(id, { is_suspicious: isSuspicious });
};

/**
 * Bulk update verification status (staff only)
 * @param {string[]} ids - Array of entry IDs
 * @param {boolean} isVerified - New verification status
 * @returns {Promise<Object>} Result
 */
export const bulkToggleVerified = async (ids, isVerified) => {
  try {
    const { error } = await supabase
      .from('waiting_list')
      .update({ is_verified: isVerified })
      .in('id', ids);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, updatedCount: ids.length };
  } catch (err) {
    console.error('Error in bulkToggleVerified:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Clean up duplicate entries (staff only)
 * Uses RPC function to remove duplicates, keeping the oldest
 * @returns {Promise<Object>} Result with deleted count
 */
export const cleanupDuplicates = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_waiting_list_duplicates');

    if (error) {
      // Fallback to manual cleanup
      console.error('RPC cleanup failed, trying manual:', error);
      
      // Get all entries
      const { data: entries, error: fetchError } = await supabase
        .from('waiting_list')
        .select('id, email, created_at')
        .order('created_at', { ascending: true });

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Find duplicates (keep first occurrence)
      const seen = new Set();
      const duplicateIds = [];
      
      for (const entry of entries) {
        const emailLower = entry.email.toLowerCase();
        if (seen.has(emailLower)) {
          duplicateIds.push(entry.id);
        } else {
          seen.add(emailLower);
        }
      }

      if (duplicateIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('waiting_list')
          .delete()
          .in('id', duplicateIds);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
      }

      return { success: true, deletedCount: duplicateIds.length };
    }

    return { success: true, deletedCount: data || 0 };
  } catch (err) {
    console.error('Error in cleanupDuplicates:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get unique sources for filtering
 * @returns {Promise<string[]>} Array of unique source values
 */
export const getUniqueSources = async () => {
  try {
    const { data, error } = await supabase
      .from('waiting_list')
      .select('source')
      .not('source', 'is', null);

    if (error) {
      return [];
    }

    const sources = [...new Set(data.map(d => d.source))].filter(Boolean);
    return sources;
  } catch (err) {
    console.error('Error in getUniqueSources:', err);
    return [];
  }
};

/**
 * Export waiting list to CSV (staff only)
 * @param {Object} filters - Optional filters to apply
 * @returns {Promise<string>} CSV string
 */
export const exportToCsv = async (filters = {}) => {
  try {
    let query = supabase
      .from('waiting_list')
      .select('full_name, email, company, role, source, is_verified, is_suspicious, created_at, notes')
      .order('created_at', { ascending: false });

    // Apply same filters as getWaitingListEntries
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Convert to CSV
    const headers = ['Nom', 'Email', 'Empresa', 'Rol', 'Font', 'Verificat', 'Sospitós', 'Data', 'Notes'];
    const rows = data.map(entry => [
      entry.full_name,
      entry.email,
      entry.company || '',
      entry.role || '',
      entry.source || '',
      entry.is_verified ? 'Sí' : 'No',
      entry.is_suspicious ? 'Sí' : 'No',
      new Date(entry.created_at).toLocaleString('ca-ES'),
      entry.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  } catch (err) {
    console.error('Error in exportToCsv:', err);
    throw err;
  }
};

export default {
  // Public functions
  validateEmail,
  validateWaitingListForm,
  checkEmailExists,
  submitWaitingListEntry,
  
  // Staff functions
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
};

