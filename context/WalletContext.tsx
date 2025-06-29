"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { validatePrivateKey, deriveAddress, derivePublicKey } from '@/lib/crypto';

// Define the shape of our wallet object
interface Wallet {
  privateKey: string;
  publicKey: string;
  address: string;
}

// Define the shape of the context value
interface WalletContextType {
  wallet: Wallet | null;
  isLoading: boolean;
  login: (privateKey: string) => void;
  logout: () => void;
}

// Create the context with a default value
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Create the provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On initial load, check if a wallet is saved in localStorage
    try {
      const savedWallet = localStorage.getItem('octraWallet');
      if (savedWallet) {
        setWallet(JSON.parse(savedWallet));
      }
    } catch (error) {
      console.error("Failed to load wallet from storage:", error);
      localStorage.removeItem('octraWallet'); // Clear corrupted data
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (privateKey: string) => {
    // This function will be called by the WalletSetup component
    validatePrivateKey(privateKey); // This will throw an error if invalid

    const newWallet: Wallet = {
      privateKey: privateKey,
      publicKey: derivePublicKey(privateKey),
      address: deriveAddress(privateKey),
    };

    localStorage.setItem('octraWallet', JSON.stringify(newWallet));
    setWallet(newWallet);
  };

  const logout = () => {
    // This will be called by the Header component
    localStorage.removeItem('octraWallet');
    setWallet(null);
  };

  return (
    <WalletContext.Provider value={{ wallet, isLoading, login, logout }}>
  {children}
  </WalletContext.Provider>
);
}

// Create a custom hook for easy access to the context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}