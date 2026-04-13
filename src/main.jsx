import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sdk } from '@farcaster/miniapp-sdk'

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'commit.base', preference: 'smartWalletOnly' }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

function Root() {
  useEffect(() => {
    // Notify Farcaster client that the app is fully loaded
    sdk.actions.ready()
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
