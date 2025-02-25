import { MessageType } from './MessageTypes';
import { BaseMessage } from './BaseMessage';

// Audio message from client to server
export interface AudioMessage extends BaseMessage {
  type: MessageType.AUDIO;
  audioData: string; // base64 encoded audio chunk
  sampleRate: number;
  isLastChunk: boolean;
} 