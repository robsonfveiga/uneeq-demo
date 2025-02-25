import { useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { MessageType } from '../types/MessageTypes';
import { AudioMessage } from '../types/AudioMessage';
import { EndOfStreamMessage } from '../types/EndOfStreamMessage';

interface UseVoiceRecorderProps {
  websocketUrl: string;
  onTranscription?: (transcription: { text: string; isFinal: boolean; timestamp: number }) => void;
}

export const useVoiceRecorder = ({ websocketUrl, onTranscription }: UseVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connect, disconnect, sendMessage } = useWebSocket({
    url: websocketUrl,
    onTranscription,
    onError: (err) => setError(err)
  });

  const startRecording = useCallback(async () => {
    try {
      connect();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

          const audioMessage: AudioMessage = {
            type: MessageType.AUDIO,
            timestamp: Date.now(),
            audioData: base64Audio,
            sampleRate: 48000,
            isLastChunk: false,
          };

          sendMessage(audioMessage);
        }
      };

      mediaRecorder.start(400);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      console.error('Error starting recording:', err);
    }
  }, [connect, sendMessage]);

  const stopRecording = useCallback(() => {
    if (isRecording) {
      const endMessage = {
        type: MessageType.END_OF_STREAM,
        timestamp: Date.now(),
      };
      sendMessage(endMessage as EndOfStreamMessage);
      disconnect();
      setIsRecording(false);
    }
  }, [isRecording, sendMessage, disconnect]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
}; 