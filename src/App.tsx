import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PoolCard from './components/PoolCard';
import GlobalActivity from './components/GlobalActivity';
import AdminPanel from './components/AdminPanel';
import { useWeb3ModalTheme } from '@web3modal/wagmi/react';

function App() {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('All');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nexora-theme') as 'light' | 'dark') || 'light';
  });
  
  const { setThemeMode } = useWeb3ModalTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexora-theme', theme);
    setThemeMode(theme);
  }, [theme, setThemeMode]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
        const res = await fetch(`${apiUrl}/pools`);
        
        if (!res.ok) throw new Error('Failed to fetch markets');
        
        const data = await res.json();
        if (data.success) {
          setPools(data.data);
        } else {
          setError(data.message || 'Failed to load markets');
        }
      } catch (err: any) {
        console.error(err);
        setError('Network Error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Filter logic
  const filteredPools = selectedNetwork === 'All' 
    ? pools 
    : pools.filter(pool => {
        const search = selectedNetwork.toLowerCase();
        return pool.name.toLowerCase().includes(search) || 
               pool.stakingToken.symbol.toLowerCase().includes(search);
      });

  return (
    <div>
      <div className="app-wrapper">
        <Navbar 
          theme={theme} 
          toggleTheme={toggleTheme}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={setSelectedNetwork}
          isAdminOpen={isAdminOpen}
          setIsAdminOpen={setIsAdminOpen}
        />
        
        {isAdminOpen ? (
          <AdminPanel />
        ) : (
          <div style={{ maxWidth: '1000px', margin: '4rem auto 4rem auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h1 className="hero-title">
                Multi-Chain Yield Aggregator
              </h1>
              <p className="hero-subtitle">
                Stake your assets across Ethereum, BSC, Solana, and TON to earn native rewards with auto-compounding.
              </p>
            </div>
              
            <div className="bybit-panel">
              <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: '700', borderBottom: '2px solid var(--bybit-orange)', paddingBottom: '0.5rem', marginBottom: '-0.5rem' }}>
                  {selectedNetwork === 'All' ? 'Available Pools' : `${selectedNetwork} Pools`}
                </span>
              </div>
              
              {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)' }}>Loading vaults...</div>
              ) : error ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--bybit-red)' }}>{error}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredPools.length > 0 ? (
                    filteredPools.map(pool => (
                      <PoolCard key={pool._id} pool={pool} />
                    ))
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                      No active pools found for {selectedNetwork}.
                    </div>
                  )}
                </div>
              )}
            </div>

            <GlobalActivity />

          </div>
        )}
      </div>
    </div>
  )
}

export default App;
