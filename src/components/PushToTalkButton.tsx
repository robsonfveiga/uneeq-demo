import styled, { keyframes } from 'styled-components';

const pulseAnimation = keyframes`
  0% { transform: scale(var(--scale-start)); }
  50% { transform: scale(var(--scale-middle)); }
  100% { transform: scale(var(--scale-end)); }
`;

const PushToTalkButton = styled.button<{ $isRecording: boolean }>`
  --scale-start: ${props => props.$isRecording ? '1.1' : '1'};
  --scale-middle: ${props => props.$isRecording ? '1.15' : '1.05'};
  --scale-end: ${props => props.$isRecording ? '1.1' : '1'};
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
  box-shadow: 0 0 ${props => props.$isRecording ? '30px' : '20px'} ${props => props.$isRecording ? 'rgba(231, 76, 60, 0.3)' : 'rgba(108, 99, 255, 0.3)'},
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
    box-shadow: 0 0 ${props => props.$isRecording ? '40px' : '30px'} ${props => props.$isRecording ? 'rgba(231, 76, 60, 0.4)' : 'rgba(108, 99, 255, 0.4)'},
                0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export default PushToTalkButton; 