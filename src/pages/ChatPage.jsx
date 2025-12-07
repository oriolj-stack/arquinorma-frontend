import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { env } from '../config/env';

/**
 * FormattedResponse Component - Renders bot responses with markdown-like formatting
 */
const FormattedResponse = ({ text }) => {
  if (!text) return null;

  // Split text into lines and process each one
  const lines = text.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Skip empty lines
        if (!line.trim()) {
          return <div key={index} className="h-2"></div>;
        }

        // Bold headers (lines starting with **)
        if (line.startsWith('**') && line.endsWith('**')) {
          const content = line.slice(2, -2);
          return (
            <div key={index} className="font-semibold text-gray-900 mt-3 mb-1">
              {content}
            </div>
          );
        }

        // Section headers (lines ending with :)
        if (line.trim().endsWith(':') && line.length < 50) {
          return (
            <div key={index} className="font-medium text-gray-800 mt-2">
              {line}
            </div>
          );
        }

        // Quoted text (lines starting with ")
        if (line.trim().startsWith('"')) {
          return (
            <div key={index} className="italic text-gray-700 bg-gray-50 border-l-2 border-gray-300 pl-3 py-1 my-2">
              {line.trim()}
            </div>
          );
        }

        // Links with emojis (📄, 📖, 🔗)
        if (line.includes('📄') || line.includes('📖') || line.includes('🔗')) {
          // Check if it contains a markdown link
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = linkRegex.exec(line)) !== null) {
            // Add text before the link
            if (match.index > lastIndex) {
              parts.push(line.substring(lastIndex, match.index));
            }
            
            // Add the link
            parts.push(
              <a
                key={match.index}
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cte-primary hover:text-cte-primary-dark underline"
              >
                {match[1]}
              </a>
            );
            
            lastIndex = match.index + match[0].length;
          }
          
          // Add remaining text
          if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex));
          }

          return (
            <div key={index} className="text-gray-700 flex items-center space-x-1">
              {parts.length > 0 ? parts : line}
            </div>
          );
        }

        // Bullet points (lines starting with -)
        if (line.trim().startsWith('-')) {
          return (
            <div key={index} className="ml-4 text-gray-700">
              {line}
            </div>
          );
        }

        // Horizontal rule (---)
        if (line.trim() === '---') {
          return <hr key={index} className="my-3 border-gray-200" />;
        }

        // Regular text
        return (
          <div key={index} className="text-gray-700">
            {line}
          </div>
        );
      })}
    </div>
  );
};

/**
 * ChatPage Component - Refactored single-page chat interface
 * 
 * This component provides a clean chat interface that integrates with the new /ask endpoint.
 * Features:
 * - Single-page chat interface with no upload functionality
 * - Integration with POST /ask endpoint
 * - Citation cards with clickable PDF links
 * - Loading states and error handling
 * - Locale selection (Catalan/Spanish)
 * - Subscription status display
 * - Clean design with chat bubbles
 */
const ChatPage = () => {
  // Chat state management
  const [messages, setMessages] = useState([
    {
      id: 'welcome-bot-message',
      sender: 'bot',
      text: 'Hola! Sóc ArquiNorma, el vostre assistent per a normatives d\'arquitectura. Podeu fer-me preguntes sobre codis d\'edificació, regulacions i normatives tècniques.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quotes: [],
      confidence: 'High'
    }
  ]);
  
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState('ca'); // Default to Catalan
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  
  // Reference to input field and messages container
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSubmittingRef = useRef(false);
  
  // Backend API configuration
  const API_BASE_URL = env.api.baseUrl;
  
  // Debug: Expose API URL to window for console debugging
  if (typeof window !== 'undefined') {
    window.__ARQUINORMA_DEBUG__ = {
      apiBaseUrl: API_BASE_URL,
      env: import.meta.env.MODE,
      backendUrl: import.meta.env.VITE_BACKEND_URL,
      timestamp: new Date().toISOString()
    };
    console.log('🔧 ArquiNorma Debug Info:', window.__ARQUINORMA_DEBUG__);
  }

  /**
   * Effect to load user data and subscription info
   */
  useEffect(() => {
    loadUserData();
    checkRateLimits();
  }, []);

  /**
   * Effect to focus input field when component mounts
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Effect to scroll to bottom when new messages are added
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Effect to clear error messages after 5 seconds
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Load user data and subscription information
   */
  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      setUser(user);
      
      if (user) {
        // For now, default to 'free' subscription
        // TODO: Add subscription management when needed
        setSubscription({ level: 'free' });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setSubscription({ level: 'free' });
    }
  };

  /**
   * Check current rate limits
   */
  const checkRateLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const url = userId 
        ? `${API_BASE_URL}/api/ask/limits?user_id=${userId}`
        : `${API_BASE_URL}/api/ask/limits`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRateLimitInfo(data);
      }
    } catch (error) {
      console.error('Error checking rate limits:', error);
    }
  };

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Send question to the new /ask endpoint
   */
  const sendQuestionToBackend = async (question) => {
    try {
      // Validate API base URL is configured
      if (!API_BASE_URL || API_BASE_URL.trim() === '') {
        const errorMsg = 'Backend API URL is not configured. Please set VITE_BACKEND_URL in Vercel environment variables.';
        console.error('❌', errorMsg);
        console.error('Current API_BASE_URL:', API_BASE_URL);
        console.error('Environment:', import.meta.env.MODE);
        throw new Error(errorMsg);
      }
      
      const fullUrl = `${API_BASE_URL}/api/ask`;
      console.log(`Sending question to ${fullUrl}:`, question);
      console.log('API_BASE_URL:', API_BASE_URL);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        question: question.trim(),
        locale: locale,
        user_id: user?.id || null
      };
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include', // Include cookies for CORS
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          throw new Error(`Rate limit exceeded. ${errorData.detail?.upgrade_message || 'Please try again later.'}`);
        }
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      // Validate response structure
      if (!data.answer) {
        throw new Error('Invalid response format: missing answer field');
      }

      return {
        answer: data.answer,
        quotes: data.quotes || [],
        confidence: data.confidence || 'Medium'
      };
      
    } catch (error) {
      console.error('Error sending question to backend:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        API_BASE_URL: API_BASE_URL,
        fullUrl: API_BASE_URL ? `${API_BASE_URL}/api/ask` : 'N/A'
      });
      
      // Handle network/CORS errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const networkError = `Network error: Cannot connect to backend API.\n\n` +
          `API URL: ${API_BASE_URL || 'NOT CONFIGURED'}\n` +
          `This usually means:\n` +
          `1. VITE_BACKEND_URL is not set in Vercel environment variables, OR\n` +
          `2. The Cloudflare tunnel is not running, OR\n` +
          `3. There's a CORS configuration issue.\n\n` +
          `Check the browser console for more details.`;
        throw new Error(networkError);
      }
      
      // Always throw the same fallback error for consistency
      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
  };

  /**
   * Handle question submission
   */
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentQuestion.trim() || isLoading || isSubmittingRef.current) {
      return;
    }
    
    // Set submission guard
    isSubmittingRef.current = true;

    const userQuestion = currentQuestion.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to chat immediately
    const userMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: 'user',
      text: userQuestion,
      timestamp: timestamp,
      quotes: [],
      confidence: null
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setCurrentQuestion('');
    setIsLoading(true);
    setError('');

    try {
      // Send question to backend
      const response = await sendQuestionToBackend(userQuestion);
      
      // Add bot response to chat
      const botMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: 'bot',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quotes: response.quotes || [],
        confidence: response.confidence
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      
      // Update rate limit info
      await checkRateLimits();
      
    } catch (error) {
      console.error('Error in handleSubmitQuestion:', error);
      
      // Don't show error state, just create a temporary fallback message
      const fallbackMessage = {
        id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: 'bot',
        text: locale === 'ca' 
          ? 'Em sap greu, no puc donar-te una resposta ja que l\'assisten no està disponible ara mateix. Si us plau, torna a provar-ho d\'aqui a uns minuts.'
          : 'Lo siento, no puedo darte una respuesta ya que el asistente no está disponible ahora mismo. Por favor, vuelve a intentarlo en unos minutos.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quotes: [],
        confidence: 'Low',
        is_fallback: true
      };
      
      setMessages(prevMessages => [...prevMessages, fallbackMessage]);
      
      // Remove the fallback message after 10 seconds
      setTimeout(() => {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== fallbackMessage.id));
      }, 10000);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /**
   * Handle key down events
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmitQuestion(e);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    setCurrentQuestion(e.target.value);
    if (error) setError('');
  };

  /**
   * Handle locale change
   */
  const handleLocaleChange = (newLocale) => {
    setLocale(newLocale);
    
    // Update welcome message based on locale
    const welcomeMessages = {
      ca: 'Hola! Sóc ArquiNorma, el vostre assistent per a normatives d\'arquitectura. Podeu fer-me preguntes sobre codis d\'edificació, regulacions i normatives tècniques.',
      es: 'Hola! Soy ArquiNorma, tu asistente para normativas de arquitectura. Puedes preguntarme sobre códigos de edificación, regulaciones y normativas técnicas.',
      en: 'Hello! I\'m ArquiNorma, your assistant for architecture regulations. You can ask me about building codes, regulations and technical standards.'
    };
    
    setMessages(prevMessages => [
      {
        ...prevMessages[0],
        text: welcomeMessages[newLocale] || welcomeMessages.ca
      },
      ...prevMessages.slice(1)
    ]);
  };

  /**
   * Render citation card
   */
  const renderCitation = (quote, index) => (
    <div key={index} className="bg-amber-300 border border-cte-primary border-opacity-30 rounded-lg p-3 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-700 mb-2 italic">"{quote.text}"</p>
          <div className="flex items-center text-xs text-gray-500 space-x-4">
            <span className="font-medium">{quote.document_title}</span>
            <span>Pàg. {quote.page}</span>
            <span className="bg-cte-primary bg-opacity-20 text-cte-primary-dark px-2 py-1 rounded">
              Score: {(quote.score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <a
          href={quote.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 text-cte-primary hover:text-cte-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      </div>
    </div>
  );

  /**
   * Render subscription status
   */
  const renderSubscriptionStatus = () => {
    const subscriptionInfo = {
      free: { name: 'Gratuït', color: 'gray', limit: 5 },
      personal: { name: 'Personal', color: 'blue', limit: 100 },
      corporate: { name: 'Corporatiu', color: 'green', limit: 1000 }
    };

    const info = subscriptionInfo[subscription?.level] || subscriptionInfo.free;
    const remaining = rateLimitInfo?.requests_remaining || 0;

    return (
      <div className={`flex items-center space-x-2 text-sm px-3 py-1 rounded-full ${
        info.color === 'gray' ? 'bg-gray-100 text-gray-800' :
        info.color === 'blue' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          info.color === 'gray' ? 'bg-gray-500' :
          info.color === 'blue' ? 'bg-blue-500' :
          'bg-green-500'
        }`}></div>
        <span>{info.name}</span>
        <span>•</span>
        <span>{remaining}/{info.limit} preguntes</span>
      </div>
    );
  };

  /**
   * Render message bubble
   */
  const renderMessage = (message) => (
    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-xs lg:max-w-md ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          message.sender === 'user'
            ? 'bg-cte-primary text-white rounded-br-md'
            : message.is_fallback
            ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 rounded-bl-md'
            : 'bg-white border-l-4 border-cte-primary border-gray-200 text-gray-900 rounded-bl-md'
        }`}>
          {message.is_fallback && (
            <div className="text-xs text-yellow-600 mb-1 font-medium">
              ⚠️ Avís del servei
            </div>
          )}
          <div className={`text-xs font-medium mb-1 ${
            message.sender === 'user' ? 'text-white text-opacity-90' : 'text-gray-500'
          }`}>
            {message.sender === 'user' ? 'Tu' : 'ArquiNorma'}
          </div>
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.sender === 'bot' ? (
              <FormattedResponse text={message.text} />
            ) : (
              message.text
            )}
          </div>
          
          {/* Document sources footer (for bot messages) */}
          {message.sender === 'bot' && message.quotes && message.quotes.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                {message.quotes.map((quote, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{quote.document_title || 'Document desconegut'}</span>
                      <span>·</span>
                      <span>Pàg. {quote.page || 'N/A'}</span>
                    </div>
                    {quote.url && (
                      <a
                        href={quote.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cte-primary hover:text-cte-primary-dark underline ml-2"
                      >
                        Veure
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className={`text-xs ${
              message.sender === 'user' ? 'text-white text-opacity-75' : 
              message.is_fallback ? 'text-yellow-600' : 'text-gray-400'
            }`}>
              {message.timestamp}
            </div>
            {message.confidence && message.sender === 'bot' && (
              <div className={`text-xs px-2 py-1 rounded-full ${
                message.confidence === 'High' ? 'bg-green-100 text-green-800' :
                message.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {message.confidence === 'High' ? 'Alta confiança' :
                 message.confidence === 'Medium' ? 'Confiança mitjana' :
                 'Baixa confiança'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 bg-white shadow-lg">
        
        {/* Header with subscription status and locale selector */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">ArquiNorma Chat</h1>
              <p className="text-sm text-gray-600">Assistent per a normatives d'arquitectura</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Subscription status */}
              {subscription && renderSubscriptionStatus()}
              
              {/* Locale selector */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {['ca', 'es'].map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      locale === loc
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {loc === 'ca' ? 'Català' : 'Español'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center">
            <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.map(renderMessage)}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 border-l-4 border-cte-primary border-gray-200 rounded-bl-md">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cte-primary"></div>
                  <span className="text-sm text-gray-600">ArquiNorma està pensant...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <form className="flex space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={currentQuestion}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={locale === 'ca' ? 'Feu una pregunta sobre normatives...' : 'Haz una pregunta sobre normativas...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-cte-primary focus:border-cte-primary transition duration-200 text-sm"
                rows="2"
                disabled={isLoading}
                maxLength={500}
              />
            </div>
            <button
              type="button"
              onClick={handleSubmitQuestion}
              disabled={!currentQuestion.trim() || isLoading}
              className="px-6 py-2 bg-cte-primary text-white rounded-lg hover:bg-cte-primary-dark focus:outline-none focus:ring-2 focus:ring-cte-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 self-end flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ca' ? 'Enviant...' : 'Enviando...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  {locale === 'ca' ? 'Enviar' : 'Enviar'}
                </>
              )}
            </button>
          </form>
          
          {/* Helper text */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>{locale === 'ca' ? 'Premeu Enter per enviar, Shift+Enter per nova línia' : 'Presiona Enter para enviar, Shift+Enter para nueva línea'}</span>
            <span>{currentQuestion.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;