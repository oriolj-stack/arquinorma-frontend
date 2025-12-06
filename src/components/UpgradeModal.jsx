import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * UpgradeModal Component for ArquiNorma
 * 
 * A reusable modal component that prompts users to upgrade their subscription
 * when they hit quota limits or try to access premium features.
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Function to close the modal
 * - tier: Target tier to upgrade to ('pro' or 'studio')
 * - feature: Name of the feature that requires upgrade
 * - currentTier: User's current subscription tier
 * - quotaInfo: Optional quota information (e.g., projects used/limit)
 */

const UpgradeModal = ({
  isOpen,
  onClose,
  tier = 'pro',
  feature = 'this feature',
  currentTier = 'free',
  quotaInfo = null
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Tier configuration
  const tierConfig = {
    pro: {
      name: 'Pro',
      price: '€14.99/month',
      benefits: [
        'Unlimited projects',
        'Unlimited custom PDF uploads',
        'Priority embeddings',
        'Document comparison',
        'Multi-town projects'
      ],
      color: 'green'
    },
    studio: {
      name: 'Studio',
      price: '€49/month',
      benefits: [
        '10 team seats included',
        'Unlimited projects',
        'Unlimited custom PDF uploads',
        'Team dashboard',
        'Admin controls',
        'API access'
      ],
      color: 'orange'
    }
  };

  const config = tierConfig[tier] || tierConfig.pro;

  /**
   * Handle upgrade button click - redirect to pricing page
   */
  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  /**
   * Format quota information for display
   */
  const getQuotaMessage = () => {
    if (!quotaInfo) return null;

    if (quotaInfo.projects) {
      const { used, limit } = quotaInfo.projects;
      return `You have reached your project limit (${used}/${limit || 'unlimited'}).`;
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
              <svg className={`w-8 h-8 text-${config.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Upgrade Required
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-4">
            {quotaInfo ? (
              <>
                {getQuotaMessage()} Upgrade to <strong>{config.name}</strong> to unlock {feature}.
              </>
            ) : (
              <>
                <strong>{feature}</strong> requires a <strong>{config.name}</strong> subscription.
              </>
            )}
          </p>

          {/* Current Tier Badge */}
          {currentTier && currentTier !== 'free' && (
            <div className="bg-gray-100 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-gray-600">
                Current plan: <span className="font-medium capitalize">{currentTier}</span>
              </p>
            </div>
          )}

          {/* Benefits List */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              With {config.name}, you'll get:
            </h4>
            <ul className="space-y-2">
              {config.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-sm text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <p className="text-3xl font-bold text-gray-900">{config.price}</p>
            <p className="text-sm text-gray-500 mt-1">Cancel anytime</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`w-full bg-${config.color}-600 hover:bg-${config.color}-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Upgrade to ${config.name}`
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition duration-200"
            >
              Maybe Later
            </button>
          </div>

          {/* Security Notice */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Secure payment via Stripe • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;

