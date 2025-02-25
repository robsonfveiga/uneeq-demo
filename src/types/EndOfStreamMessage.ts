import { MessageType } from './MessageTypes';
import { BaseMessage } from './BaseMessage';

// End of stream message from client to server
export interface EndOfStreamMessage extends BaseMessage {
  type: MessageType.END_OF_STREAM;
} 