import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * TrialExpirationBanner Component
 * 
 * Banner that appears when user's trial is expiring soon or has expired
 * Shows countdown and upgrade CTA
 * 
 * @param {Object} props
 * @param {number} props.daysRemaining - Days remaining in trial
 * @param {boolean} props.isExpired - Whether trial has expired
 * @param {Function} props.onDismiss - Optional dismiss handler
 */
const TrialExpirationBanner = ({ daysRemaining, isExpired, onDismiss }) => {
  const navigate = useNavigate();

  if (isExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                La teva prova gratuïta ha caducat
              </p>
              <p className="text-sm text-red-700 mt-1">
                Actualitza el teu pla per continuar utilitzant ArquiNorma
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/pricing')}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Veure plans
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (daysRemaining === null || daysRemaining > 7) {
    return null;
  }

  const urgency = daysRemaining <= 3 ? 'high' : 'medium';
  const bgColor = urgency === 'high' ? 'bg-orange-50' : 'bg-yellow-50';
  const borderColor = urgency === 'high' ? 'border-orange-500' : 'border-yellow-500';
  const textColor = urgency === 'high' ? 'text-orange-800' : 'text-yellow-800';
  const buttonColor = urgency === 'high' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-yellow-600 hover:bg-yellow-700';

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className={`h-5 w-5 ${urgency === 'high' ? 'text-orange-400' : 'text-yellow-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${textColor}`}>
              La teva prova gratuïta caduca en {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dies'}
            </p>
            <p className={`text-sm ${urgency === 'high' ? 'text-orange-700' : 'text-yellow-700'} mt-1`}>
              Actualitza ara per continuar gaudint de totes les funcionalitats
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/pricing')}
            className={`px-4 py-2 ${buttonColor} text-white text-sm font-medium rounded-md transition-colors`}
          >
            Actualitzar
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${urgency === 'high' ? 'text-orange-400 hover:text-orange-600' : 'text-yellow-400 hover:text-yellow-600'} transition-colors`}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialExpirationBanner;

