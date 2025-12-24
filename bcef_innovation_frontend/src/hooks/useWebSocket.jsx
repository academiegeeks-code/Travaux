// hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';

const useWebSocket = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const connectWebSocket = () => {
      const token = localStorage.getItem('access');
      const wsUrl = `ws://localhost:8000/ws/chat/${conversationId}/?token=${token}`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected for conversation:', conversationId);
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        // Reconnexion automatique après 3 secondes
        if (conversationId) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message' && data.message) {
            setMessages(prev => {
              // Éviter les doublons
              if (prev.some(msg => msg.id === data.message.id)) {
                return prev;
              }
              return [...prev, data.message];
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [conversationId]);

  const sendMessage = (content) => {
    if (ws.current && isConnected && conversationId) {
      ws.current.send(JSON.stringify({
        message: content,
        conversation_id: conversationId
      }));
      return true;
    }
    return false;
  };

  const addMessageLocally = (message) => {
    setMessages(prev => [...prev, message]);
  };

  return { 
    messages, 
    sendMessage, 
    isConnected, 
    addMessageLocally 
  };
};

export default useWebSocket;