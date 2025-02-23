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

// Audio message from client to server
export interface AudioMessage extends BaseMessage {
  type: MessageType.AUDIO;
  audioData: string; // base64 encoded audio chunk
  sampleRate: number;
  isLastChunk: boolean;
}

// Transcription message from server to client
export interface TranscriptionMessage extends BaseMessage {
  type: MessageType.TRANSCRIPTION;
  text: string;
  isFinal: boolean;
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  error: string;
  code: string;
}

// End of stream message
export interface EndOfStreamMessage extends BaseMessage {
  type: MessageType.END_OF_STREAM;
}

// Type union for all possible messages
export type WebSocketMessage = 
  | AudioMessage 
  | TranscriptionMessage 
  | ErrorMessage 
  | EndOfStreamMessage; 