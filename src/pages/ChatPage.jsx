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
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locale, setLocale] = useState('ca'); // Default to Catalan
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Reference to input field and messages container
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSubmittingRef = useRef(false);
  
  // Backend API configuration
  const API_BASE_URL = env.api.baseUrl;
  
  // Debug info only exposed in local development builds
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    window.__ARQUINORMA_DEBUG__ = {
      apiBaseUrl: API_BASE_URL,
      env: import.meta.env.MODE,
      backendUrl: import.meta.env.VITE_BACKEND_URL,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Effect to load user data and subscription info
   */
  useEffect(() => {
    loadUserData();
    checkRateLimits();
  }, []);

  /**
   * Effect to load CTE messages when user is authenticated
   */
  useEffect(() => {
    if (user && !messagesLoaded) {
      loadCTEMessages();
    }
  }, [user, messagesLoaded]);

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
   * Load CTE chat messages from database.
   *
   * Render free tier sleeps after ~15 min idle (cold-start ≈ 30–60 s),
   * so we use a long abort timeout and retry once before giving up.
   */
  const loadCTEMessages = async () => {
    try {
      console.log('📖 Loading CTE messages from database...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('⚠️ No session, showing welcome message only');
        setMessages([getWelcomeMessage()]);
        setMessagesLoaded(true);
        return;
      }

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const fetchMessages = async (timeoutMs) => {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), timeoutMs);
        try {
          return await fetch(`${baseUrl}/api/cte/messages`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
            signal: ctl.signal,
            cache: 'no-store',
          });
        } finally {
          clearTimeout(timer);
        }
      };

      let response;
      try {
        response = await fetchMessages(75000);
      } catch (firstErr) {
        console.warn('First CTE messages fetch failed, retrying once:', firstErr?.message || firstErr);
        response = await fetchMessages(75000);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Loaded ${data.length} CTE messages`);

      // Convert database messages to UI format
      const uiMessages = data.map(msg => ({
        id: msg.id,
        sender: msg.role === 'user' ? 'user' : 'bot',
        text: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quotes: msg.quotes || [],
        confidence: msg.confidence
      }));

      // If no messages, show welcome message
      if (uiMessages.length === 0) {
        setMessages([getWelcomeMessage()]);
      } else {
        setMessages(uiMessages);
      }
      
      setMessagesLoaded(true);
    } catch (error) {
      console.error('❌ Error loading CTE messages:', error);
      // On error, show welcome message
      setMessages([getWelcomeMessage()]);
      setMessagesLoaded(true);
    }
  };

  /**
   * Get welcome message based on locale
   */
  const getWelcomeMessage = () => {
    const welcomeMessages = {
      ca: 'Hola! Sóc ArquiNorma, el vostre assistent per a normatives d\'arquitectura. Podeu fer-me preguntes sobre codis d\'edificació, regulacions i normatives tècniques.',
      es: 'Hola! Soy ArquiNorma, tu asistente para normativas de arquitectura. Puedes preguntarme sobre códigos de edificación, regulaciones y normativas técnicas.',
      en: 'Hello! I\'m ArquiNorma, your assistant for architecture regulations. You can ask me about building codes, regulations and technical standards.'
    };
    
    return {
      id: 'welcome-bot-message',
      sender: 'bot',
      text: welcomeMessages[locale] || welcomeMessages.ca,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quotes: [],
      confidence: 'High'
    };
  };

  /**
   * Save a message to the database and update state with the real DB id
   */
  const saveCTEMessage = async (messageData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/cte/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          role: messageData.sender === 'user' ? 'user' : 'assistant',
          content: messageData.text,
          quotes: messageData.quotes || [],
          confidence: messageData.confidence || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const saved = await response.json();

      // Update the local message with the real DB id so delete works
      setMessages(prev =>
        prev.map(m => m.id === messageData.id ? { ...m, dbId: saved.id } : m)
      );

      return saved;
    } catch (error) {
      console.error('❌ Error saving CTE message:', error);
      return null;
    }
  };

  /**
   * Delete a single message by its database id
   */
  const deleteCTEMessage = async (dbId, localId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/cte/messages/${dbId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove the message from local state
      setMessages(prev => prev.filter(m => m.id !== localId));
    } catch (error) {
      console.error('❌ Error deleting CTE message:', error);
      setError('Error esborrant el missatge. Si us plau, torna-ho a provar.');
    }
  };

  /**
   * Clear all CTE chat messages
   */
  const clearCTEMessages = async () => {
    try {
      console.log('🗑️  Clearing all CTE messages...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('⚠️ No session');
        return;
      }

      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/cte/messages`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Cleared messages:', result);

      // Reset to welcome message
      setMessages([getWelcomeMessage()]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('❌ Error clearing CTE messages:', error);
      setError('Error esborrant els missatges. Si us plau, torna-ho a provar.');
    }
  };

  /**
   * Check current rate limits
   */
  const checkRateLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      // Ensure no double slashes
      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const url = userId 
        ? `${baseUrl}/api/ask/limits?user_id=${userId}`
        : `${baseUrl}/api/ask/limits`;
      
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
      
      // Ensure no double slashes
      const baseUrl = API_BASE_URL?.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const fullUrl = `${baseUrl}/api/ask`;
      console.log(`Sending question to ${fullUrl}:`, question);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('baseUrl (normalized):', baseUrl);
      
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

    // Save user message to database (async, don't wait)
    saveCTEMessage(userMessage);

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
      
      // Save bot message to database (async, don't wait)
      saveCTEMessage(botMessage);
      
      // Update rate limit info
      await checkRateLimits();
      
    } catch (error) {
      console.error('Error in handleSubmitQuestion:', error);
      
      // Don't show error state, just create a temporary fallback message
      const fallbackMessage = {
        id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: 'bot',
        text: 'Em sap greu, no puc donar-te una resposta ja que l\'assisten no està disponible ara mateix. Si us plau, torna a provar-ho d\'aqui a uns minuts.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quotes: [],
        confidence: 'Low',
        is_fallback: true
      };
      
      setMessages(prevMessages => [...prevMessages, fallbackMessage]);
      
      // Don't save fallback messages to database
      
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
    
    // Update welcome message based on locale if it's the first message
    if (messages.length > 0 && messages[0].id === 'welcome-bot-message') {
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
    }
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
      corporate: { name: 'Corporatiu', color: 'green', limit: 1000 },
      beta: { name: 'Beta Tester', color: 'purple', limit: '∞' }
    };

    const info = subscriptionInfo[subscription?.level] || subscriptionInfo.free;
    const remaining = rateLimitInfo?.requests_remaining || 0;

    // Beta users have unlimited questions
    const isBeta = subscription?.level === 'beta' || rateLimitInfo?.subscription_level === 'beta';
    const displayRemaining = isBeta ? '∞' : remaining;
    const displayLimit = isBeta ? '∞' : info.limit;

    return (
      <div className={`flex items-center space-x-2 text-sm px-3 py-1 rounded-full ${
        info.color === 'gray' ? 'bg-gray-100 text-gray-800' :
        info.color === 'blue' ? 'bg-blue-100 text-blue-800' :
        info.color === 'purple' ? 'bg-purple-100 text-purple-800' :
        'bg-green-100 text-green-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          info.color === 'gray' ? 'bg-gray-500' :
          info.color === 'blue' ? 'bg-blue-500' :
          info.color === 'purple' ? 'bg-purple-500' :
          'bg-green-500'
        }`}></div>
        <span>{info.name}</span>
        <span>•</span>
        <span>{displayRemaining}/{displayLimit} preguntes</span>
      </div>
    );
  };

  /**
   * Render message bubble
   */
  const renderMessage = (message) => {
    // A message is deletable if it has a real DB id (uuid, not a local temp id)
    const isDeletable = message.dbId || (!message.id.startsWith('user-') && !message.id.startsWith('bot-') && !message.id.startsWith('welcome-') && !message.id.startsWith('fallback-'));
    const dbId = message.dbId || (isDeletable ? message.id : null);

    return (
    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-6 group`}>
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
          
          <div className="mt-2 flex items-center justify-between">
            <div className={`text-xs ${
              message.sender === 'user' ? 'text-white text-opacity-75' : 
              message.is_fallback ? 'text-yellow-600' : 'text-gray-400'
            }`}>
              {message.timestamp}
            </div>
            {/* Delete button — visible on hover, only for DB-persisted messages */}
            {isDeletable && dbId && (
              <button
                onClick={() => deleteCTEMessage(dbId, message.id)}
                title="Esborrar missatge"
                className={`opacity-0 group-hover:opacity-100 transition-opacity ml-2 ${
                  message.sender === 'user'
                    ? 'text-white text-opacity-60 hover:text-opacity-100'
                    : 'text-gray-400 hover:text-red-500'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 bg-white shadow-lg">
        
        {/* Header with subscription status and locale selector */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">CTE Xat</h1>
              <p className="text-sm text-gray-600">Assistent per al Codi Tècnic</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Subscription status */}
              {subscription && renderSubscriptionStatus()}
              
              {/* Clear Chat button */}
              {user && messages.length > 1 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center space-x-1"
                  title="Esborrar xat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  <span>Esborrar xat</span>
                </button>
              )}
              
              {/* Locale selector - Hidden for now */}
              {/* <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
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
              </div> */}
            </div>
          </div>
        </div>

        {/* Clear Chat Confirmation Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Esborrar xat
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Estàs segur que vols esborrar tot el xat del CTE? Aquesta acció no es pot desfer.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel·lar
                </button>
                <button
                  onClick={clearCTEMessages}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Esborrar
                </button>
              </div>
            </div>
          </div>
        )}

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
                placeholder="Feu una pregunta sobre normatives..."
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
                  Enviant...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  Enviar
                </>
              )}
            </button>
          </form>
          
          {/* Helper text */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>Premeu Enter per enviar, Shift+Enter per nova línia</span>
            <span>{currentQuestion.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;