import React, { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

export interface Transcription {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

const Panel = styled.div`
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

const Text = styled.div`
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

const Interim = styled.div`
  color: #6C63FF;
  font-style: italic;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: rgba(108, 99, 255, 0.1) !important;
  border: 1px solid rgba(108, 99, 255, 0.2);
  margin-top: 1rem;
`;

const ErrorWrapper = styled.div`
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

interface Props {
  transcriptions: Transcription[];
  currentTranscript: string;
  error?: string;
}

const TranscriptionPanel: React.FC<Props> = ({ transcriptions, currentTranscript, error }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [transcriptions, currentTranscript]);

  return (
    <Panel ref={panelRef}>
      <Text>
        {transcriptions.map(t => (
          <div key={t.timestamp}>{t.text}</div>
        ))}
        {currentTranscript && <Interim>{currentTranscript}</Interim>}
        {error && <ErrorWrapper>{error}</ErrorWrapper>}
        {transcriptions.length === 0 && !currentTranscript && !error && (
          <EmptyState>Transcription will appear here...</EmptyState>
        )}
      </Text>
    </Panel>
  );
};

export default TranscriptionPanel; 