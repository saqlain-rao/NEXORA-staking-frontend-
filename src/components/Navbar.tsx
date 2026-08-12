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
    <nav className="navbar-container">
      {/* Top Row: Logo & Actions */}
      <div className="navbar-top-row">
        {/* Next-Gen Logo */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>
            NEX<span className="text-orange">O</span>RA
          </h2>
        </div>
        
        {/* Right side Actions */}
        <div className="navbar-actions">
          {toggleTheme && (
            <button 
              onClick={toggleTheme} 
              style={{ fontSize: '1.2rem', padding: '8px', cursor: 'pointer', opacity: 0.8 }}
              title="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          )}

          <button 
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="btn-outline"
            style={{ borderColor: 'var(--bybit-orange)', color: 'var(--bybit-orange)' }}
          >
            <span className="admin-text-label">{isAdminOpen ? 'Close Admin' : 'Admin Panel'}</span>
            <span className="admin-icon-label" title="Admin Panel">🛡️</span>
          </button>

          {selectedNetwork === 'Solana' ? (
             <button 
                onClick={async () => {
                  try {
                    const solana = (window as any).solana;
                    if (solana && solana.isPhantom) {
                      await solana.connect();
                    } else {
                      window.open('https://phantom.app/', '_blank');
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={{ background: 'var(--bybit-orange)', color: '#000', borderRadius: '24px', fontWeight: '700', height: '40px', padding: '0 16px' }}
             >
                Phantom
             </button>
          ) : selectedNetwork === 'TON' ? (
             <TonConnectButton />
          ) : (
            <div style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
              <w3m-button balance="hide" size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Web3 Network Selection */}
      <div className="navbar-networks-row">
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
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {net}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
