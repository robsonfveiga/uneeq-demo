import { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import './App.css'

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
  color: #EAEAEA;
  font-family: 'Inter', sans-serif;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.2), transparent);
  }
`;

const titleGradient = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(
    300deg,
    #6C63FF,
    #A29BFE,
    #FF6B6B,
    #4ECDC4,
    #6C63FF
  );
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  letter-spacing: -1px;
  animation: ${titleGradient} 10s ease infinite;

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 4px;
    background: linear-gradient(
      90deg,
      #6C63FF,
      #A29BFE,
      #FF6B6B,
      #4ECDC4
    );
    border-radius: 2px;
    opacity: 0.8;
  }
`;

const TranscriptionPanel = styled.div`
  background: rgba(24, 24, 24, 0.95);
  border-radius: 24px;
  padding: 2rem;
  width: 100%;
  max-width: 800px;
  min-height: 500px;
  margin-bottom: 3rem;
  box-shadow: 
    0 4px 30px rgba(108, 99, 255, 0.1),
    0 0 0 1px rgba(108, 99, 255, 0.1) inset;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.2), transparent);
  }
`;

const TranscriptionText = styled.div`
  font-size: 20px;
  line-height: 1.8;
  color: #EAEAEA;
  white-space: pre-wrap;
  height: 100%;
  min-height: 460px;
  overflow-y: auto;
  padding-right: 1rem;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(108, 99, 255, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(108, 99, 255, 0.5);
    }
  }

  > div {
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(${props => props.$isRecording ? '1.1' : '1'});
  }
  50% {
    transform: scale(${props => props.$isRecording ? '1.15' : '1.05'});
  }
  100% {
    transform: scale(${props => props.$isRecording ? '1.1' : '1'});
  }
`;

const PushToTalkButton = styled.button<{ $isRecording: boolean }>`
  background: ${props => props.$isRecording ? 
    'linear-gradient(135deg, #FF6B6B, #E74C3C)' : 
    'linear-gradient(135deg, #6C63FF, #A29BFE)'};
  border: none;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 
    0 0 ${props => props.$isRecording ? '30px' : '20px'} ${props => props.$isRecording ? 'rgba(231, 76, 60, 0.3)' : 'rgba(108, 99, 255, 0.3)'},
    0 4px 12px rgba(0, 0, 0, 0.15);
  animation: ${pulseAnimation} 2s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${props => props.$isRecording ? '28px' : '40px'};
    height: ${props => props.$isRecording ? '28px' : '40px'};
    background: #fff;
    border-radius: ${props => props.$isRecording ? '4px' : '50%'};
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
  }

  &:hover {
    box-shadow: 
      0 0 ${props => props.$isRecording ? '40px' : '30px'} ${props => props.$isRecording ? 'rgba(231, 76, 60, 0.4)' : 'rgba(108, 99, 255, 0.4)'},
      0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StatusText = styled.div`
  font-size: 16px;
  color: #A0A0A0;
  margin-top: 1.5rem;
  text-align: center;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #6C63FF, #A29BFE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const InterimTranscript = styled.div`
  color: #6C63FF;
  font-style: italic;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: rgba(108, 99, 255, 0.1) !important;
  border: 1px solid rgba(108, 99, 255, 0.2);
  margin-top: 1rem;
`;

const ErrorMessage = styled.div`
  color: #E74C3C;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.2);
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const EmptyState = styled.div`
  color: #666;
  text-align: center;
  padding: 2rem;
  font-style: italic;
`;

interface Transcription {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

function App() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const lastInterimLengthRef = useRef<number>(0);
  const transcriptionPanelRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
        lastInterimLengthRef.current = 0;
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
      } else {
        // Update interim transcription only if it's longer than the last interim
        const isLongerTranscript = transcription.text.length > lastInterimLengthRef.current;
        
        if (isLongerTranscript) {
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = setTimeout(() => {
            setCurrentTranscript(transcription.text);
            lastInterimLengthRef.current = transcription.text.length;
          }, 300); // 300ms debounce delay
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
        // Reset interim tracking when starting new recording
        setCurrentTranscript('');
        lastInterimLengthRef.current = 0;
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
            <InterimTranscript>
              {currentTranscript}
            </InterimTranscript>
          )}
          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}
          {!transcriptions.length && !currentTranscript && !error && (
            <EmptyState>
              Transcription will appear here...
            </EmptyState>
          )}
        </TranscriptionText>
      </TranscriptionPanel>
      
      <PushToTalkButton 
        $isRecording={isRecording}
        onClick={handlePushToTalk}
      />
      
      <StatusText>
        {isRecording ? 'Recording...' : 'Press to talk'}
      </StatusText>
    </AppContainer>
  );
}

export default App
