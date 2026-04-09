import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import env from '../config/env';

/**
 * Custom hook for managing subscription state
 * 
 * Fetches and caches user's subscription information including:
 * - Current tier (free, basic, pro, studio, beta)
 * - Trial status and expiration
 * - Project quotas and usage
 * - Feature access permissions
 * 
 * @returns {Object} Subscription state and helper functions
 */
export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = env.api.baseUrl;

  /**
   * Fetch subscription data from backend
   */
  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Fetch subscription status from backend
      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      } else {
        throw new Error('Invalid subscription data received');
      }

    } catch (err) {
      console.error('Error fetching subscription:', err);
      // Surface the error — do NOT silently downgrade paid users to free.
      // Callers should check `error` and show a retry banner.
      setError(err.message || 'No s\'ha pogut carregar la subscripció');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh subscription data
   */
  const refresh = () => {
    fetchSubscription();
  };

  /**
   * Check if user can access a specific feature
   * @param {string} feature - Feature name to check
   * @returns {boolean} Whether user has access
   */
  const canAccess = (feature) => {
    if (!subscription) return false;

    // Beta users can access everything
    if (subscription.tier === 'beta') return true;

    // Trial expired users can't access anything
    if (subscription.trial_expired) return false;

    switch (feature) {
      case 'projects':
        return subscription.can_create_project;
      
      case 'custom_uploads':
        return subscription.can_upload_custom_pdf;
      
      case 'api_access':
        return subscription.api_access || false;
      
      case 'unlimited_projects':
        return subscription.max_projects === null;
      
      case 'document_comparison':
        return ['pro', 'studio', 'beta'].includes(subscription.tier);
      
      case 'team_features':
        return ['studio', 'beta'].includes(subscription.tier);
      
      default:
        return false;
    }
  };

  /**
   * Get days remaining in trial
   * @returns {number|null} Days remaining or null if not on trial
   */
  const getTrialDaysRemaining = () => {
    if (!subscription || !subscription.is_trial || !subscription.trial_ends_at) {
      return null;
    }

    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  /**
   * Check if trial is expiring soon (< 7 days)
   * @returns {boolean} Whether trial is expiring soon
   */
  const isTrialExpiringSoon = () => {
    const daysRemaining = getTrialDaysRemaining();
    return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  };

  /**
   * Get recommended upgrade tier based on current tier
   * @returns {string} Recommended tier name
   */
  const getRecommendedUpgrade = () => {
    if (!subscription) return 'basic';

    switch (subscription.tier) {
      case 'free':
        return 'basic';
      case 'basic':
        return 'pro';
      case 'pro':
        return 'studio';
      default:
        return 'pro';
    }
  };

  /**
   * Get tier display info
   * @returns {Object} Tier display information
   */
  const getTierInfo = () => {
    if (!subscription) return null;

    const tierInfo = {
      free: { name: 'Gratuït', color: 'gray', icon: '🆓' },
      basic: { name: 'Bàsic', color: 'blue', icon: '📘' },
      pro: { name: 'Professional', color: 'purple', icon: '⭐' },
      studio: { name: 'Estudi', color: 'green', icon: '🏢' },
      beta: { name: 'Beta Tester', color: 'purple', icon: '🧪' }
    };

    return tierInfo[subscription.tier] || tierInfo.free;
  };

  // Fetch subscription on mount
  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    error,
    refresh,
    canAccess,
    getTrialDaysRemaining,
    isTrialExpiringSoon,
    getRecommendedUpgrade,
    getTierInfo
  };
};

export default useSubscription;

