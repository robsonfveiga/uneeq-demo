import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import './App.css'

const AppContainer = styled.div`
  min-height: 100vh;
  background: #0A0A0A;
  color: #EAEAEA;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  background: linear-gradient(90deg, #6C63FF, #A29BFE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-bottom: 2rem;
`;

const TranscriptionPanel = styled.div`
  background: #181818;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 800px;
  min-height: 400px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.1);
  border: 1px solid #232323;
`;

const TranscriptionText = styled.div`
  font-size: 18px;
  line-height: 1.6;
  color: #A0A0A0;
  white-space: pre-wrap;
`;

const PushToTalkButton = styled.button<{ $isRecording: boolean }>`
  background: #232323;
  border: 2px solid ${props => props.$isRecording ? '#E74C3C' : '#6C63FF'};
  border-radius: 50%;
  width: 80px;
  height: 80px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 ${props => props.$isRecording ? '20px #E74C3C' : '12px #6C63FF'};

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MicIcon = styled.span<{ $isRecording: boolean }>`
  font-size: 32px;
  color: ${props => props.$isRecording ? '#E74C3C' : '#6C63FF'};
`;

const StatusText = styled.div`
  font-size: 14px;
  color: #5A5A5A;
  margin-top: 1rem;
  text-align: center;
`;

interface Transcription {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

function App() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const transcriptionPanelRef = useRef<HTMLDivElement>(null);
  
  const {
    isRecording,
    startRecording,
    stopRecording,
    error
  } = useVoiceRecorder({
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws',
    onTranscription: (transcription) => {
      if (transcription.isFinal) {
        setTranscriptions(prev => [...prev, transcription]);
        setCurrentTranscript('');
      } else {
        // Only update interim transcription if it's longer than the current one
        if (transcription.text.length > currentTranscript.length) {
          setCurrentTranscript(transcription.text);
        }
      }
    }
  });

  // Auto-scroll transcription panel
  useEffect(() => {
    if (transcriptionPanelRef.current) {
      transcriptionPanelRef.current.scrollTop = transcriptionPanelRef.current.scrollHeight;
    }
  }, [transcriptions, currentTranscript]);

  const handlePushToTalk = async () => {
    try {
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording();
      }
    } catch (err) {
      console.error('Error handling push to talk:', err);
    }
  };

  return (
    <AppContainer>
      <Title>Walkie Talkie</Title>
      <TranscriptionPanel ref={transcriptionPanelRef}>
        <TranscriptionText>
          {transcriptions.map((t, i) => (
            <div key={t.timestamp}>
              {t.text}
            </div>
          ))}
          {currentTranscript && (
            <div style={{ color: '#6C63FF' }}>
              {currentTranscript}
            </div>
          )}
          {error && (
            <div style={{ color: '#E74C3C' }}>
              {error}
            </div>
          )}
          {!transcriptions.length && !currentTranscript && !error && (
            'Transcription will appear here...'
          )}
        </TranscriptionText>
      </TranscriptionPanel>
      
      <PushToTalkButton 
        $isRecording={isRecording}
        onClick={handlePushToTalk}
      >
        <MicIcon $isRecording={isRecording}>🎤</MicIcon>
      </PushToTalkButton>
      
      <StatusText>
        {isRecording ? 'Recording...' : 'Press to talk'}
      </StatusText>
    </AppContainer>
  );
}

export default App
