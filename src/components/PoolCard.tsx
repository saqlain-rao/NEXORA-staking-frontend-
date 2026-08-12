import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId, useReadContract } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { parseEther } from 'viem';
import { sepolia, bscTestnet } from 'wagmi/chains';
import { StakingABI, MOCK_CONTRACT_ADDRESSES } from '../contracts/StakingABI';
const durations = [
  { label: '15 Mins', reward: 1, minutes: 15 },
  { label: '1 Month', reward: 5, minutes: 30 * 24 * 60 },
  { label: '3 Months', reward: 7.5, minutes: 90 * 24 * 60 },
  { label: '6 Months', reward: 10, minutes: 180 * 24 * 60 }
];

const PoolCard = ({ pool }: { pool: any }) => {
  const [expanded, setExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(durations[0]);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  
  // EVM Hooks
  const { isConnected, address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useWeb3Modal();

  // Solana Hooks
  const [isSolanaPending, setIsSolanaPending] = useState(false);
  const [isSolanaConfirmed, setIsSolanaConfirmed] = useState(false);
  const [solanaTxHash, setSolanaTxHash] = useState<string | null>(null);
  const [solanaPublicKey, setSolanaPublicKey] = useState<string | null>(null);

  // TON Hooks
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();
  const [isTonPending, setIsTonPending] = useState(false);
  const [isTonConfirmed, setIsTonConfirmed] = useState(false);
  const [tonTxHash, setTonTxHash] = useState<string | null>(null);

  // Wagmi Contract Writing
  const { data: hash, isPending, writeContract } = useWriteContract();
  
  // Wait for tx confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash, 
  });

  // Determine Target Network & Contract
  const targetChainId = pool.chain.name === 'BSC' ? bscTestnet.id : pool.chain.name === 'Ethereum' ? sepolia.id : null;
  const isCorrectNetwork = currentChainId === targetChainId;
  const targetContract = pool.chain.name === 'BSC' 
    ? MOCK_CONTRACT_ADDRESSES.bscTestnet 
    : MOCK_CONTRACT_ADDRESSES.sepolia;

  // Read Stake Info
  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: targetContract as `0x${string}`,
    abi: StakingABI,
    functionName: 'getStakeInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isCorrectNetwork && (pool.chain.name === 'BSC' || pool.chain.name === 'Ethereum')
    }
  });

  const hasActiveStake = stakeInfo ? (stakeInfo as any)[2] : false;

  // Sync to backend (Mock Subgraph)
  React.useEffect(() => {
    const isReady = (isConfirmed && isConnected && address) || 
                    (isSolanaConfirmed && solanaPublicKey) || 
                    (isTonConfirmed && tonAddress);
    if (isReady) {
      const activeAddress = isSolanaConfirmed ? solanaPublicKey : (isTonConfirmed ? tonAddress : address);
      const activeHash = isSolanaConfirmed ? solanaTxHash : (isTonConfirmed ? tonTxHash : hash);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005/api/v1';
      fetch(`${apiUrl}/pools/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeAddress,
          poolName: pool.name,
          poolSymbol: pool.stakingToken.symbol,
          poolLogo: pool.stakingToken.logo,
          stakedAmount: amount,
          lockMinutes: selectedDuration.minutes,
          penaltyPercentage: selectedDuration.reward / 4,
          txHash: activeHash
        })
      }).catch(console.error);

      // Refetch on-chain state if EVM
      if (!isSolanaConfirmed && !isTonConfirmed && refetchStakeInfo) {
        refetchStakeInfo();
      }
    }
  }, [isConfirmed, isConnected, address, hash, isSolanaConfirmed, solanaPublicKey, solanaTxHash, isTonConfirmed, tonAddress, tonTxHash, refetchStakeInfo]);

  // Calculate dynamic APY based on duration directly from the reward value
  const dynamicApy = selectedDuration.reward.toFixed(1);

  const handleUnstakeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUnstakeModal(true);
  };

  const confirmUnstake = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUnstakeModal(false);

    if (!isConnected) {
      open();
      return;
    }

    if (!isCorrectNetwork && targetChainId) {
      switchChain({ chainId: targetChainId });
      return;
    }

    try {
      writeContract({
        address: targetContract as `0x${string}`,
        abi: StakingABI,
        functionName: 'unstake',
      });
    } catch (err) {
      console.error(err);
      alert("Unstake transaction failed to initialize.");
    }
  };

  const handleStake = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!amount) {
      alert("Please enter an amount to stake");
      return;
    }

    // --- TON LOGIC ---
    if (pool.chain.name === 'TON') {
      if (!tonAddress) {
        tonConnectUI.openModal();
        return;
      }
      
      try {
        setIsTonPending(true);
        // Send a mock transaction to simulate staking
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [
                {
                    address: "0QA_pL29w4kC-qJ9z3Q5zZ_YqZ_YqZ_YqZ_YqZ_YqZ_YqZ_Y", // Dummy admin address for testnet
                    amount: (parseFloat(amount) * 1e9).toString(), // amount in nanoTON
                }
            ]
        };
        const result = await tonConnectUI.sendTransaction(transaction);
        
        setTonTxHash(result.boc ? "ton_tx_" + Math.random().toString(36).substring(2) : "ton_tx_mock");
        setIsTonPending(false);
        setIsTonConfirmed(true);
      } catch (err) {
        console.error(err);
        alert("TON transaction failed or was rejected.");
        setIsTonPending(false);
      }
      return;
    }

    // --- SOLANA LOGIC (Native Phantom) ---
    if (pool.chain.name === 'Solana') {
      const solana = (window as any).solana;
      
      if (!solana || !solana.isPhantom) {
        alert("Phantom Wallet is not installed! Please install Phantom to stake on Solana.");
        return;
      }

      try {
        const resp = await solana.connect();
        const pubKeyStr = resp.publicKey.toString();
        setSolanaPublicKey(pubKeyStr);
        setIsSolanaPending(true);

        // We simulate a confirmed mock transaction for the UI since web3.js isn't bundled
        // In a real app we'd construct a solana/web3.js Transaction here.
        setTimeout(() => {
          const fakeSignature = "4f" + Math.random().toString(36).substring(2) + "solana_mock_sig";
          setSolanaTxHash(fakeSignature);
          setIsSolanaPending(false);
          setIsSolanaConfirmed(true);
        }, 1500);

      } catch (err) {
        console.error(err);
        alert("Solana transaction failed or was rejected.");
        setIsSolanaPending(false);
      }
      return;
    }

    // --- EVM LOGIC ---
    if (!isConnected) {
      open();
      return;
    }

    if (!isCorrectNetwork && targetChainId) {
      switchChain({ chainId: targetChainId });
      return;
    }

    try {
      writeContract({
        address: targetContract as `0x${string}`,
        abi: StakingABI,
        functionName: 'stake',
        args: [
          parseEther(amount),
          BigInt(selectedDuration.minutes)
        ],
        // value = staked amount + admin fee
        value: parseEther(amount) + parseEther("0.0002")
      });
    } catch (err) {
      console.error(err);
      alert("Transaction failed to initialize.");
    }
  };

  const isTxActive = isPending || isConfirming || isSolanaPending || isTonPending;
  let buttonText = "Stake";
  
  if (pool.chain.name === 'TON') {
    if (!tonAddress) buttonText = "Connect TON Wallet";
    else if (isTonPending) buttonText = "Confirming in Wallet...";
    else if (isTonConfirmed) buttonText = "Staked Successfully!";
    else buttonText = "Stake TON";
  } else if (pool.chain.name === 'Solana') {
    if (isSolanaPending) buttonText = "Confirming in Phantom...";
    else if (isSolanaConfirmed) buttonText = "Staked Successfully!";
  } else {
    if (!isConnected) buttonText = "Connect EVM Wallet";
    else if (!isCorrectNetwork) buttonText = `Switch to ${pool.chain.name}`;
    else if (isPending) buttonText = "Confirm in Wallet...";
    else if (isConfirming) buttonText = "Staking...";
    else if (isConfirmed) buttonText = "Staked Successfully!";
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div 
        className="list-row" 
        style={{ cursor: 'pointer', borderBottom: 'none' }} 
        onClick={() => setExpanded(!expanded)}
      >
        {/* Column 1: Logo and Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pool.stakingToken.logo ? (
            <img src={pool.stakingToken.logo} alt="logo" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border-light)' }}></div>
          )}
          <div style={{ fontWeight: '700', letterSpacing: '0.5px', fontSize: '1.05rem' }}>
            {pool.name}
          </div>
        </div>
        
        {/* Column 2: Value/Size */}
        <div style={{ textAlign: 'right', fontWeight: '500', color: 'var(--text-gray)' }}>
          {pool.totalStaked} <span style={{ fontSize: '0.8rem' }}>{pool.stakingToken.symbol}</span>
        </div>
        
        {/* Column 3: Highlighted Rewards */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: '1rem', 
            color: 'var(--bybit-green)', 
            fontWeight: '800', 
            backgroundColor: 'rgba(16, 185, 129, 0.15)', 
            padding: '6px 12px', 
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            +{dynamicApy}% Reward
          </div>
        </div>
      </div>

      {/* Expandable Staking UI */}
      {expanded && (
        <div style={{ padding: '0 1rem 1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-expanded)', borderRadius: '0 0 12px 12px' }}>
          
          {/* Duration Selector */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '8px', fontWeight: '600' }}>Lock-in Duration</div>
            <div className="flex-wrap-row" style={{ gap: '8px' }}>
              {durations.map(dur => (
                <div 
                  key={dur.label}
                  onClick={(e) => { e.stopPropagation(); setSelectedDuration(dur); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: selectedDuration.label === dur.label ? 'var(--text-main)' : 'var(--bg-input)',
                    color: selectedDuration.label === dur.label ? 'var(--bg-main)' : 'var(--text-main)',
                    border: `1px solid ${selectedDuration.label === dur.label ? 'var(--text-main)' : 'var(--border-light)'}`
                  }}
                >
                  {dur.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-gray)' }}>Available Balance: <span style={{ color: 'var(--text-main)' }}>0.00 {pool.stakingToken.symbol}</span></span>
            <span className="text-orange" style={{ cursor: 'pointer', fontWeight: '600' }} onClick={(e) => { e.stopPropagation(); setAmount('100'); }}>MAX</span>
          </div>
          <div className="flex-wrap-row" style={{ gap: '12px' }}>
            <input 
              type="number" 
              placeholder={`Min ${pool.minimumStake}`}
              className="hero-input"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', padding: '10px 16px', borderRadius: '8px', marginTop: 0, flex: '1 1 200px', minWidth: '0' }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              disabled={isTxActive || hasActiveStake}
            />
            {hasActiveStake ? (
              <button 
                className="btn-outline" 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px',
                  flex: '1 1 140px',
                  opacity: isTxActive ? 0.7 : 1,
                  cursor: isTxActive ? 'not-allowed' : 'pointer',
                  borderColor: 'var(--text-main)',
                  color: 'var(--text-main)'
                }} 
                onClick={handleUnstakeClick}
                disabled={isTxActive}
              >
                {isConfirming ? "Processing..." : "Unstake Early (-25%)"}
              </button>
            ) : (
              <button 
                className={isConfirmed ? "btn-outline" : "btn-orange"} 
                style={{ 
                  padding: '10px 24px', 
                  borderRadius: '8px',
                  flex: '1 1 140px',
                  opacity: isTxActive ? 0.7 : 1,
                  cursor: isTxActive ? 'not-allowed' : 'pointer'
                }} 
                onClick={handleStake}
                disabled={isTxActive}
              >
                {buttonText}
              </button>
            )}
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '-0.5rem', fontStyle: 'italic' }}>
            * Includes a small admin gas fee of 0.0002 {pool.stakingToken.symbol}
          </div>

          {hash && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
              Tx: <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" style={{ color: 'var(--bybit-orange)' }}>{hash.slice(0, 10)}...</a>
            </div>
          )}

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
        }} onClick={(e) => { e.stopPropagation(); setShowUnstakeModal(false); }}>
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

            <div className="flex-wrap-row" style={{ gap: '12px' }}>
              <button 
                className="btn-outline" 
                style={{ flex: 1, padding: '12px', borderRadius: '8px' }}
                onClick={(e) => { e.stopPropagation(); setShowUnstakeModal(false); }}
              >
                Cancel
              </button>
              <button 
                className="btn-orange" 
                style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--bybit-orange)', color: 'white', border: 'none' }}
                onClick={confirmUnstake}
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

export default PoolCard;
