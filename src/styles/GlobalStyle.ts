import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    --primary-color: #00adb5;       // Teal accent color
    --background-color: #1a1a1a;    // Dark background
    --text-primary: #eeeeee;        // Primary text
    --text-secondary: #a0a0a0;     // Secondary text
    // ... rest of the variables
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #0A0A0A;
  }

  button {
    outline: none;
    border: none;
    cursor: pointer;
    padding: 12px 24px;
    border-radius: 8px;
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    transform: translateZ(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      background-color: var(--primary-color);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.1);
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover::before {
      opacity: 1;
    }
  }

  .transcription-panel {
    background-color: var(--primary-color); // Changed from rgba(255, 255, 255, 0.05)
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: var(--text-primary);
    font-size: 1.1rem;
    line-height: 1.6;
    // ... rest of existing styles
  }
`;

export default GlobalStyle; 