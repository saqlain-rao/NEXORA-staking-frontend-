// import React from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';

const Navbar = ({ 
  theme, 
  toggleTheme, 
  selectedNetwork, 
  setSelectedNetwork,
  isAdminOpen,
  setIsAdminOpen
}: { 
  theme?: string, 
  toggleTheme?: () => void,
  selectedNetwork: string,
  setSelectedNetwork: (net: string) => void,
  isAdminOpen: boolean,
  setIsAdminOpen: (val: boolean) => void
}) => {
  
  const networks = ['All', 'Ethereum', 'BSC', 'Solana', 'TON'];

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px', background: 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
        {/* Next-Gen Logo */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>
            NEX<span className="text-orange">O</span>RA
          </h2>
        </div>
        
        {/* Web3 Network Selection */}
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
          {networks.map(net => (
            <div 
              key={net}
              onClick={() => setSelectedNetwork(net)}
              style={{
                cursor: 'pointer',
                padding: '6px 16px',
                borderRadius: '20px',
                background: selectedNetwork === net ? 'var(--text-main)' : 'transparent',
                color: selectedNetwork === net ? 'var(--bg-main)' : 'var(--text-gray)',
                transition: 'all 0.2s ease'
              }}
            >
              {net}
            </div>
          ))}
        </div>
      </div>
      
      {/* Right side Web3 tools */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {toggleTheme && (
          <button 
            onClick={toggleTheme} 
            style={{ fontSize: '1.2rem', padding: '4px' }}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        )}
        <button 
          onClick={() => setIsAdminOpen(!isAdminOpen)}
          style={{
            background: isAdminOpen ? 'var(--bybit-orange)' : 'var(--bg-input)',
            color: isAdminOpen ? '#fff' : 'var(--bybit-orange)',
            border: '1px solid var(--bybit-orange)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isAdminOpen ? 'Close Admin' : 'Admin Panel'}
        </button>
        <w3m-button />
        <TonConnectButton />
      </div>
    </nav>
  );
};

export default Navbar;
