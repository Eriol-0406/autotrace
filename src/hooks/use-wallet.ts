import { useState, useEffect, useCallback } from 'react';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { web3WalletService, type WalletInfo } from '@/lib/web3-wallet';
import { useToast } from '@/hooks/use-toast';

export const useWallet = () => {
  const { walletInfo, setWalletInfo, setWalletConnected } = useAppState();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const walletInfo: WalletInfo = await web3WalletService.connect();
      setWalletInfo(walletInfo);
      setWalletConnected(true);
      
      toast({
        title: 'Wallet Connected',
        description: `Successfully connected to ${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`,
      });
      
      return walletInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [setWalletInfo, setWalletConnected, toast]);

  const disconnect = useCallback(async () => {
    try {
      await web3WalletService.disconnect();
      setWalletInfo(null);
      setWalletConnected(false);
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [setWalletInfo, setWalletConnected, toast]);

  const signMessage = useCallback(async (message: string) => {
    if (!walletInfo?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const signature = await web3WalletService.signMessage(message);
      return signature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign message';
      toast({
        title: 'Signing Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [walletInfo, toast]);

  const refreshWalletInfo = useCallback(async () => {
    if (!web3WalletService.isConnected()) {
      return null;
    }
    
    try {
      const info = await web3WalletService.getWalletInfo();
      if (info) {
        setWalletInfo(info);
      }
      return info;
    } catch (error) {
      console.error('Error refreshing wallet info:', error);
      return null;
    }
  }, [setWalletInfo]);

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
      } else {
        // User switched accounts, refresh wallet info
        refreshWalletInfo();
      }
    };

    const handleChainChanged = () => {
      // Refresh wallet info when network changes
      refreshWalletInfo();
    };

    // Add event listeners if Web3 wallet is available
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [disconnect, refreshWalletInfo]);

  return {
    walletInfo,
    isConnecting,
    isConnected: walletInfo?.isConnected || false,
    connect,
    disconnect,
    signMessage,
    refreshWalletInfo,
  };
};
