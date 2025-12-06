/**
 * i18next Configuration for ArquiNorma
 * 
 * This file configures internationalization (i18n) for the ArquiNorma application.
 * It supports multiple languages with Catalan as the default language.
 * 
 * Supported Languages:
 * - 'ca' (Català) - Default language
 * - 'es' (Español) - Spanish fallback
 * - 'en' (English) - English fallback
 * 
 * Features:
 * - Automatic language detection from browser
 * - Fallback to Catalan if language not supported
 * - Namespace organization for better maintainability
 * - Lazy loading of translation resources
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import caTranslations from './locales/ca.json';
import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';

/**
 * Translation resources organized by language
 * Each language contains all the translation keys for the application
 */
const resources = {
  ca: {
    translation: caTranslations
  },
  es: {
    translation: esTranslations
  },
  en: {
    translation: enTranslations
  }
};

/**
 * i18next configuration
 */
i18n
  // Detect user language from browser settings
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Language resources
    resources,
    
    // Default language (Catalan)
    lng: 'ca',
    
    // Fallback language if translation key is missing
    fallbackLng: ['es', 'en'],
    
    // Debug mode (set to false in production)
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation options
    interpolation: {
      // React already does escaping
      escapeValue: false,
    },
    
    // Language detection options
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys to store language preference
      caches: ['localStorage'],
      
      // Look for language in these query parameters
      lookupQuerystring: 'lng',
      
      // Default language if detection fails
      lookupLocalStorage: 'arquinorma-language',
    },
    
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',
    
    // React i18next options
    react: {
      // Use Suspense for loading translations
      useSuspense: false,
    },
  });

/**
 * Language switcher utility functions
 * These can be used to programmatically change languages
 */

/**
 * Change the application language
 * @param {string} languageCode - Language code ('ca', 'es', 'en')
 */
export const changeLanguage = (languageCode) => {
  i18n.changeLanguage(languageCode);
  // Store language preference in localStorage
  localStorage.setItem('arquinorma-language', languageCode);
};

/**
 * Get the current language
 * @returns {string} Current language code
 */
export const getCurrentLanguage = () => {
  return i18n.language;
};

/**
 * Get available languages
 * @returns {Array} Array of available language objects
 */
export const getAvailableLanguages = () => {
  return [
    { code: 'ca', name: 'Català', flag: '🇪🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];
};

/**
 * Check if a language is supported
 * @param {string} languageCode - Language code to check
 * @returns {boolean} True if language is supported
 */
export const isLanguageSupported = (languageCode) => {
  return Object.keys(resources).includes(languageCode);
};

// Export the configured i18n instance
export default i18n;

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic translation:
 *    ```jsx
 *    import { useTranslation } from 'react-i18next';
 *    
 *    const MyComponent = () => {
 *      const { t } = useTranslation();
 *      return <h1>{t('welcome.title')}</h1>;
 *    };
 *    ```
 * 
 * 2. Translation with variables:
 *    ```jsx
 *    const message = t('welcome.message', { name: 'John' });
 *    ```
 * 
 * 3. Pluralization:
 *    ```jsx
 *    const count = t('items.count', { count: 5 });
 *    ```
 * 
 * 4. Language switching:
 *    ```jsx
 *    import { changeLanguage } from './i18n';
 *    
 *    const LanguageSwitcher = () => {
 *      return (
 *        <select onChange={(e) => changeLanguage(e.target.value)}>
 *          <option value="ca">Català</option>
 *          <option value="es">Español</option>
 *          <option value="en">English</option>
 *        </select>
 *      );
 *    };
 *    ```
 * 
 * 5. Namespace usage:
 *    ```jsx
 *    const { t } = useTranslation('namespace');
 *    ```
 */





















