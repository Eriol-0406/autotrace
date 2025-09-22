
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Wallet, CheckCircle, Loader2, AlertCircle, ExternalLink, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { smartContractService } from '@/lib/smart-contract';
import { databaseService } from '@/lib/database';

export default function WalletConnectionPage() {
  const router = useRouter();
  const { walletInfo, role, currentUser } = useAppState();
  const { connect, isConnecting, isConnected } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [entityName, setEntityName] = useState('');
  const [registerOnBlockchain, setRegisterOnBlockchain] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();



  const handleConnectWallet = async () => {
    setError(null);

    try {
      await connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
    }
  };

  const handleContinue = async () => {
    if (registerOnBlockchain && isConnected && walletInfo && role && entityName.trim()) {
      setIsRegistering(true);
      try {
        // Register on blockchain
        const result = await smartContractService.registerWallet(entityName.trim(), role);
        
        // Update user in database
        if (currentUser) {
          await databaseService.updateUser(currentUser._id, {
            walletAddress: walletInfo.address,
            walletConnected: true,
            blockchainRegistered: true,
            entityName: entityName.trim()
          });
        }

        toast({
          title: 'Blockchain Registration Successful',
          description: `Your entity "${entityName}" has been registered on the blockchain.`,
        });
      } catch (error) {
        console.error('Blockchain registration error:', error);
        toast({
          title: 'Registration Warning',
          description: 'Wallet connected but blockchain registration failed. You can try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsRegistering(false);
      }
    } else if (isConnected && walletInfo && currentUser) {
      // Just update wallet connection without blockchain registration
      try {
        await databaseService.updateUser(currentUser._id, {
          walletAddress: walletInfo.address,
          walletConnected: true,
        });
      } catch (error) {
        console.error('Database update error:', error);
      }
    }
    
    router.push('/');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(4);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Wallet className="w-12 h-12 mx-auto text-primary" />
          <CardTitle className="text-2xl mt-4">Connect Your Web3 Wallet</CardTitle>
          <CardDescription>
            Connect your Web3 wallet (MetaMask, OKX, Coinbase, etc.) to securely sign transactions on the blockchain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {!isConnected && (
            <div className="space-y-4">
                             <div className="text-center">
                 <p className="text-sm text-muted-foreground mb-4">
                   Make sure you have a Web3 wallet installed in your browser
                 </p>
                <Button 
                  onClick={handleConnectWallet} 
                  disabled={isConnecting} 
                  size="lg"
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                                     ) : (
                     <>
                       <Wallet className="mr-2 h-4 w-4" />
                       Connect Wallet
                     </>
                   )}
                </Button>
              </div>
              
                             <div className="text-center">
                 <p className="text-xs text-muted-foreground">
                   Don't have a Web3 wallet?{' '}
                   <a 
                     href="https://metamask.io/download/" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-primary hover:underline inline-flex items-center gap-1"
                   >
                     Download MetaMask
                     <ExternalLink className="h-3 w-3" />
                   </a>
                   {' '}or{' '}
                   <a 
                     href="https://www.okx.com/web3" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-primary hover:underline inline-flex items-center gap-1"
                   >
                     OKX Wallet
                     <ExternalLink className="h-3 w-3" />
                   </a>
                 </p>
               </div>
            </div>
          )}

          {isConnected && walletInfo && (
            <div className="space-y-4">
              <div className="text-green-600 flex items-center justify-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Wallet Connected</span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Address:</span>
                  <span className="text-sm font-mono">{formatAddress(walletInfo.address)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Balance:</span>
                  <span className="text-sm">{formatBalance(walletInfo.balance)} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Network:</span>
                  <span className="text-sm">Chain ID: {walletInfo.chainId}</span>
                </div>
              </div>

              {/* Optional Blockchain Registration */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="blockchain-registration"
                    checked={registerOnBlockchain}
                    onCheckedChange={(checked: boolean) => setRegisterOnBlockchain(checked)}
                  />
                  <Label htmlFor="blockchain-registration" className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Register on Blockchain (Optional)
                  </Label>
                </div>
                
                <p className="text-xs text-muted-foreground pl-6">
                  Register your business entity on the blockchain for enhanced security and compliance tracking. This is optional but recommended for full B2B features.
                </p>

                {registerOnBlockchain && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="entity-name" className="text-sm">Entity/Business Name</Label>
                    <Input
                      id="entity-name"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder={`Enter your ${role?.toLowerCase() || 'business'} name`}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will be stored on the blockchain and cannot be changed later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleContinue} 
            disabled={!isConnected || isRegistering || (registerOnBlockchain && !entityName.trim())} 
            className="w-full"
            size="lg"
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering on Blockchain...
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
