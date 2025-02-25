// Message types for WebSocket communication
export enum MessageType {
  AUDIO = 'AUDIO',
  TRANSCRIPTION = 'TRANSCRIPTION',
  END_OF_STREAM = 'END_OF_STREAM',
  ERROR = 'ERROR'
}

// Base message interface
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
} 