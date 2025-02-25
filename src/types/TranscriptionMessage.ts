import { BaseMessage } from "./BaseMessage";
import { MessageType } from "./MessageTypes";

// Transcription message from server to client
export interface TranscriptionMessage extends BaseMessage {
  type: MessageType.TRANSCRIPTION;
  text: string;
  isFinal: boolean;
} 