import { useEffect, useRef, useCallback } from 'react';
import { MessageType } from '../types/MessageTypes';
import { WebSocketMessage } from '../types/WebSocketMessage';

interface UseWebSocketProps {
  url: string;
  onTranscription?: (transcription: { text: string; isFinal: boolean; timestamp: number }) => void;
  onError?: (error: string) => void;
}

export const useWebSocket = ({ url, onTranscription, onError }: UseWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        switch (message.type) {
          case MessageType.TRANSCRIPTION:
            onTranscription?.({
              text: message.text,
              isFinal: message.isFinal,
              timestamp: message.timestamp
            });
            break;
          case MessageType.ERROR:
            onError?.(message.error);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      onError?.('WebSocket error occurred');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }, [url, onTranscription, onError]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}; 