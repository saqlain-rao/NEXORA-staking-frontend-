import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Web3Provider } from './components/Web3Provider.tsx'
import { SolanaProvider } from './components/SolanaProvider.tsx'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <SolanaProvider>
        <Web3Provider>
          <App />
        </Web3Provider>
      </SolanaProvider>
    </TonConnectUIProvider>
  </React.StrictMode>,
)
