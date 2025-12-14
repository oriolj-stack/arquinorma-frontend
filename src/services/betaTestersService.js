/**
 * Beta Testers Service
 * 
 * Simple service for managing beta tester email registrations.
 * Stores only email and registration date in the beta_testers table.
 */

import { supabase } from '../supabaseClient';

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
 * Submit a beta tester email registration
 * @param {string} email - Email address
 * @returns {Promise<Object>} Result object with success, message, and data
 */
export const submitBetaTesterEmail = async (email) => {
  try {
    // Validate email
    if (!email || !email.trim()) {
      return {
        success: false,
        message: 'El correu electrònic és obligatori'
      };
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      return {
        success: false,
        message: 'Introdueix un correu electrònic vàlid'
      };
    }

    // Use the RPC function to submit (bypasses RLS)
    const { data, error } = await supabase.rpc('submit_beta_tester_email', {
      p_email: trimmedEmail
    });

    if (error) {
      console.error('Error submitting beta tester:', error);
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
          message: data.message || 'Ja estàs a la llista de beta testers! Et contactarem aviat.',
          alreadyExists: true
        };
      }
      return {
        success: true,
        message: data.message || '🎉 T\'has afegit a la llista de beta testers! Revisarem la teva sol·licitud i et contactarem aviat.',
        data: data.data
      };
    }

    // If function returned an error
    return {
      success: false,
      message: data?.message || 'Hi ha hagut un error. Torna-ho a provar.',
      error: data?.message
    };
  } catch (err) {
    console.error('Error in submitBetaTesterEmail:', err);
    return {
      success: false,
      message: 'Hi ha hagut un error inesperat. Torna-ho a provar.',
      error: err.message
    };
  }
};

export default {
  validateEmail,
  submitBetaTesterEmail
};

