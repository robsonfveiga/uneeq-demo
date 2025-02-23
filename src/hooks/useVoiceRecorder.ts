import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageType, AudioMessage, WebSocketMessage } from '../types/messages';

interface UseVoiceRecorderProps {
  websocketUrl: string;
  onTranscription?: (transcription: { text: string; isFinal: boolean; timestamp: number }) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
}

export const useVoiceRecorder = ({ websocketUrl, onTranscription }: UseVoiceRecorderProps): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case MessageType.TRANSCRIPTION:
          onTranscription?.({
            text: message.text,
            isFinal: message.isFinal,
            timestamp: message.timestamp
          });
          break;
        case MessageType.ERROR:
          setError(message.error);
          break;
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  }, [onTranscription]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(websocketUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setError(null);
    };

    ws.onmessage = handleWebSocketMessage;

    ws.onerror = () => {
      setError('WebSocket error occurred');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      if (isRecording) {
        setError('Connection lost');
        setIsRecording(false);
      }
    };
  }, [websocketUrl, handleWebSocketMessage, isRecording]);

  // Cleanup function
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      websocketRef.current?.close();
    };
  }, []);

  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      // Initialize WebSocket if not already connected
      initializeWebSocket();

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;

      // Create MediaRecorder with WebM/Opus format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          // Convert blob to base64
          const buffer = await event.data.arrayBuffer();
          const base64Audio = btoa(
            String.fromCharCode(...new Uint8Array(buffer))
          );

          // Create and send audio message
          const audioMessage: AudioMessage = {
            type: MessageType.AUDIO,
            timestamp: Date.now(),
            audioData: base64Audio,
            sampleRate: 48000,
            isLastChunk: false,
          };

          websocketRef.current.send(JSON.stringify(audioMessage));
        }
      };

      // Start recording
      mediaRecorder.start(400); // Send chunks every 400ms as specified in master rules
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      console.error('Error starting recording:', err);
    }
  }, [initializeWebSocket]);

  // Stop recording function
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      // Send END_OF_STREAM message
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        const endMessage = {
          type: MessageType.END_OF_STREAM,
          timestamp: Date.now(),
        };
        websocketRef.current.send(JSON.stringify(endMessage));
      }
    }
    setIsRecording(false);
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
}; 