import { MessageType } from './MessageTypes';
import { BaseMessage } from './BaseMessage';

// Error message from server to client
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  error: string;
  code: string;
} 