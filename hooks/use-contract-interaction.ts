import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useWalletBalance } from './use-wallet-data';
import { getKeyPair } from '@/lib/crypto';
import { sign } from 'tweetnacl';
import { Buffer } from 'buffer';

const rpcUrl = 'https://octra.network';

interface UseContractInteractionProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useContractInteraction({ onSuccess, onError }: UseContractInteractionProps = {}) {
  const { wallet } = useWallet();
  const { nonce } = useWalletBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const execute = async (contractAddress: string, method: string, params: string[], methodType: 'view' | 'call') => {
    if (!wallet) {
      const err = 'Wallet not connected';
      setError(err);
      if (onError) onError(err);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (methodType === 'view') {
        const viewResult = await viewCall(contractAddress, method, params, wallet.address);
        setResult(viewResult);
        if (onSuccess) onSuccess(viewResult);
      } else if (methodType === 'call') {
        const callResult = await callContract(contractAddress, method, params, wallet.privateKey, wallet.address, nonce);
        setResult(callResult);
        if (onSuccess) onSuccess(callResult);
      }
    } catch (e: any) {
      const err = e.message || 'An unexpected error occurred.';
      setError(err);
      if (onError) onError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error, result };
}

async function viewCall(contractAddress: string, method: string, params: string[], caller: string) {
  const payload = {
    contract: contractAddress,
    method,
    params,
    caller,
  };

  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'POST',
      endpoint: '/contract/call-view',
      rpcUrl,
      payload,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to execute view call.');
  }

  if (data.status === 'success') {
    return data.result;
  } else {
    throw new Error(data.error || 'View call failed.');
  }
}

async function callContract(contractAddress: string, method: string, params: string[], privateKeyB64: string, fromAddress: string, currentNonce: number) {
  const keyPair = getKeyPair(privateKeyB64);
  const timestamp = Date.now() / 1000;

  const tx = {
    from: fromAddress,
    to_: contractAddress,
    amount: '0',
    nonce: currentNonce + 1,
    ou: '1',
    timestamp: timestamp,
  };

  const blob = `{"from":"${tx.from}","to_":"${tx.to_}","amount":"${tx.amount}","nonce":${tx.nonce},"ou":"${tx.ou}","timestamp":${tx.timestamp}}`;
  const signature = sign.detached(Buffer.from(blob), keyPair.secretKey);


  const payload = {
    contract: contractAddress,
    method,
    params,
    caller: fromAddress,
    nonce: tx.nonce,
    timestamp: tx.timestamp,
    signature: Buffer.from(signature).toString('base64'),
    public_key: Buffer.from(keyPair.publicKey).toString('base64'),
  };

  const response = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'POST',
      endpoint: '/call-contract',
      rpcUrl,
      payload,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to execute call.');
  }

  return data;
}
