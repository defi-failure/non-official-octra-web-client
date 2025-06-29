"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Wallet, Loader2, AlertCircle, CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export function WalletSetup() {
  const { login } = useWallet();
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    if (!privateKey) {
      setError("Private key cannot be empty.");
      return;
    }
    setError("");
    setIsConnecting(true);
    try {
      // The login function from the context handles validation and state update
      login(privateKey);
      // On success, the main page will automatically switch to the dashboard
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsConnecting(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Wallet size={48} className="text-primary"/>
          </div>
          <CardTitle>Octra Web Client</CardTitle>
          <CardDescription>Enter your private key to connect your wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="private-key">Private Key</Label>
            <Input
              id="private-key"
              type="password"
              placeholder="Your secret key"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              disabled={isConnecting}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center p-3 space-x-2 text-sm rounded-md bg-muted text-muted-foreground">
            <LockKeyhole className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>Your key is stored securely in your browser&apos;s local storage and never sent to any server.</p>
          </div>
          <div className="flex items-center  p-3 space-x-2 text-sm rounded-md bg-muted text-muted-foreground">
            <CircleAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p><strong>Note:</strong> This is <strong>NOT</strong> an official client.</p>
              <p>The code is open source and available <Link
                className="underline"
                rel="noopener noreferrer" target="_blank"
                href="https://github.com/defi-failure/non-official-octra-web-client"
              >here</Link>. <strong>DYOR</strong></p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</>
            ) : (
              "Connect Wallet"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}