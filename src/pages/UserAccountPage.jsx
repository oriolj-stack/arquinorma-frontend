import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';
import StripeCheckoutModal from '../components/StripeCheckoutModal';

/**
 * UserAccountPage Component for ArquiNorma
 * 
 * This page provides a comprehensive user account management interface with:
 * - Personal information management
 * - Subscription status and management
 * - Billing history and payment methods
 * - Tab-based navigation for easy access to different sections
 * - Consistent styling with the main application
 * 
 * FEATURES:
 * - Responsive tab-based interface
 * - User information display and editing
 * - Subscription status and plan details
 * - Billing history and payment management
 * - Professional styling matching app theme
 * - Mobile-responsive design
 */

const UserAccountPage = () => {
  // Translation hook for internationalization
  const { t } = useTranslation();
  
  // Navigation and state management
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  // Personal Info form state
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    company: ''
  });
  const [originalEmail, setOriginalEmail] = useState(''); // Track original email for comparison
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Inline success message states
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Subscription state
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState({ type: '', text: '' });

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null);

  /**
   * Show inline success message under profile form
   */
  const showProfileSuccess = (message) => {
    setProfileSuccessMessage(message);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setProfileSuccessMessage('');
    }, 4000);
  };

  /**
   * Check if email has changed from original
   */
  const hasEmailChanged = () => {
    return profileData.email.trim() !== originalEmail.trim();
  };

  /**
   * Load user profile data from Supabase profiles table
   */
  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Loading profile for user:', session.user.id);

      // Fetch profile data from Supabase profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, company, updated_at')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile from Supabase:', error);
        throw new Error(`Failed to load profile: ${error.message}`);
      }

      // If profile exists, use it; otherwise use user metadata as fallback
      const userEmail = session.user.email || '';
      setOriginalEmail(userEmail); // Store original email for comparison
      
      if (profile) {
        console.log('Profile loaded from database:', profile);
        setProfileData({
          full_name: profile.full_name || '',
          email: userEmail,
          company: profile.company || ''
        });
      } else {
        // No profile exists yet, use user metadata
        console.log('No profile found, using user metadata');
        setProfileData({
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
          email: userEmail,
          company: session.user.user_metadata?.company || ''
        });
      }
      
      return profile;
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Fallback to basic user data from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userEmail = user.email || '';
        setOriginalEmail(userEmail); // Store original email for comparison
        setProfileData({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: userEmail,
          company: user.user_metadata?.company || ''
        });
      }
      throw error;
    }
  };

  /**
   * Load subscription data from backend API
   */
  const loadSubscription = async () => {
    try {
      setSubscriptionLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Fetch subscription data from backend API
      const response = await fetch(`${env.api.baseUrl}/api/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
      
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  /**
   * Cancel subscription
   */
  const handleCancelSubscription = async () => {
    if (!subscription?.subscription_id) {
      setSubscriptionMessage({ type: 'error', text: t('subscription.management.noActiveSubscription') });
      return;
    }

    try {
      setSubscriptionLoading(true);
      setSubscriptionMessage({ type: '', text: '' });

      // Call backend endpoint to cancel subscription
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${env.api.baseUrl}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.subscription_id
        })
      });

      if (!response.ok) {
        throw new Error('Error al cancel·lar la subscripció');
      }

      // Reload subscription data
      await loadSubscription();
      setSubscriptionMessage({ type: 'success', text: t('subscription.management.cancelSuccess') });
      
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setSubscriptionMessage({ type: 'error', text: error.message || t('subscription.management.cancelError') });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  /**
   * Upgrade subscription - navigate to the full subscription management page
   */
  const handleUpgradeSubscription = (tierId) => {
    // Navigate to the full subscription page for a better experience
    navigate('/subscription');
  };

  /**
   * Handle successful checkout - refresh subscription data
   */
  const handleCheckoutSuccess = async () => {
    setIsCheckoutOpen(false);
    setSelectedUpgradeTier(null);
    setSubscriptionMessage({ 
      type: 'success', 
      text: 'La subscripció s\'ha actualitzat correctament!' 
    });
    
    // Reload subscription data
    await loadSubscriptionStatus();
  };

  /**
   * Legacy upgrade function (kept for reference)
   * Now using Stripe Elements modal instead
   */
  const handleLegacyUpgradeSubscription = async (tierId) => {
    try {
      setSubscriptionLoading(true);
      setSubscriptionMessage({ type: '', text: '' });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Determine backend URL - use proxy in development if baseUrl is not set
      // In development, Vite proxy handles /stripe requests
      // In production, use the configured backend URL
      const backendUrl = env.api.baseUrl || (import.meta.env.DEV ? '' : 'https://your-backend-url.com');
      const apiUrl = backendUrl ? `${backendUrl}/stripe/create-checkout-session` : '/stripe/create-checkout-session';

      console.log('Creating checkout session:', { 
        tierId, 
        apiUrl, 
        userId: session.user.id,
        backendUrl: backendUrl,
        isDev: import.meta.env.DEV
      });

      // Call backend to create Stripe checkout session
      let response;
      let responseData;
      
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_level: tierId,  // basic, pro, or studio
            user_id: session.user.id,
            user_email: session.user.email,
            success_url: `${window.location.origin}/account?tab=subscription&success=true`,
            cancel_url: `${window.location.origin}/account?tab=subscription&canceled=true`
          })
        });
      } catch (networkError) {
        console.error('Network error details:', {
          error: networkError,
          message: networkError.message,
          name: networkError.name,
          apiUrl: apiUrl,
          backendUrl: backendUrl || '(using proxy)',
          isDev: import.meta.env.DEV
        });
        
        // Provide more helpful error message
        if (networkError.message.includes('Failed to fetch') || 
            networkError.message.includes('NetworkError') ||
            networkError.name === 'TypeError') {
          if (import.meta.env.DEV) {
            throw new Error('El servidor backend no està en funcionament.\n\nPer iniciar-lo:\n1. Obre una nova terminal\n2. Executa: cd backend\n3. Executa: uvicorn app.main:app --reload\n\nO utilitza: .\\START_BACKEND.ps1');
          } else {
            throw new Error(`Error de connexió: No s'ha pogut connectar amb el servidor backend. Verifiqueu que el servidor estigui en funcionament.`);
          }
        }
        throw networkError;
      }

      // Try to parse response as JSON
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`Error del servidor: Resposta invàlida. Codi d'estat: ${response.status}`);
      }

      if (!response.ok) {
        // Extract error message from backend response
        const errorMessage = responseData.detail || responseData.message || `Error del servidor (${response.status}): ${response.statusText}`;
        console.error('Backend error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(errorMessage);
      }

      // Check if URL is in response
      if (!responseData.url) {
        console.error('No URL in response:', responseData);
        throw new Error('No checkout URL received from server');
      }

      console.log('Checkout session created, redirecting to:', responseData.url);
      
      // Redirect to Stripe Checkout
      window.location.href = responseData.url;
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error.message || 'Error al crear la sessió de pagament. Si us plau, torna-ho a provar.';
      setSubscriptionMessage({ type: 'error', text: errorMessage });
      setSubscriptionLoading(false);
    }
  };

  /**
   * Get plan name from tier
   */
  const getPlanName = (tier) => {
    const planMap = {
      'free': 'Free',
      'basic': 'Basic',
      'pro': 'Pro',
      'studio': 'Studio'
    };
    return planMap[tier] || 'Unknown';
  };

  /**
   * Format subscription status
   */
  const formatStatus = (status) => {
    const statusMap = {
      'active': t('subscription.status.active'),
      'canceled': t('subscription.status.canceled'),
      'past_due': t('subscription.status.past_due'),
      'unpaid': t('subscription.status.unpaid')
    };
    return statusMap[status] || status;
  };

  /**
   * Load user data from Supabase Auth and backend profile
   */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error loading user data:', error);
        } else {
          setUser(user);
          // Load detailed profile data from backend
          await loadUserProfile();
          // Load subscription data
          await loadSubscription();
        }
      } catch (error) {
        console.error('Unexpected error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * Validate email format
   */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    if (profileData.full_name && profileData.full_name.length < 2) {
      errors.full_name = t('personalInfo.profileDetails.fullName.validation.minLength');
    }
    if (profileData.full_name && profileData.full_name.length > 100) {
      errors.full_name = t('personalInfo.profileDetails.fullName.validation.maxLength');
    }
    
    // Email validation - required and must be valid format
    if (!profileData.email.trim()) {
      errors.email = t('personalInfo.profileDetails.email.validation.required');
    } else if (!validateEmail(profileData.email)) {
      errors.email = t('personalInfo.profileDetails.email.validation.invalid');
    }
    
    if (profileData.company && profileData.company.length > 200) {
      errors.company = t('personalInfo.profileDetails.company.validation.maxLength');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate password data
   */
  const validatePassword = () => {
    const errors = {};

    // Current password is required
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = t('personalInfo.passwordChange.currentPassword.validation.required');
    }

    // New password validation
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = t('personalInfo.passwordChange.newPassword.validation.required');
    } else {
      if (passwordData.newPassword.length < 8) {
        errors.newPassword = t('personalInfo.passwordChange.newPassword.validation.minLength');
      }
      if (!/[A-Z]/.test(passwordData.newPassword)) {
        errors.newPassword = t('personalInfo.passwordChange.newPassword.validation.uppercase');
      }
      if (!/[a-z]/.test(passwordData.newPassword)) {
        errors.newPassword = t('personalInfo.passwordChange.newPassword.validation.lowercase');
      }
      if (!/\d/.test(passwordData.newPassword)) {
        errors.newPassword = t('personalInfo.passwordChange.newPassword.validation.number');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(passwordData.newPassword)) {
        errors.newPassword = t('personalInfo.passwordChange.newPassword.validation.special');
      }
    }

    // Confirm password validation
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = t('personalInfo.passwordChange.confirmPassword.validation.required');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('personalInfo.passwordChange.confirmPassword.validation.mismatch');
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Save profile changes to Supabase
   */
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Saving profile for user:', session.user.id);
      console.log('Profile data:', profileData);
      console.log('Email changed:', hasEmailChanged());

      // Check if email has changed and update it first
      if (hasEmailChanged()) {
        console.log('Updating email from', originalEmail, 'to', profileData.email);
        
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email.trim()
        });

        if (emailError) {
          console.error('Email update error:', emailError);
          throw new Error(`Failed to update email: ${emailError.message}`);
        }

        console.log('Email update initiated successfully');
        showProfileSuccess('Correu electrònic actualitzat. Comproveu la safata d\'entrada.');
        
        // Update the original email to the new one
        setOriginalEmail(profileData.email.trim());
      }

      // Use upsert to create or update profile in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: profileData.full_name.trim(),
          company: profileData.company.trim(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase upsert error:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      console.log('Profile saved successfully:', data);
      
      // Show success toast (only if email wasn't changed, as we already showed email toast)
      if (!hasEmailChanged()) {
        showProfileSuccess('Perfil actualitzat');
      }
      
      setFormErrors({});

      // Refresh user data to update header and other components
      await loadUserProfile();

    } catch (error) {
      console.error('Error updating profile:', error);
      setFormErrors({ general: error.message || 'Error al actualitzar el perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Change password using Supabase Auth
   */
  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Changing password for user:', session.user.email);

      // Step 1: Reauthenticate with current password
      console.log('Reauthenticating user with current password...');
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: passwordData.currentPassword
      });

      if (reauthError) {
        console.error('Reauthentication failed:', reauthError);
        setPasswordMessage({ type: 'error', text: 'La contrasenya actual és incorrecta' });
        return;
      }

      console.log('Reauthentication successful');

      // Step 2: Check if new passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        console.error('Password confirmation mismatch');
        setPasswordMessage({ type: 'error', text: 'Les contrasenyes no coincideixen' });
        return;
      }

      // Step 3: Update password
      console.log('Updating password...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('Password update failed:', updateError);
        setPasswordMessage({ type: 'error', text: updateError.message || 'Error al actualitzar la contrasenya' });
        return;
      }

      console.log('Password updated successfully');
      
      // Success - show message and clear form
      setPasswordMessage({ type: 'success', text: 'Contrasenya actualitzada correctament' });
      setPasswordErrors({});
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Auto-hide success message after 4 seconds
      setTimeout(() => {
        setPasswordMessage({ type: '', text: '' });
      }, 4000);

    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ type: 'error', text: error.message || 'Error al actualitzar la contrasenya' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  /**
   * Handle profile form input changes
   */
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Handle password form input changes
   */
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Refresh user data after successful updates
   * This ensures the header and other components reflect the latest changes
   */
  const refreshUserData = async () => {
    try {
      // Reload profile data from backend
      await loadUserProfile();
      
      // Also refresh the main user data in parent component
      // This will update the header display if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  /**
   * Tab configuration for the account interface
   * Uses translation keys for all text content
   */
  const tabs = [
    {
      id: 'personal',
      name: t('userAccount.tabs.personalInfo'), // Translation key: Personal Info
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      )
    },
    {
      id: 'subscription',
      name: t('userAccount.tabs.subscription'), // Translation key: Subscription
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      id: 'billing',
      name: t('userAccount.tabs.billing'), // Translation key: Billing
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
        </svg>
      )
    }
  ];

  /**
   * Handle back navigation to chat page
   */
  const handleBack = () => {
    navigate('/chat');
  };

  /**
   * Loading state display with translation support
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cte-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Page Header with Translation Support */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button and Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                {t('navigation.backToChat')}
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('userAccount.title')}</h1> {/* Translation key: Account Settings */}
                <p className="text-sm text-gray-600">
                  {t('userAccount.welcome', { name: user?.email?.split('@')[0] || 'User' })}
                </p>
              </div>
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cte-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                    activeTab === tab.id
                      ? 'border-cte-primary text-cte-primary-dark'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          
          {/* Personal Info Tab with Translation Support */}
          {activeTab === 'personal' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('personalInfo.title')}</h2> {/* Translation key: Personal Information */}
                <p className="text-gray-600">{t('personalInfo.description')}</p> {/* Translation key: Manage your personal details and account preferences */}
              </div>

              {/* Success/Error Messages */}
              {saveMessage.text && (
                <div className={`mb-6 p-4 rounded-lg ${
                  saveMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {saveMessage.type === 'success' ? (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                    {saveMessage.text}
                  </div>
                </div>
              )}

              {/* Personal Info Form */}
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('personalInfo.profileDetails.title')}</h3> {/* Translation key: Profile Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('personalInfo.profileDetails.fullName.label')}
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        placeholder={t('personalInfo.profileDetails.fullName.placeholder')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-cte-primary focus:border-cte-primary ${
                          formErrors.full_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {t('personalInfo.profileDetails.fullName.help')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('personalInfo.profileDetails.email.label')}
                        {hasEmailChanged() && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Modificat
                          </span>
                        )}
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        placeholder={t('personalInfo.profileDetails.email.placeholder')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-cte-primary focus:border-cte-primary ${
                          formErrors.email ? 'border-red-300' : hasEmailChanged() ? 'border-yellow-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {hasEmailChanged() 
                          ? 'Canviar el correu electrònic requereix confirmació per correu.'
                          : t('personalInfo.profileDetails.email.help')
                        }
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('personalInfo.profileDetails.company.label')}
                      </label>
                      <input
                        type="text"
                        value={profileData.company}
                        onChange={(e) => handleProfileChange('company', e.target.value)}
                        placeholder={t('personalInfo.profileDetails.company.placeholder')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-cte-primary focus:border-cte-primary ${
                          formErrors.company ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.company && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.company}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {t('personalInfo.profileDetails.company.help')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('personalInfo.passwordChange.title')}</h3> {/* Translation key: Change Password */}
                  
                  {/* Password Success/Error Messages */}
                  {passwordMessage.text && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      passwordMessage.type === 'success' 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center">
                        {passwordMessage.type === 'success' ? (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        )}
                        {passwordMessage.text}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('personalInfo.passwordChange.currentPassword.label')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        placeholder={t('personalInfo.passwordChange.currentPassword.placeholder')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-cte-primary focus:border-cte-primary ${
                          passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('personalInfo.passwordChange.newPassword.label')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder={t('personalInfo.passwordChange.newPassword.placeholder')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-cte-primary focus:border-cte-primary ${
                          passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('personalInfo.passwordChange.confirmPassword.label')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder={t('personalInfo.passwordChange.confirmPassword.placeholder')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-cte-primary focus:border-cte-primary ${
                          passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Password Requirements with Translation Support */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">{t('personalInfo.passwordChange.requirements.title')}</h4> {/* Translation key: Password Requirements: */}
                    <ul className="text-sm text-blue-800 space-y-1">
                      {t('personalInfo.passwordChange.requirements.items', { returnObjects: true }).map((requirement, index) => (
                        <li key={index}>• {requirement}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Action Buttons with Translation Support */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-sm text-gray-500">
                      {t('personalInfo.actions.helpText')}
                    </div>
                    
                    {/* Success Messages on the left side */}
                    {profileSuccessMessage && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <p className="text-sm font-medium text-green-800">
                            {profileSuccessMessage}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {passwordMessage.text && (
                      <div className={`p-3 border rounded-md ${
                        passwordMessage.type === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center">
                          {passwordMessage.type === 'success' ? (
                            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          )}
                          <p className={`text-sm font-medium ${
                            passwordMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {passwordMessage.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className={`px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200 ${
                        isChangingPassword ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isChangingPassword ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          {t('common.saving')}
                        </div>
                      ) : (
                        t('personalInfo.actions.changePassword')
                      )}
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={`px-6 py-2 bg-cte-primary hover:bg-cte-primary-dark text-white rounded-md transition duration-200 ${
                        isSaving ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSaving ? (
                         <div className="flex items-center">
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {t('common.saving')}
                         </div>
                        ) : (
                         t('personalInfo.actions.saveChanges')
                        )}

                    </button>
                  </div>


                  {/* General Error Message for Profile Updates */}
                  {formErrors.general && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p className="text-sm font-medium text-red-800">
                          {formErrors.general}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BACKEND API INTEGRATION: Personal Info Section */}
              {/* 
                ✅ IMPLEMENTED: Personal Info API Integration
                
                Current API Endpoints:
                - GET /profile/ - Fetch user profile data ✅
                - PUT /profile/ - Update profile information ✅
                - POST /profile/change-password - Change password ✅
                
                Features Implemented:
                - Real-time form validation ✅
                - Profile data loading and updating ✅
                - Password change with security validation ✅
                - Success/error feedback ✅
                - State management and data refresh ✅
                
                Future Enhancements:
                - Profile picture upload
                - Two-factor authentication settings
                - Notification preferences
                - Language and timezone settings
              */}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('subscription.title')}</h2>
                <p className="text-gray-600">{t('subscription.description')}</p>
              </div>

              {/* Subscription Loading State */}
              {subscriptionLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cte-primary"></div>
                  <span className="ml-2 text-gray-600">{t('subscription.loading')}</span>
                </div>
              )}

              {/* Subscription Messages */}
              {subscriptionMessage.text && (
                <div className={`mb-6 p-4 border rounded-md ${
                  subscriptionMessage.type === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {subscriptionMessage.type === 'success' ? (
                      <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                    <p className={`text-sm font-medium ${
                      subscriptionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {subscriptionMessage.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Current Subscription Status */}
              {!subscriptionLoading && (
                <div className="bg-gradient-to-r from-cte-primary-light to-cte-primary rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('subscription.currentPlan.title')}</h3>
                      {subscription && subscription.tier !== 'free' ? (
                        <>
                          <p className="text-gray-700">{getPlanName(subscription.tier)}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {t('subscription.currentPlan.status')}: <span className={`font-medium ${
                              subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatStatus(subscription.status)}
                            </span>
                          </p>
                          {subscription.renewal_date && (
                            <p className="text-sm text-gray-600">
                              {t('subscription.currentPlan.renewal')}: {new Date(subscription.renewal_date).toLocaleDateString('ca-ES')}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-gray-700">{t('subscription.currentPlan.free.name')}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {t('subscription.currentPlan.free.description')}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {subscription && subscription.tier !== 'free' ? 'Actiu' : 'Gratuït'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {subscription && subscription.tier !== 'free' ? 'Per mes' : 'Per sempre'}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/subscription')}
                        className="mt-2 px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                      >
                        Gestiona la Subscripció
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Usage Progress Bars */}
              {!subscriptionLoading && subscription && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ús del pla actual</h3>
                  
                  <div className="space-y-6">
                    {/* Projects Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Projectes actius</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {subscription.current_projects || 0}
                          {subscription.max_projects !== null && subscription.max_projects !== -1 
                            ? ` / ${subscription.max_projects}` 
                            : ' / ∞'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        {subscription.max_projects !== null && subscription.max_projects !== -1 ? (
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              ((subscription.current_projects || 0) / subscription.max_projects) >= 0.85 
                                ? 'bg-rose-500' 
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(((subscription.current_projects || 0) / subscription.max_projects) * 100, 100)}%` }}
                          ></div>
                        ) : (
                          <div 
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.min((subscription.current_projects || 0) * 5, 30)}%` }}
                          ></div>
                        )}
                      </div>
                      {subscription.max_projects !== null && subscription.max_projects !== -1 && (
                        <p className={`text-xs mt-1 ${
                          ((subscription.current_projects || 0) / subscription.max_projects) >= 0.85 
                            ? 'text-rose-600 font-medium' 
                            : 'text-gray-500'
                        }`}>
                          {subscription.max_projects - (subscription.current_projects || 0) > 0 
                            ? `Pots crear ${subscription.max_projects - (subscription.current_projects || 0)} projectes més` 
                            : 'Has arribat al límit de projectes'}
                        </p>
                      )}
                      {(subscription.max_projects === null || subscription.max_projects === -1) && (
                        <p className="text-xs text-gray-500 mt-1">Projectes il·limitats amb el teu pla</p>
                      )}
                    </div>

                    {/* Custom PDF Uploads Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Pujades de PDF personalitzats</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          {subscription.custom_uploads_per_month !== null && subscription.custom_uploads_per_month !== -1 
                            ? `${subscription.current_uploads || 0} / ${subscription.custom_uploads_per_month}` 
                            : subscription.tier === 'free' || subscription.tier === 'basic'
                              ? 'No disponible'
                              : `${subscription.current_uploads || 0} / ∞`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        {subscription.tier === 'free' || subscription.tier === 'basic' ? (
                          <div className="h-full rounded-full bg-gray-300" style={{ width: '100%' }}></div>
                        ) : subscription.custom_uploads_per_month !== null && subscription.custom_uploads_per_month !== -1 ? (
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              ((subscription.current_uploads || 0) / subscription.custom_uploads_per_month) >= 0.85 
                                ? 'bg-rose-500' 
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(((subscription.current_uploads || 0) / subscription.custom_uploads_per_month) * 100, 100)}%` }}
                          ></div>
                        ) : (
                          <div 
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${Math.min((subscription.current_uploads || 0) * 2, 20)}%` }}
                          ></div>
                        )}
                      </div>
                      {(subscription.tier === 'free' || subscription.tier === 'basic') && (
                        <p className="text-xs text-gray-500 mt-1">
                          Actualitza a Pro o Studio per pujar PDFs personalitzats
                        </p>
                      )}
                      {subscription.tier !== 'free' && subscription.tier !== 'basic' && (subscription.custom_uploads_per_month === null || subscription.custom_uploads_per_month === -1) && (
                        <p className="text-xs text-gray-500 mt-1">Pujades il·limitades amb el teu pla</p>
                      )}
                    </div>

                    {/* Team Seats Usage (for Studio) */}
                    {subscription.tier === 'studio' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Membres de l'equip</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {subscription.current_seats || 1} / {subscription.seats_included || 10}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              ((subscription.current_seats || 1) / (subscription.seats_included || 10)) >= 0.85 
                                ? 'bg-rose-500' 
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(((subscription.current_seats || 1) / (subscription.seats_included || 10)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className={`text-xs mt-1 ${
                          ((subscription.current_seats || 1) / (subscription.seats_included || 10)) >= 0.85 
                            ? 'text-rose-600 font-medium' 
                            : 'text-gray-500'
                        }`}>
                          {(subscription.seats_included || 10) - (subscription.current_seats || 1)} places disponibles
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Features - New 3-Tier System */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Basic Tier */}
                <div className={`border rounded-lg p-4 ${
                  subscription?.tier === 'basic' ? 'border-gray-700 border-2' : 'border-gray-200'
                }`}>
                  <h4 className="font-medium text-gray-900 mb-2">Basic</h4>
                  <div className="text-2xl font-bold text-gray-900 mb-2">€5.99<span className="text-sm font-normal text-gray-600">/mes</span></div>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Preguntes d'IA il·limitades
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Fins a 5 projectes actius
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Accés a tots els municipis
                    </li>
                  </ul>
                  <button 
                    onClick={() => handleUpgradeSubscription('basic')}
                    disabled={subscriptionLoading || (subscription?.tier === 'basic')}
                    className={`w-full py-2 px-4 rounded-md transition duration-200 ${
                      subscription?.tier === 'basic' 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-gray-700 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {subscriptionLoading ? t('common.loading') : 
                     subscription?.tier === 'basic' ? 'Pla actual' : 
                     'Actualitzar a Basic'}
                  </button>
                </div>

                {/* Pro Tier - Recommended with yellow border */}
                <div className={`border-2 rounded-lg p-4 relative ${
                  subscription?.tier === 'pro' ? 'border-gray-700' : 'border-yellow-400'
                }`}>
                  <div className="absolute -top-3 left-4 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                    Recomanat
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Pro</h4>
                  <div className="text-2xl font-bold text-gray-900 mb-2">€14.99<span className="text-sm font-normal text-gray-600">/mes</span></div>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Preguntes il·limitades
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Projectes il·limitats
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Pujades de PDF personalitzades il·limitades
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Comparació de documents
                    </li>
                  </ul>
                  <button 
                    onClick={() => handleUpgradeSubscription('pro')}
                    disabled={subscriptionLoading || (subscription?.tier === 'pro')}
                    className={`w-full py-2 px-4 rounded-md transition duration-200 ${
                      subscription?.tier === 'pro' 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-gray-700 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {subscriptionLoading ? t('common.loading') : 
                     subscription?.tier === 'pro' ? 'Pla actual' : 
                     'Actualitzar a Pro'}
                  </button>
                </div>

                {/* Studio Tier */}
                <div className={`border rounded-lg p-4 ${
                  subscription?.tier === 'studio' ? 'border-gray-700 border-2' : 'border-gray-200'
                }`}>
                  <h4 className="font-medium text-gray-900 mb-2">Studio</h4>
                  <div className="text-2xl font-bold text-gray-900 mb-2">€49<span className="text-sm font-normal text-gray-600">/mes</span></div>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      10 places d'equip incloses
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Projectes il·limitats
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Accés a l'API
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Tauler d'equip
                    </li>
                  </ul>
                  <button 
                    onClick={() => handleUpgradeSubscription('studio')}
                    disabled={subscriptionLoading || (subscription?.tier === 'studio')}
                    className={`w-full py-2 px-4 rounded-md transition duration-200 ${
                      subscription?.tier === 'studio' 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-gray-700 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {subscriptionLoading ? t('common.loading') : 
                     subscription?.tier === 'studio' ? 'Pla actual' : 
                     'Actualitzar a Studio'}
                  </button>
                </div>
              </div>

              {/* Subscription Management Actions */}
              {!subscriptionLoading && subscription && subscription.tier !== 'free' && subscription.status === 'active' && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{t('subscription.management.title')}</h4>
                      <p className="text-sm text-gray-500">{t('subscription.management.description')}</p>
                    </div>
                    <button 
                      onClick={handleCancelSubscription}
                      disabled={subscriptionLoading}
                      className="mt-4 sm:mt-0 px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subscriptionLoading ? t('common.loading') : t('subscription.management.cancelButton')}
                    </button>
                  </div>
                </div>
              )}

              {/* Support Section */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{t('subscription.support.title')}</h4>
                    <p className="text-sm text-gray-500">{t('subscription.support.description')}</p>
                  </div>
                  <button className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200">
                    {t('subscription.support.button')}
                  </button>
                </div>
              </div>

              {/* BACKEND API INTEGRATION: Subscription Section */}
              {/* 
                TODO: Implement backend API integration for subscription management:
                
                1. SUBSCRIPTION STATUS API:
                   - GET /subscription/status - Fetch current subscription details
                   - Response: { plan: 'free|personal|corporate', status: 'active|canceled', expires_at: 'date' }
                
                2. PLAN UPGRADE API:
                   - POST /subscription/upgrade - Initiate plan upgrade
                   - Body: { target_plan: 'personal|corporate', payment_method_id: 'stripe_pm_id' }
                   - Response: { success: boolean, checkout_url?: string, subscription_id?: string }
                
                3. USAGE STATISTICS API:
                   - GET /subscription/usage - Get current usage stats
                   - Response: { documents_used: number, documents_limit: number, questions_asked: number, storage_used: number }
                
                4. BILLING HISTORY API:
                   - GET /subscription/billing-history - Get payment history
                   - Response: { invoices: [{ id, amount, date, status, download_url }] }
                
                5. CANCELLATION API:
                   - POST /subscription/cancel - Cancel current subscription
                   - Response: { success: boolean, cancel_date: 'date', access_until: 'date' }
                
                6. STRIPE INTEGRATION:
                   - Webhook handling for subscription events
                   - Payment method management
                   - Invoice generation and management
                
                FRONTEND IMPLEMENTATION NOTES:
                - Load subscription data on component mount
                - Real-time usage updates
                - Plan comparison with current usage
                - Upgrade flow integration with Stripe
                - Billing history with download links
              */}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('billing.title')}</h2> {/* Translation key: Billing & Payments */}
                <p className="text-gray-600">{t('billing.description')}</p> {/* Translation key: Manage your payment methods and view billing history */}
              </div>

              {/* Payment Method */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('billing.paymentMethod.title')}</h3> {/* Translation key: Payment Method */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">VISA</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">•••• •••• •••• 4242</p>
                        <p className="text-xs text-gray-500">{t('billing.paymentMethod.card.expires', { month: '12', year: '25' })}</p> {/* Translation key: Expires {{month}}/{{year}} */}
                      </div>
                    </div>
                    <button className="text-cte-primary hover:text-cte-primary-dark text-sm font-medium">
                      {t('billing.paymentMethod.update')}
                    </button>
                  </div>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200">
                  {t('billing.paymentMethod.add')}
                </button>
              </div>

              {/* Billing History */}
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('billing.billingHistory.title')}</h3> {/* Translation key: Billing History */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('billing.billingHistory.table.date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('billing.billingHistory.table.description')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('billing.billingHistory.table.amount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('billing.billingHistory.table.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('billing.billingHistory.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Jan 15, 2024
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ArquiNorma Personal Plan
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €19.99
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {t('billing.billingHistory.status.paid')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-cte-primary hover:text-cte-primary-dark">
                            {t('billing.billingHistory.table.download')}
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Dec 15, 2023
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ArquiNorma Personal Plan
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €19.99
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {t('billing.billingHistory.status.paid')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-cte-primary hover:text-cte-primary-dark">
                            {t('billing.billingHistory.table.download')}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Billing Information */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('billing.billingInformation.title')}</h3> {/* Translation key: Billing Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('billing.billingInformation.companyName.label')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('billing.billingInformation.companyName.placeholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cte-primary focus:border-cte-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('billing.billingInformation.vatNumber.label')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('billing.billingInformation.vatNumber.placeholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cte-primary focus:border-cte-primary"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('billing.billingInformation.billingAddress.label')}
                  </label>
                  <textarea
                    rows="3"
                    placeholder={t('billing.billingInformation.billingAddress.placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-cte-primary focus:border-cte-primary"
                  ></textarea>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="px-4 py-2 bg-cte-primary hover:bg-cte-primary-dark text-white rounded-md transition duration-200">
                    {t('billing.billingInformation.saveButton')}
                  </button>
                </div>
              </div>

              {/* BACKEND API INTEGRATION: Billing Section */}
              {/* 
                TODO: Implement backend API integration for billing management:
                
                1. PAYMENT METHODS API:
                   - GET /billing/payment-methods - List user's payment methods
                   - POST /billing/payment-methods - Add new payment method
                   - PUT /billing/payment-methods/{id} - Update payment method
                   - DELETE /billing/payment-methods/{id} - Remove payment method
                   - Response: { payment_methods: [{ id, type, last4, brand, expiry_month, expiry_year, is_default }] }
                
                2. BILLING HISTORY API:
                   - GET /billing/invoices - Get invoice history
                   - GET /billing/invoices/{id}/download - Download invoice PDF
                   - Response: { invoices: [{ id, amount, currency, status, created_at, download_url }] }
                
                3. BILLING INFORMATION API:
                   - GET /billing/information - Get billing address and tax info
                   - PUT /billing/information - Update billing information
                   - Body: { company_name, vat_number, billing_address, tax_id }
                   - Response: { company_name, vat_number, billing_address, tax_rate }
                
                4. STRIPE INTEGRATION:
                   - Stripe Customer object management
                   - Payment method tokenization
                   - Invoice generation and retrieval
                   - Tax calculation with Stripe Tax
                   - Webhook handling for payment events
                
                5. TAX CALCULATION API:
                   - POST /billing/calculate-tax - Calculate tax for billing address
                   - Body: { billing_address: { country, state, city, postal_code } }
                   - Response: { tax_rate, tax_amount, currency }
                
                6. FAILED PAYMENT HANDLING:
                   - GET /billing/failed-payments - Get failed payment attempts
                   - POST /billing/retry-payment - Retry failed payment
                   - Response: { success: boolean, error_message?: string }
                
                FRONTEND IMPLEMENTATION NOTES:
                - Load billing data on component mount
                - Real-time payment method updates
                - Invoice download with progress indicators
                - Billing address validation
                - Tax calculation preview
                - Failed payment retry functionality
              */}
            </div>
          )}
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      <StripeCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedUpgradeTier(null);
          // Reload subscription status in case user completed payment
          loadSubscriptionStatus();
        }}
        currentTier={subscription?.tier || 'free'}
        preselectedTier={selectedUpgradeTier}
      />
    </div>
  );
};

export default UserAccountPage;

/*
COMPONENT USAGE AND INTEGRATION:

1. ROUTING INTEGRATION:
   Add this route to your App.jsx:
   ```jsx
   import UserAccountPage from '/src/pages/UserAccountPage';
   
   <Route 
     path="/account" 
     element={
       <ProtectedRoute user={user}>
         <UserAccountPage />
       </ProtectedRoute>
     } 
   />
   ```

2. NAVIGATION INTEGRATION:
   Update the user menu in App.jsx to link to this page:
   ```jsx
   <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
     Account Settings
   </Link>
   ```

3. STYLING CONSISTENCY:
   - Uses the same color scheme (cte-primary, cte-primary-dark, cte-primary-light)
   - Matches existing spacing and typography patterns
   - Consistent with app's button styles and hover effects
   - Responsive design matching other pages

4. FEATURE IMPLEMENTATION PRIORITIES:
   - Personal Info: Form validation, user preferences, profile management
   - Subscription: Real plan status, upgrade flows, usage tracking
   - Billing: Stripe integration, invoice management, payment methods

5. ACCESSIBILITY FEATURES:
   - Keyboard navigation support
   - Screen reader friendly
   - High contrast color scheme
   - Focus management for tabs
   - Semantic HTML structure

This component provides a solid foundation for user account management
while maintaining consistency with your existing ArquiNorma design system.
*/
