import useSWR from 'swr';
import { useWallet } from '@/context/WalletContext';
import { fetcher } from '@/lib/api';
import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { useState } from "react";

// A single hook to fetch balance and nonce
export function useWalletBalance() {
  const { wallet } = useWallet();
  const rpcUrl = 'https://octra.network'; // Or get from a config

  // SWR key: if wallet is null, key is null, and SWR won't fetch.
  const key = wallet ? [`/balance/${wallet.address}`, rpcUrl] : null;

  // SWR will use our fetcher. Auto-refresh every 30 seconds.
  const { data, error, isLoading } = useSWR(key, fetcher, {
    refreshInterval: 30000,
  });

  return {
    balance: data?.balance,
    nonce: data?.nonce,
    isLoading,
    error,
  };
}


interface TransactionReference {
  hash: string;
  epoch?: number;
}

interface ParsedTransaction {
  from: string;
  to: string;
  amount: string;
  amount_raw?: string;
  nonce: number;
  timestamp: number;
}

interface TransactionDetail {
  parsed_tx: ParsedTransaction;
}

interface ProcessedTransaction {
  time: Date;
  hash: string;
  amount: number;
  to: string;
  type: 'in' | 'out';
  nonce: number;
  epoch?: number;
  ok: boolean;
}

export function useTransactionHistory() {
  const { wallet } = useWallet();
  const rpcUrl = 'https://octra.network';

  // First, fetch the transaction references
  const addressKey = wallet ? [`/address/${wallet.address}?limit=20`, rpcUrl] : null;

  const { data: addressData, error: addressError, isLoading: addressLoading } = useSWR(
    addressKey,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );

  // Extract transaction hashes
  const transactionHashes = addressData?.recent_transactions?.map((tx: TransactionReference) => tx.hash) || [];

  // Fetch all transaction details in one request using a custom fetcher
  const transactionDetailsKey = transactionHashes.length > 0 && wallet
    ? ['transaction-details', transactionHashes, rpcUrl]
    : null;

  const { data: transactionDetails, error: detailsError, isLoading: detailsLoading } = useSWR(
    transactionDetailsKey,
    async ([_, hashes, rpcUrl]) => {
      // Fetch all transactions in parallel
      const transactionPromises = hashes.map(async (hash: string) => {
        try {
          const response = await fetcher([`/tx/${hash}`, rpcUrl]);
          return { hash, data: response };
        } catch (error) {
          // Return null for failed requests, we'll filter them out
          return null;
        }
      });

      const results = await Promise.all(transactionPromises);
      return results.filter(result => result !== null);
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // Process transaction details
  const { data: processedTransactions, error: processingError } = useSWR(
    transactionDetails && addressData && wallet
      ? ['process-transactions', transactionDetails, wallet.address, addressData.recent_transactions]
      : null,
    ([_, details, walletAddress, recentTransactions]) => {
      if (!details?.length || !walletAddress) return [];

      const processedTransactions: ProcessedTransaction[] = [];
      const existingHashes = new Set<string>();

      details.forEach((result: any) => {
        if (!result?.data?.parsed_tx) return;

        const { hash, data } = result;
        const parsedTx: ParsedTransaction = data.parsed_tx;
        const txRef = recentTransactions.find((ref: TransactionReference) => ref.hash === hash);

        if (existingHashes.has(hash)) return;
        existingHashes.add(hash);

        const isIncoming = parsedTx.to === walletAddress;
        const amountRaw = parsedTx.amount_raw || parsedTx.amount || '0';

        // Convert amount similar to CLI logic
        const amount = typeof amountRaw === 'string' && amountRaw.includes('.')
          ? parseFloat(amountRaw)
          : parseInt(amountRaw) / 1_000_000;

        processedTransactions.push({
          time: new Date(parsedTx.timestamp * 1000),
          hash,
          amount,
          to: isIncoming ? parsedTx.from : parsedTx.to,
          type: isIncoming ? 'in' : 'out',
          ok: true,
          nonce: parsedTx.nonce,
          epoch: txRef?.epoch
        });
      });

      // Sort by time descending (newest first) and limit to 50 like CLI
      return processedTransactions
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 50);
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const isLoading = addressLoading || detailsLoading;
  const error = addressError || detailsError || processingError;

  // Handle the case where address endpoint returns 404 or "no transactions"
  if (addressError && addressError.message.includes('404')) {
    return {
      history: [],
      isLoading: false,
      error: null,
    };
  }

  return {
    history: processedTransactions || [],
    isLoading,
    error,
  };
}

interface SendTransactionParams {
  to: string;
  amount: number;
}

interface SendTransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  responseTime?: number;
  poolInfo?: any;
}

export function useSendTransaction() {
  const { wallet } = useWallet();
  const { nonce, balance } = useWalletBalance();
  const [isLoading, setIsLoading] = useState(false);

  const sendTransaction = async ({ to, amount }: SendTransactionParams): Promise<SendTransactionResult> => {
    if (!wallet) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!nonce === undefined || balance === undefined) {
      return { success: false, error: 'Failed to get wallet state' };
    }

    if (balance < amount) {
      return { success: false, error: `Insufficient balance (${balance?.toFixed(6)} < ${amount})` };
    }

    setIsLoading(true);

    try {
      // Create signing key from private key (similar to CLI)
      const privateKeyBytes = decodeBase64(wallet.privateKey);
      const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);

      // Build transaction object (following CLI structure)
      const transaction = {
        from: wallet.address,
        to_: to,
        amount: String(Math.floor(amount * 1_000_000)), // Convert to microOCT
        nonce: nonce + 1,
        ou: amount < 1000 ? "1" : "3", // Fee tier like CLI
        timestamp: Date.now() / 1000 + Math.random() * 0.01 // Add small random offset like CLI
      };

      // Serialize for signing (no spaces, like CLI)
      const transactionString = JSON.stringify(transaction, null, 0);
      const messageBytes = new TextEncoder().encode(transactionString);

      // Sign the transaction
      const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
      const signatureB64 = encodeBase64(signature);
      const publicKeyB64 = encodeBase64(keyPair.publicKey);

      // Create final transaction with signature
      const signedTransaction = {
        ...transaction,
        signature: signatureB64,
        public_key: publicKeyB64
      };

      // Send transaction via our API proxy
      const startTime = Date.now();
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'POST',
          endpoint: '/send-tx',
          rpcUrl: 'https://octra.network',
          payload: signedTransaction,
        }),
      });

      const responseTime = (Date.now() - startTime) / 1000;

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Transaction failed',
          responseTime
        };
      }

      const result = await response.json();

      // Handle different response formats (following CLI logic)
      if (result.status === 'accepted') {
        return {
          success: true,
          txHash: result.tx_hash,
          responseTime,
          poolInfo: result.pool_info
        };
      } else if (typeof result === 'string' && result.toLowerCase().startsWith('ok')) {
        // Handle simple "OK <hash>" response
        const txHash = result.split(' ').pop();
        return {
          success: true,
          txHash,
          responseTime
        };
      } else {
        return {
          success: false,
          error: JSON.stringify(result),
          responseTime
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendTransaction,
    isLoading
  };
}