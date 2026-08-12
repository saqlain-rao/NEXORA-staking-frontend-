import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { StakingABI, MOCK_CONTRACT_ADDRESSES } from '../contracts/StakingABI';

const GlobalActivity = () => {
  const { address, isConnected } = useAccount();
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnstake, setSelectedUnstake] = useState<string | null>(null);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [pendingStakeToUnstake, setPendingStakeToUnstake] = useState<any>(null);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    fetchStakes();
    // Auto refresh every 10 seconds to simulate real-time global activity
    const interval = setInterval(fetchStakes, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStakes = async () => {
    if (loading && stakes.length > 0) return; // Prevent flicker
    if (stakes.length === 0) setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
      const res = await fetch(`${apiUrl}/pools/stakes/all`);
      const data = await res.json();
      if (data.success) {
        setStakes(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When tx is confirmed, notify backend to update status to unstaked
  useEffect(() => {
    if (isConfirmed && selectedUnstake) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
      fetch(`${apiUrl}/pools/unstake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId: selectedUnstake })
      }).then(() => {
        fetchStakes();
        setSelectedUnstake(null);
      }).catch(console.error);
    }
  }, [isConfirmed]);

  const handleUnstakeClick = (stake: any) => {
    const isEarly = new Date() < new Date(stake.unlockDate);
    
    if (isEarly) {
      setPendingStakeToUnstake(stake);
      setShowUnstakeModal(true);
      return;
    }

    executeUnstake(stake);
  };

  const executeUnstake = (stake: any) => {
    setSelectedUnstake(stake._id);
    
    // Trigger web3 unstake
    writeContract({
      address: MOCK_CONTRACT_ADDRESSES.sepolia as `0x${string}`,
      abi: StakingABI,
      functionName: 'unstake',
    });
  };

  const confirmEarlyUnstake = () => {
    setShowUnstakeModal(false);
    if (pendingStakeToUnstake) {
      executeUnstake(pendingStakeToUnstake);
    }
  };

  const calculateLiveReward = (stake: any) => {
    // Mock live reward calculation based on time elapsed
    const start = new Date(stake.startDate).getTime();
    const now = new Date().getTime();
    const elapsed = Math.max(0, now - start);
    
    // Tiny constant generation for visual effect
    const reward = (elapsed / 100000000) * parseFloat(stake.stakedAmount);
    return reward.toFixed(6);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Global Staking Activity</h2>
        {loading && stakes.length === 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>Syncing blockchain...</span>}
      </div>

      <div className="bybit-panel" style={{ padding: '0' }}>
        {stakes.length === 0 && !loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)' }}>
            No recent stakes on the network.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Time</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>User</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Asset Staked</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Live Reward</th>
                  <th style={{ padding: '1rem', fontWeight: '600' }}>Unlock Date</th>
                  <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stakes.map(stake => {
                  const isEarly = new Date() < new Date(stake.unlockDate);
                  const isUnstakingThis = selectedUnstake === stake._id && (isPending || isConfirming);
                  const isMine = isConnected && address && stake.walletAddress.toLowerCase() === address.toLowerCase();
                  
                  return (
                    <tr key={stake._id} style={{ borderBottom: '1px solid var(--border-color)', background: stake.status === 'unstaked' ? 'var(--bg-expanded)' : 'transparent', opacity: stake.status === 'unstaked' ? 0.6 : 1 }}>
                      
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-gray)', fontWeight: '500' }}>
                        {formatTime(stake.startDate)}
                      </td>
                      
                      <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: '600', color: isMine ? 'var(--bybit-orange)' : 'var(--text-main)' }}>
                        {isMine ? 'You' : formatAddress(stake.walletAddress)}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {stake.poolLogo ? (
                            <img src={stake.poolLogo} alt="logo" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                          ) : (
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--border-light)' }}></div>
                          )}
                          <span style={{ fontWeight: '700' }}>{stake.stakedAmount} {stake.poolSymbol}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--bybit-green)', fontWeight: '600', fontSize: '0.9rem' }}>
                        {stake.status === 'active' ? `+${calculateLiveReward(stake)}` : 'Claimed'}
                      </td>

                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: isEarly && stake.status === 'active' ? 'var(--bybit-red)' : 'var(--text-main)', fontWeight: '600' }}>
                        {new Date(stake.unlockDate).toLocaleDateString()} {formatTime(stake.unlockDate)}
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {stake.status === 'active' ? (
                          isMine ? (
                            <button 
                              className="btn-outline" 
                              style={{ 
                                padding: '6px 16px', 
                                borderRadius: '8px', 
                                fontSize: '0.85rem', 
                                borderColor: isEarly ? 'var(--bybit-red)' : 'var(--border-light)', 
                                color: isEarly ? 'var(--bybit-red)' : 'var(--text-main)', 
                                opacity: isUnstakingThis ? 0.5 : 1 
                              }}
                              onClick={() => handleUnstakeClick(stake)}
                              disabled={isUnstakingThis}
                            >
                              {isUnstakingThis ? 'Processing...' : (isEarly ? 'Early Unstake' : 'Unstake')}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: '500', paddingRight: '12px' }}>Active</span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-darkgray)', fontWeight: '600', paddingRight: '12px' }}>Unstaked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Unstake Modal */}
      {showUnstakeModal && (
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
        }} onClick={() => setShowUnstakeModal(false)}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>

            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Early Unstake Warning
            </h3>
            
            <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: 'var(--text-gray)', lineHeight: '1.5' }}>
              You are unstaking before your lock-in period ends. A <strong>{pendingStakeToUnstake?.penaltyPercentage || 25}% penalty</strong> will be applied to your principal amount.
              <br /><br />
              Do you really want to proceed?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-outline" 
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
                onClick={() => setShowUnstakeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-orange" 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--bybit-orange)', color: 'white', border: 'none' }}
                onClick={confirmEarlyUnstake}
              >
                Confirm Unstake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalActivity;
