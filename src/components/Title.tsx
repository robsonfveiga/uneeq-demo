import styled, { keyframes } from 'styled-components';

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

export default Title; 