import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Copy, Send } from "lucide-react";
import { SendDialog } from "./send-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWallet } from "@/context/WalletContext";
import { useWalletBalance } from "@/hooks/use-wallet-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function Sidebar() {
  const { wallet } = useWallet();
  const { balance, nonce, isLoading, error } = useWalletBalance();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {/* Balance */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Balance</p>
          {isLoading ? (
            <Skeleton className="h-8 w-3/4" />
          ) : (
            <p className="text-2xl font-bold">{Number(balance).toFixed(6)} OCT</p>
          )}
        </div>

        {/* Nonce */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Nonce</p>
          {isLoading ? (
            <Skeleton className="h-7 w-1/4" />
          ) : (
            <p className="text-lg font-mono">{nonce}</p>
          )}
        </div>

        <Separator />

        {/* Address & Public Key */}
        <div className="space-y-2">
          <Label>Address</Label>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-mono break-all text-muted-foreground">
              {`${wallet?.address.substring(0, 12)}...${wallet?.address.substring(wallet.address.length - 8)}`}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(wallet!.address)}><Copy className="w-4 h-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Copy Address</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Public Key</Label>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-mono break-all text-muted-foreground">
              {`${wallet?.publicKey.substring(0, 12)}...`}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(wallet!.publicKey)}><Copy className="w-4 h-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Copy Public Key</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <SendDialog>
            <Button className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </SendDialog>
        </div>
      </CardContent>
    </Card>
  );
}