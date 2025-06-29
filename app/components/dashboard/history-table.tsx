import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Copy, Loader2 } from "lucide-react";
import { useTransactionHistory } from "@/hooks/use-wallet-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWallet } from "@/context/WalletContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Format timestamp to readable date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Format address for display (show first 6 and last 4 characters)
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Format amount for display
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
};

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text);
};

export function HistoryTable() {
  const {wallet} = useWallet();
  const {history, isLoading, error} = useTransactionHistory();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4"/>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
                {history.map((tx, index) => (

                  <TableRow
                    key={tx.hash || index}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === 'in' ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500"/>
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500"/>
                        )}
                        <span className="capitalize text-sm font-medium">
                          {tx.type === 'in' ? 'Received' : 'Sent'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm ${
                        tx.type === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'in' ? '+' : '-'}{formatAmount(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-sm cursor-pointer hover:bg-muted/50 hover:underline transition-colors"
                          onClick={() => {
                            if (tx.hash) {
                              window.open(`https://octrascan.io/addr/${tx.to}`, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                        {formatAddress(tx.to)}
                      </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="cursor-pointer"
                                      onClick={() => handleCopy(tx.to)}><Copy className="w-4 h-4 text-muted-foreground"/></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Copy Address</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(tx.time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="font-mono text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 hover:underline transition-colors"
                        onClick={() => {
                          if (tx.hash) {
                            window.open(`https://octrascan.io/tx/${tx.hash}`, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        {tx.hash ? `${tx.hash.substring(0, 8)}...${tx.hash.substring(tx.hash.length - 8)}` : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (tx.hash) {
                          window.open(`https://octrascan.io/tx/${tx.hash}`, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <Badge
                        variant={tx.epoch ? 'default' : 'secondary'}
                        className={tx.epoch ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}
                      >
                        {tx.epoch ? `Epoch ${tx.epoch}` : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && !error && history.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {history.length} most recent transactions
          </div>
        )}
      </CardContent>
    </Card>
  );
}