import { AudioMessage } from './AudioMessage';
import { TranscriptionMessage } from './TranscriptionMessage';
import { ErrorMessage } from './ErrorMessage';
import { EndOfStreamMessage } from './EndOfStreamMessage';

export type WebSocketMessage = 
  | AudioMessage 
  | TranscriptionMessage 
  | ErrorMessage 
  | EndOfStreamMessage; 