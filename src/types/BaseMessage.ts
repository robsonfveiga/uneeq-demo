import { MessageType } from './messageTypes';

// Base message interface
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
} 