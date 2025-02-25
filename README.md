# Real-time Voice Transcription App

A WebSocket-based real-time voice transcription application using React, TypeScript, and Google Speech-to-Text.

## Frontend Architecture

### Core Components

- `App.tsx`: Main application component orchestrating the voice recording and transcription flow
- `Title.tsx`: Styled title component with gradient animation
- `TranscriptionPanel.tsx`: Displays real-time transcriptions with interim and final results
- `PushToTalkButton.tsx`: Interactive recording button with visual feedback
- `StatusText.tsx`: Status indicator for recording state

### Custom Hooks

#### `useWebSocket`
Manages WebSocket connections and communication:
```typescript
const { connect, disconnect, sendMessage, isConnected } = useWebSocket({
  url: string,
  onTranscription: (transcription) => void,
  onError: (error) => void
});
```

#### `useVoiceRecorder`
Handles voice recording and audio streaming:
```typescript
const { isRecording, startRecording, stopRecording, error } = useVoiceRecorder({
  websocketUrl: string,
  onTranscription: (transcription) => void
});
```

### Type Definitions

Located in `src/types/`:
- `MessageTypes.ts`: Enum of WebSocket message types
- `WebSocketMessage.ts`: Union type of all possible messages
- `AudioMessage.ts`: Audio chunk message format
- `TranscriptionMessage.ts`: Transcription result format
- `ErrorMessage.ts`: Error message format
- `EndOfStreamMessage.ts`: Stream termination message

### Styling

- Uses styled-components for component-specific styling
- Implements modern UI with gradients, animations, and responsive design
- Features smooth transitions and visual feedback

### WebSocket Communication Flow

1. User initiates recording
2. WebSocket connection established
3. Audio chunks sent every 400ms
4. Server responds with:
   - Interim transcriptions (real-time feedback)
   - Final transcriptions (confirmed text)
   - Error messages (if any)
5. Connection closed on recording stop

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```env
VITE_WEBSOCKET_URL=ws://your-server:8080/ws
```

3. Start development server:
```bash
npm run dev
```

## Features

- Real-time voice transcription
- Visual feedback for recording state
- Auto-scrolling transcription panel
- Error handling and user feedback
- Debounced interim transcriptions
- Push-to-talk functionality

## Technical Considerations

- Audio is captured at 48kHz sample rate
- WebM/Opus codec for audio compression
- Implements echo cancellation and noise suppression
- Handles WebSocket reconnection
- Cleans up resources on unmount

## Project Structure

```
server/
├── internal/
│   ├── config/      # Configuration management
│   ├── handlers/    # HTTP and WebSocket handlers
│   ├── models/      # Data models and message types
│   ├── services/    # Business logic and services
│   └── utils/       # Utility functions
├── main.go         # Application entry point
├── go.mod          # Go module file
└── go.sum          # Go module checksums
```

## Features

- Real-time audio streaming via WebSocket
- Google Speech-to-Text integration
- Automatic stream management and recovery
- Audio file saving for backup
- Configurable settings

## Prerequisites

- Go 1.21 or later
- Google Cloud credentials configured
- `gcloud` CLI authenticated

## Setup

1. Ensure you're authenticated with Google Cloud:
```bash
gcloud auth application-default login
```

2. Install dependencies:
```bash
go mod download
```

3. Run the server:
```bash
go run main.go
```

The server will start on port 8080 by default.

## Configuration

Configuration is managed in `internal/config/config.go`. Default settings:

- Port: `:8080`
- Uploads Directory: `uploads/`
- CORS: All origins allowed (development mode)

## API

### WebSocket Endpoint: `/ws`

Messages Types:
- `AUDIO`: Audio data chunks (base64 encoded WebM/Opus)
- `TRANSCRIPTION`: Speech-to-text results
- `END_OF_STREAM`: End of audio stream signal
- `ERROR`: Error messages

## Development

The codebase follows standard Go project layout and best practices:

- Modular design with clear separation of concerns
- Concurrent processing with proper synchronization
- Error handling and logging
- Clean shutdown and resource cleanup

## License

MIT
