import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { StakingABI, MOCK_CONTRACT_ADDRESSES } from '../contracts/StakingABI';
// import { parseEther } from 'viem';

const MyPortfolio = () => {
  const { address, isConnected } = useAccount();
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUnstake, setSelectedUnstake] = useState<string | null>(null);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [pendingStakeToUnstake, setPendingStakeToUnstake] = useState<any>(null);

  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConnected && address) {
      fetchStakes();
    }
  }, [isConnected, address]);

  const fetchStakes = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
      const res = await fetch(`${apiUrl}/pools/stakes/${address}`);
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

  if (!isConnected) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)' }}>
        Please connect your wallet to view your portfolio.
      </div>
    );
  }

  return (
    <div>
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)' }}>Loading your stakes...</div>
      ) : stakes.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-gray)' }}>
          You have no active stakes yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {stakes.map(stake => {
            const isEarly = new Date() < new Date(stake.unlockDate);
            const isUnstakingThis = selectedUnstake === stake._id && (isPending || isConfirming);
            
            return (
              <div key={stake._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)', background: stake.status === 'unstaked' ? 'var(--bg-expanded)' : 'transparent' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {stake.poolLogo ? (
                    <img src={stake.poolLogo} alt="logo" style={{ width: 32, height: 32, borderRadius: '50%', opacity: stake.status === 'unstaked' ? 0.5 : 1 }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border-light)' }}></div>
                  )}
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: stake.status === 'unstaked' ? 'var(--text-gray)' : 'var(--text-main)' }}>
                      {stake.stakedAmount} {stake.poolSymbol}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                      {stake.poolName}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Status</div>
                  <div style={{ fontWeight: '600', color: stake.status === 'active' ? 'var(--bybit-green)' : 'var(--text-gray)' }}>
                    {stake.status.toUpperCase()}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Unlock Date</div>
                  <div style={{ fontWeight: '600', color: isEarly && stake.status === 'active' ? 'var(--bybit-red)' : 'var(--text-main)' }}>
                    {new Date(stake.unlockDate).toLocaleDateString()}
                  </div>
                </div>

                {stake.status === 'active' && (
                  <button 
                    className="btn-outline" 
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', borderColor: isEarly ? 'var(--bybit-red)' : 'var(--border-light)', color: isEarly ? 'var(--bybit-red)' : 'var(--text-main)', opacity: isUnstakingThis ? 0.5 : 1 }}
                    onClick={() => handleUnstakeClick(stake)}
                    disabled={isUnstakingThis}
                  >
                    {isUnstakingThis ? 'Processing...' : (isEarly ? 'Early Unstake (Penalty)' : 'Unstake')}
                  </button>
                )}

              </div>
            );
          })}
        </div>
      )}

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
              You are unstaking before your lock-in period ends. A <strong>25% penalty</strong> will be applied to your principal amount.
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

export default MyPortfolio;
