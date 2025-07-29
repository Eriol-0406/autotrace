
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAppState } from '@/context/app-state-provider';
import { Wallet, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WalletConnectionPage() {
  const router = useRouter();
  const { setWalletConnected } = useAppState();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const handleConnectWallet = () => {
    setIsConnecting(true);
    // Simulate wallet connection
    setTimeout(() => {
      // In a real app, this would involve interacting with a Web3 library like ethers.js or web3-react
      const success = Math.random() > 0.1; // 90% success rate
      if (success) {
        setWalletConnected(true);
        setIsConnected(true);
        toast({ title: 'Success', description: 'Wallet connected successfully.' });
      } else {
        toast({ title: 'Error', description: 'Failed to connect wallet. Please try again.', variant: 'destructive' });
      }
      setIsConnecting(false);
    }, 1500);
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Wallet className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-2xl mt-4">Connect Your Web3 Wallet</CardTitle>
          <CardDescription>Your wallet is used to securely sign transactions on the blockchain.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            {!isConnected && (
              <Button onClick={handleConnectWallet} disabled={isConnecting} size="lg">
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            )}
            {isConnected && (
              <div className="text-green-600 flex items-center gap-2 text-lg">
                <CheckCircle />
                <span>Wallet Connected</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} disabled={!isConnected} className="w-full">
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
