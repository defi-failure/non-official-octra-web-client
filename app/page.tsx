"use client";

import { useWallet } from "@/context/WalletContext";
import { WalletSetup } from "./components/wallet-setup";
import { Dashboard } from "./components/dashboard"; // We will create this next
import { Loader2 } from "lucide-react";

export default function Home() {
  const { wallet, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return wallet ? <Dashboard /> : <WalletSetup />;
}