import { useState, useEffect, useRef } from 'react'
import Title from './components/Title'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import './App.css'
import TranscriptionPanel, { Transcription } from './components/TranscriptionPanel'
import { AppContainer } from './components/AppContainer'
import PushToTalkButton from './components/PushToTalkButton'
import { StatusText } from './components/StatusText'


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
      <Title >Walkie Talkie</Title>
      <TranscriptionPanel 
        transcriptions={transcriptions} 
        currentTranscript={currentTranscript}
        error={error || undefined}
      />
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
