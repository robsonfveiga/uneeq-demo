import styled from 'styled-components';

export const AppContainer = styled.div`
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

export default AppContainer; 