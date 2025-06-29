import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReactNode, useState } from "react";
import { useWalletBalance, useSendTransaction } from "@/hooks/use-wallet-data";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface SendDialogProps {
  children: ReactNode;
}

export function SendDialog({ children }: SendDialogProps) {
  const [open, setOpen] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<'form' | 'confirm' | 'sending' | 'result'>('form');
  const [result, setResult] = useState<any>(null);

  const { balance, nonce, isLoading: balanceLoading } = useWalletBalance();
  const { sendTransaction, isLoading: sendLoading } = useSendTransaction();

  // Address validation regex (from CLI)
  const addressRegex = /^oct[1-9A-HJ-NP-Za-km-z]{44}$/;

  const resetDialog = () => {
    setToAddress("");
    setAmount("");
    setStep('form');
    setResult(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset when dialog closes
      setTimeout(resetDialog, 200);
    }
  };

  const validateForm = () => {
    if (!toAddress || !addressRegex.test(toAddress)) {
      return "Invalid address format";
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return "Invalid amount";
    }

    if (balance !== undefined && amountNum > balance) {
      return `Insufficient balance (${balance} < ${amountNum})`;
    }

    return null;
  };

  const handleNext = () => {
    const error = validateForm();
    if (error) {
      alert(error); // You might want to use a proper toast/notification system
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setStep('sending');

    const result = await sendTransaction({
      to: toAddress,
      amount: parseFloat(amount)
    });

    setResult(result);
    setStep('result');
  };

  const handleBack = () => {
    setStep('form');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const getFeeAmount = () => {
    const amountNum = parseFloat(amount);
    return amountNum < 1000 ? 0.001 : 0.003;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle>Send Transaction</DialogTitle>
              <DialogDescription>
                Enter the recipient's address and amount. Double-check before sending.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  placeholder="oct1..."
                  className="col-span-3"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  className="col-span-3"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.000001"
                  min="0"
                />
              </div>
              {balance !== undefined && (
                <div className="text-sm text-gray-600 px-4">
                  Available balance: {balance} OCT
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleNext}
                disabled={balanceLoading || !toAddress || !amount}
              >
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Transaction</DialogTitle>
              <DialogDescription>
                Please review the transaction details before confirming.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">To:</span>
                  <span className="text-sm font-mono">{toAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {parseFloat(amount).toFixed(6)} OCT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fee:</span>
                  <span className="text-sm">{getFeeAmount()} OCT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nonce:</span>
                  <span className="text-sm">{nonce !== undefined ? nonce + 1 : '---'}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Cost:</span>
                  <span>{(parseFloat(amount) + getFeeAmount()).toFixed(6)} OCT</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleConfirm}>
                Confirm and Send
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'sending' && (
          <>
            <DialogHeader>
              <DialogTitle>Sending Transaction</DialogTitle>
              <DialogDescription>
                Please wait while your transaction is being processed...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-sm">Sending transaction...</span>
            </div>
          </>
        )}

        {step === 'result' && (
          <>
            <DialogHeader>
              <DialogTitle>
                {result?.success ? 'Transaction Sent!' : 'Transaction Failed'}
              </DialogTitle>
              <DialogDescription>
                {result?.success
                  ? 'Your transaction has been submitted to the network.'
                  : 'There was an error processing your transaction.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {result?.success ? (
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Transaction accepted!</span>
                  </div>
                  {result.txHash && (
                    <div className="space-y-1">
                      <div className="text-sm">Transaction Hash:</div>
                      <div className="text-xs font-mono  p-2 rounded break-all">
                        {result.txHash}
                      </div>
                    </div>
                  )}
                  {result.responseTime && (
                    <div className="text-sm text-gray-600">
                      Response time: {result.responseTime.toFixed(2)}s
                    </div>
                  )}
                  {result.poolInfo && (
                    <div className="text-sm text-gray-600">
                      Pool: {result.poolInfo.total_pool_size || 0} transactions pending
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Transaction failed</span>
                  </div>
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {result?.error || 'Unknown error occurred'}
                  </div>
                  {result?.responseTime && (
                    <div className="text-sm text-gray-600">
                      Response time: {result.responseTime.toFixed(2)}s
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}