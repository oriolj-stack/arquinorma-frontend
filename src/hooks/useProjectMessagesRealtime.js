import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook for real-time project messages
 * 
 * @param {string} projectId - The project ID to listen for messages
 * @returns {Object} - { messages, stopListening }
 */
export const useProjectMessagesRealtime = (projectId) => {
  const [messages, setMessages] = useState([]);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    // Create a Supabase realtime channel for this project's messages
    const channel = supabase
      .channel(`project-messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New message received:', payload.new);
          
          // Append new message to state
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Store subscription reference for cleanup
    subscriptionRef.current = channel;

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        console.log('Unsubscribing from realtime channel');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [projectId]);

  // Function to manually stop listening
  const stopListening = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  return {
    messages,
    stopListening
  };
};

/**
 * Usage example:
 * 
 * import { useProjectMessagesRealtime } from '../hooks/useProjectMessagesRealtime';
 * 
 * function ProjectChat({ projectId }) {
 *   const { messages, stopListening } = useProjectMessagesRealtime(projectId);
 * 
 *   // Messages will automatically update when new messages are inserted
 *   // Call stopListening() if you need to manually stop the subscription
 * 
 *   useEffect(() => {
 *     // Optional: Stop listening when component unmounts
 *     return () => stopListening();
 *   }, []);
 * 
 *   return (
 *     <div>
 *       {messages.map(message => (
 *         <div key={message.id}>{message.content}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */





















