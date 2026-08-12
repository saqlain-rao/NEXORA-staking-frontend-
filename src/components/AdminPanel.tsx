import { useEffect, useState } from 'react';
// import { parseEther } from 'viem';

const AdminPanel = () => {
  const [stats, setStats] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState('');

  // Very basic auth since MetaMask is removed (in production, use JWT/session)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const fetchAdminData = async () => {
    try {
      const _rawApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
      const apiUrl = _rawApi.endsWith('/api/v1') ? _rawApi : `${_rawApi.replace(/\/$/, '')}/api/v1`;
      
      const statsRes = await fetch(`${apiUrl}/pools/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      const walletRes = await fetch(`${apiUrl}/pools/admin/wallet`);
      const walletData = await walletRes.json();
      if (walletData.success) {
        setWallet(walletData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center', background: 'var(--bg-input)', padding: '2rem', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Admin Login</h2>
        <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter password to access the Dedicated Admin Dashboard.</p>
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', marginBottom: '1rem' }}
        />
        <button 
          className="btn-orange" 
          style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bybit-orange)', color: 'white', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            if (password === 'Saqlain786') setIsAuthenticated(true);
            else alert('Incorrect password');
          }}
        >
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)' }}>Loading Admin Data...</div>;
  }

  const { adminBalances } = stats || {};

  const handleTransferSubmit = async () => {
    setTransferError('');
    setTxHash('');
    
    if (!transferAddress || !transferAmount) {
      setTransferError("Please enter both address and amount");
      return;
    }

    setIsPending(true);
    try {
      const _rawApi = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
      const apiUrl = _rawApi.endsWith('/api/v1') ? _rawApi : `${_rawApi.replace(/\/$/, '')}/api/v1`;
      const response = await fetch(`${apiUrl}/pools/admin/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          poolSymbol: 'ETH', 
          amount: transferAmount,
          destination: transferAddress
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTxHash(data.data.txHash);
        // Don't close modal immediately, let them see the success state
        fetchAdminData();
      } else {
        setTransferError(data.message || 'Transfer failed');
      }
    } catch(e: any) {
      console.error(e);
      setTransferError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsPending(false);
    }
  };

  const closeTransferModal = () => {
    if (isPending) return;
    setShowTransferModal(false);
    setTransferAddress('');
    setTransferAmount('');
    setTxHash('');
    setTransferError('');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <div className="bybit-panel" style={{ background: 'var(--bg-main)', border: '1px solid var(--bybit-orange)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--bybit-orange)', filter: 'blur(100px)', opacity: 0.3, zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex-wrap-row" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🛡️</span> Dedicated Admin Dashboard
            </h2>
            <div style={{ background: 'rgba(247, 166, 0, 0.1)', color: 'var(--bybit-orange)', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '0.9rem' }}>
              Backend Wallet Active
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem', background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-gray)', fontSize: '0.9rem', fontWeight: '600' }}>Dedicated Admin Wallet (Managed by Backend)</p>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
              {wallet?.address || 'Not configured'}
            </p>
            <div style={{ display: 'flex', gap: '20px', marginTop: '1rem', fontSize: '0.9rem' }}>
               <div>Network: <strong style={{ color: 'var(--text-main)' }}>{wallet?.network}</strong></div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            Wallet Balances & Fees
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            {/* ETH Card */}
            <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #627EEA', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg" alt="ETH" width="24" height="24" />
                <span style={{ fontWeight: '700', color: 'var(--text-gray)' }}>Live ETH Balance</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {wallet ? Number(wallet.balance).toFixed(4) : '0'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--bybit-green)', fontWeight: '600' }}>+ Recorded Tracker</div>
                <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setShowTransferModal(true)}>
                  Transfer out
                </button>
              </div>
            </div>

            {/* BNB Card */}
            <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #F3BA2F', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <img src="https://cryptologos.cc/logos/bnb-bnb-logo.svg" alt="BNB" width="24" height="24" />
                <span style={{ fontWeight: '700', color: 'var(--text-gray)' }}>BNB Fees</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                {Number(adminBalances?.BNB || 0).toFixed(4)}
              </div>
            </div>
            
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
             <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
               This dashboard operates completely independently of MetaMask.<br/>
               Transfers are securely signed and broadcasted by the backend server using the Dedicated Admin Wallet.
             </p>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={closeTransferModal}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'left',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Transfer Funds (Backend)
            </h3>
            
            {txHash ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h4 style={{ color: 'var(--bybit-green)', margin: '0 0 1rem 0' }}>Transfer Successful!</h4>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
                  Tx Hash:<br/>
                  <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--bybit-orange)' }}>
                    {txHash}
                  </a>
                </p>
                <button 
                  className="btn-outline" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                  onClick={closeTransferModal}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '8px', fontWeight: '600' }}>Receiver Address</label>
                  <input 
                    type="text" 
                    placeholder="0x..." 
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '8px', fontWeight: '600' }}>Amount (ETH)</label>
                  <input 
                    type="number" 
                    placeholder="0.0" 
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '8px' }}>
                    Available: {wallet ? Number(wallet.balance).toFixed(4) : '0'} ETH
                  </div>
                </div>
                
                {transferError && (
                  <div style={{ marginBottom: '1.5rem', padding: '12px', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--bybit-red)', borderRadius: '8px', color: 'var(--bybit-red)', fontSize: '0.85rem', wordBreak: 'break-word' }}>
                    {transferError}
                  </div>
                )}

                <div className="flex-wrap-row" style={{ gap: '12px' }}>
                  <button 
                    className="btn-outline" 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={closeTransferModal}
                    disabled={isPending}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-orange" 
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--bybit-orange)', color: 'white', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
                    onClick={handleTransferSubmit}
                    disabled={isPending}
                  >
                    {isPending ? 'Sending...' : 'Send from Backend'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
