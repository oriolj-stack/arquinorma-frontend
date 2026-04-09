import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * UpgradeModal Component
 * 
 * Modal that appears when users hit subscription restrictions
 * Shows feature comparison and upgrade options
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler
 * @param {string} props.currentTier - User's current subscription tier
 * @param {string} props.requiredTier - Minimum tier required for feature
 * @param {string} props.feature - Feature name that triggered the modal
 * @param {string} props.message - Custom message to display
 */
const UpgradeModal = ({ 
  isOpen, 
  onClose, 
  currentTier = 'free', 
  requiredTier = 'pro',
  feature = '',
  message = ''
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const tierFeatures = {
    basic: {
      name: 'Bàsic',
      price: '5,99€/mes',
      features: [
        '5 projectes actius',
        'Preguntes il·limitades a l\'IA',
        'Accés complet a la normativa',
        'Suport per correu electrònic'
      ],
      color: 'blue'
    },
    pro: {
      name: 'Professional',
      price: '14,99€/mes',
      features: [
        'Projectes il·limitats',
        'Preguntes il·limitades a l\'IA',
        'Pujades de PDF personalitzats',
        'Comparació de documents',
        'Suport prioritari'
      ],
      color: 'purple',
      recommended: true
    },
    studio: {
      name: 'Estudi',
      price: '49,00€/mes',
      features: [
        'Tot el que inclou Pro',
        '10 membres de l\'equip',
        'Accés a l\'API',
        'Tauler d\'equip',
        'Controls d\'administrador'
      ],
      color: 'green'
    }
  };

  const handleUpgrade = (tier) => {
    navigate(`/pricing?selected=${tier}`);
    onClose();
  };

  const getFeatureMessage = () => {
    if (message) return message;

    const messages = {
      projects: 'Has arribat al límit de projectes del teu pla.',
      custom_uploads: 'Les pujades de PDF personalitzats estan disponibles en els plans Pro i Estudi.',
      api_access: 'L\'accés a l\'API està disponible només en el pla Estudi.',
      unlimited_projects: 'Els projectes il·limitats estan disponibles en els plans Pro i Estudi.',
      document_comparison: 'La comparació de documents està disponible en els plans Pro i Estudi.'
    };

    return messages[feature] || 'Aquesta funcionalitat requereix un pla superior.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Actualitza el teu pla</h2>
            <p className="text-sm text-gray-600 mt-1">{getFeatureMessage()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Tier Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Pla actual:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentTier === 'free' ? 'bg-gray-100 text-gray-800' :
              currentTier === 'basic' ? 'bg-blue-100 text-blue-800' :
              currentTier === 'pro' ? 'bg-purple-100 text-purple-800' :
              'bg-green-100 text-green-800'
            }`}>
              {tierFeatures[currentTier]?.name || 'Gratuït'}
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(tierFeatures).map(([tier, info]) => (
              <div
                key={tier}
                className={`relative rounded-lg border-2 p-6 ${
                  info.recommended 
                    ? 'border-purple-500 shadow-lg' 
                    : 'border-gray-200'
                } ${
                  currentTier === tier ? 'opacity-50' : ''
                }`}
              >
                {info.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Recomanat
                    </span>
                  </div>
                )}

                {currentTier === tier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Pla actual
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{info.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">{info.price.split('/')[0]}</span>
                    <span className="text-gray-600">/mes</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {info.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={currentTier === tier}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    currentTier === tier
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : info.recommended
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentTier === tier ? 'Pla actual' : 'Seleccionar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Pots cancel·lar en qualsevol moment. Sense compromisos.
          </p>
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
