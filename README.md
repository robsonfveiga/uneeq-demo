# Walkie Talkie - Real-Time Speech-to-Text App

A modern web application that provides real-time speech-to-text transcription using WebRTC, WebSocket, and Google Cloud Speech-to-Text API. Built with React, TypeScript, and Go.

## Features

- 🎤 Push-to-Talk functionality
- 🔄 Real-time transcription
- 💬 Interim and final transcription results
- 🎯 High-accuracy using Google's enhanced speech model
- 💾 Automatic audio backup
- 🔋 Long-running stream support (auto-reconnection)
- 🎨 Modern, responsive UI

## Tech Stack

### Frontend
- React with TypeScript
- Styled Components
- WebRTC for audio capture
- WebSocket for real-time communication

### Backend
- Go
- Gorilla WebSocket
- Google Cloud Speech-to-Text API
- WebM/Opus audio encoding

## Prerequisites

1. Node.js (v16 or higher)
2. Go (v1.21 or higher)
3. Google Cloud account with Speech-to-Text API enabled
4. Google Cloud credentials configured

## Setup

### Backend Setup

1. Install Go dependencies:
```bash
cd server
go mod tidy
```

2. Configure Google Cloud credentials:
```bash
gcloud auth application-default login
```

3. Start the server:
```bash
go run *.go
```

The server will start on port 8080.

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_WEBSOCKET_URL=ws://localhost:8080/ws
```

3. Start the development server:
```bash
npm run dev
```

## Usage

1. Open the application in your browser
2. Click and hold the microphone button to start recording
3. Speak into your microphone
4. Release the button to stop recording
5. Watch as your speech is transcribed in real-time

## Project Structure

```
├── server/
│   ├── main.go              # WebSocket and audio handling
│   ├── speech_service.go    # Google Speech-to-Text integration
│   └── go.mod              # Go dependencies
├── src/
│   ├── App.tsx             # Main application component
│   ├── hooks/
│   │   └── useVoiceRecorder.ts  # Audio recording and WebSocket hook
│   └── types/
│       └── messages.ts     # TypeScript type definitions
└── package.json
```

## Features in Detail

### Audio Processing
- WebM/Opus format at 48kHz
- Automatic noise suppression
- Echo cancellation
- Single channel audio

### Transcription
- Real-time interim results
- Automatic punctuation
- Enhanced model for better accuracy
- Support for emojis and spoken punctuation

### Stream Management
- Automatic stream restart before Google's 5-minute limit
- Graceful connection handling
- Error recovery
- Audio continuity across restarts

## Error Handling

The application handles various error scenarios:
- Microphone access denied
- WebSocket connection issues
- Google API errors
- Network interruptions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Cloud Speech-to-Text API
- The Go community
- React and TypeScript teams
