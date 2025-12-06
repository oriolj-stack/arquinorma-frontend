import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import AuthPrompt from './AuthPrompt';
import { env } from '../config/env';

const ProjectChat = ({ projectId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsAuthenticated(false);
          setUser(null);
        } else if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUser(session.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setMessages([]); // Clear messages when user logs out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load messages when project changes or user authenticates
  useEffect(() => {
    if (projectId && isAuthenticated && user) {
      loadMessages();
    }
  }, [projectId, isAuthenticated, user]);

  const loadMessages = async () => {
    if (!projectId || !isAuthenticated || !user) return;

    try {
      setError(null);

      // Use Supabase client directly - RLS will handle access control
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        setError(`Failed to load messages: ${error.message}`);
        return;
      }

      // Set messages (data will be null if no messages found)
      // Deduplicate messages by ID AND content to prevent duplicates
      const uniqueMessages = [];
      const seenIds = new Set();
      const seenContent = new Set(); // Also check content to catch duplicates with different IDs
      
      if (data) {
        for (const msg of data) {
          // Create a unique key from role and first 100 chars of content + timestamp
          // This catches duplicates even if they have different IDs
          const contentKey = `${msg.role}-${msg.content.substring(0, 100)}-${msg.created_at}`;
          
          if (!seenIds.has(msg.id) && !seenContent.has(contentKey)) {
            seenIds.add(msg.id);
            seenContent.add(contentKey);
            uniqueMessages.push(msg);
          } else {
            console.log('⚠️ Duplicate message detected and filtered:', {
              id: msg.id,
              role: msg.role,
              contentPreview: msg.content.substring(0, 50),
              timestamp: msg.created_at
            });
          }
        }
      }
      
      // Sort by created_at to ensure chronological order
      uniqueMessages.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      setMessages(uniqueMessages);

    } catch (err) {
      console.error('Error loading messages:', err);
      setError(`Failed to load messages: ${err.message}`);
    }
  };

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !projectId || !isAuthenticated || !user || isSubmitting) {
      console.log('⚠️ sendMessage blocked:', {
        hasContent: !!content.trim(),
        hasProjectId: !!projectId,
        isAuthenticated,
        hasUser: !!user,
        isSubmitting
      });
      return;
    }
    
    console.log('📤 sendMessage called with content:', content.substring(0, 50) + '...');
    
    // Set submission guard
    setIsSubmitting(true);

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      project_id: projectId,
      user_id: user.id,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
      metadata: {}
    };

    // Add optimistic message to UI (temporary, will be replaced by real message from backend)
    setMessages(prev => {
      // Check if this message already exists to prevent duplicates
      const messageExists = prev.some(msg => msg.id === optimisticMessage.id);
      if (messageExists) {
        return prev;
      }
      return [...prev, optimisticMessage];
    });
    setNewMessage('');
    setIsLoading(true);

    try {
      // NOTE: Don't insert user message here - let the backend handle it
      // The backend endpoint will save both user and assistant messages
      // This prevents duplicate messages

      // Generate AI response via backend (backend will save user message)
      try {
        // Get the current session for authentication
        const { data: { session } } = await supabase.auth.getSession();
        
        // DEBUG: Log the URL being called
        const apiUrl = `${env.api.baseUrl}/api/projects/${projectId}/messages`;
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🔍 [${requestId}] Calling backend:`, apiUrl);
        console.log(`🔍 [${requestId}] Content:`, content.substring(0, 50) + '...');
        console.log(`🔍 [${requestId}] Timestamp:`, new Date().toISOString());
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            content: content.trim(),
            user_id: user.id,
            metadata: {}
          })
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();

        if (result.user_message && result.assistant_message) {
          // Check if the assistant message is a fallback (AI service unavailable)
          if (result.assistant_message.metadata?.is_fallback) {
            console.log('⚠️ AI service unavailable, showing fallback message');
          } else {
            console.log('✅ AI response received successfully');
          }
          
          // Remove optimistic message
          setMessages(prev => {
            return prev.filter(msg => msg.id !== optimisticMessage.id);
          });
          
          // Wait a brief moment for backend to finish saving, then reload
          // This prevents race conditions where we reload before messages are saved
          setTimeout(async () => {
            await loadMessages();
          }, 500);
        } else {
          throw new Error('Unexpected response structure from server');
        }

      } catch (aiError) {
        console.error('Error getting AI response:', aiError);
        
        // Instead of showing an error, create a fallback assistant message
        const fallbackMessage = {
          id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          project_id: projectId,
          role: 'assistant',
          content: 'Em sap greu, no puc donar-te una resposta ja que l\'assisten no està disponible ara mateix. Si us plau, torna a provar-ho d\'aqui a uns minuts.',
          created_at: new Date().toISOString(),
          metadata: { is_fallback: true }
        };
        
        // Replace optimistic message with fallback assistant message
        // Note: user message should have been saved by backend, but if backend failed,
        // we need to handle it. For now, just show fallback.
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
          return [...filtered, fallbackMessage];
        });
        
        console.log('⚠️ AI service error, showing temporary fallback message');
        
        // Remove the fallback message after 10 seconds
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== fallbackMessage.id));
        }, 10000);
      }

    } catch (err) {
      console.error('Error sending message:', err);
      
      // Remove optimistic message and show a fallback assistant message
      const fallbackMessage = {
        id: `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        created_at: new Date().toISOString(),
        metadata: { is_fallback: true }
      };
      
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== optimisticMessage.id);
        return [...filtered, fallbackMessage];
      });
      
      console.log('⚠️ Message sending error, showing fallback message');
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [projectId, isAuthenticated, user, isSubmitting, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Guard against double submissions
    if (!newMessage.trim() || isLoading || isSubmitting) {
      console.log('⚠️ Form submission blocked:', {
        hasMessage: !!newMessage.trim(),
        isLoading,
        isSubmitting
      });
      return;
    }
    
    console.log('📤 Form submitted, calling sendMessage');
    sendMessage(newMessage);
  };

  // Handle right-click context menu
  const handleMessageRightClick = (e, messageId) => {
    e.preventDefault();
    
    // Don't allow deletion of optimistic messages (temporary IDs)
    if (messageId && messageId.startsWith('temp-')) {
      console.log('⚠️ Cannot delete optimistic message:', messageId);
      return;
    }
    
    // Don't allow deletion of fallback messages
    if (messageId && messageId.startsWith('fallback-')) {
      console.log('⚠️ Cannot delete fallback message:', messageId);
      return;
    }
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId: messageId
    });
  };

  // Hide context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Render message content with markdown link parsing
  const renderMessageContent = (content) => {
    if (!content) return null;
    
    // Check if content contains markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let linkIndex = 0;
    
    // Find all markdown links in the content
    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add the link as a clickable element
      parts.push(
        <a
          key={`link-${linkIndex++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
        >
          {match[1]}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last link
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    // If no links found, return original content
    if (parts.length === 0) {
      return content;
    }
    
    return parts;
  };

  const deleteMessage = async (messageId) => {
    if (!messageId || deleteLoading) return;

    // Additional safety check for temporary IDs
    if (messageId.startsWith('temp-') || messageId.startsWith('fallback-')) {
      console.log('❌ Cannot delete temporary message:', messageId);
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
      return;
    }

    try {
      setDeleteLoading(true);
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });

      console.log(`🗑️ Attempting to delete message ${messageId} from project ${projectId}`);
      console.log(`🔍 Message ID type: ${typeof messageId}`);
      console.log(`🔍 Message ID length: ${messageId.length}`);
      console.log(`🔍 Message ID starts with: ${messageId.substring(0, 10)}`);
      console.log(`🔍 Current messages in state:`, messages.map(m => ({ id: m.id, role: m.role, content: m.content.substring(0, 20) + '...' })));

      // Use Supabase client directly for deletion (with proper authentication)
      const { data, error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('project_id', projectId)
        .select();

      console.log(`📡 Delete response:`, { data, error });

      if (error) {
        console.error(`❌ Delete failed:`, error);
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('Message not found or already deleted');
      }

      // Remove the message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      console.log('✅ Message deleted successfully from UI');
      
      // Clear any existing errors
      setError(null);

    } catch (err) {
      console.error('❌ Error deleting message:', err);
      setError(`Failed to delete message: ${err.message}`);
      
      // Show alert for better user feedback
      alert(`Error deleting message: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show auth prompt if not authenticated
  if (!isAuthenticated) {
    return <AuthPrompt />;
  }

  // Show error state as a non-blocking notification
  const ErrorNotification = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <div className="flex items-center">
          <div className="text-red-600 text-sm">
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 w-full">
      {/* Error notification */}
      <ErrorNotification />
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  // Only allow deletion of real messages (not temp or fallback)
                  message.id && !message.id.startsWith('temp-') && !message.id.startsWith('fallback-')
                    ? 'cursor-context-menu' 
                    : 'cursor-default'
                } ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.metadata?.is_fallback
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-gray-200 text-gray-800'
                }`}
                onContextMenu={(e) => handleMessageRightClick(e, message.id)}
              >
                {message.metadata?.is_fallback && (
                  <div className="text-xs text-yellow-600 mb-1 font-medium">
                    ⚠️ Avís del servei
                  </div>
                )}
                <div className="text-sm whitespace-pre-line">
                  {renderMessageContent(message.content)}
                </div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user' 
                    ? 'text-blue-100' 
                    : message.metadata?.is_fallback
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm">Pensant...</div>
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading || isSubmitting}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
            onClick={() => deleteMessage(contextMenu.messageId)}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectChat;