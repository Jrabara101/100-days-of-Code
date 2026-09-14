import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NetworkProvider } from './context/NetworkContext';
import { GameStateProvider } from './context/GameStateContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NetworkProvider>
      <GameStateProvider>
        <App />
      </GameStateProvider>
    </NetworkProvider>
  </React.StrictMode>
);
