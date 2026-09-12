import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import MiniAppReady from './components/MiniAppReady';
import './index.css';
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><WagmiProvider config={config}><QueryClientProvider client={queryClient}><ErrorBoundary><App /><MiniAppReady /></ErrorBoundary></QueryClientProvider></WagmiProvider></React.StrictMode>,
);
