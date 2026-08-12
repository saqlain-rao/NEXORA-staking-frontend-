import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { sepolia, bscTestnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = 'b56e18d47c72ab683b10814fe9495694'; // Demo Project ID

// 2. Create wagmiConfig
const metadata = {
  name: 'NEXORA Staking Marketplace',
  description: 'Premium Web3 Staking Platform (Testnet Mode)',
  url: 'http://localhost:5178', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// STRICT TESTNET CONFIGURATION
const chains = [sepolia, bscTestnet] as const;
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

// 3. Create modal
createWeb3Modal({
  metadata,
  wagmiConfig: config,
  projectId,
  enableAnalytics: false, // Optional
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10b981', // Emerald accent
    '--w3m-border-radius-master': '8px',
    '--w3m-font-family': 'Outfit, sans-serif'
  }
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
