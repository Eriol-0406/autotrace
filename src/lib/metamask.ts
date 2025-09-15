import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: string;
  isConnected: boolean;
}

export class Web3WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connect(): Promise<WalletInfo> {
    try {
      // Detect MetaMask provider
      const ethereum = await detectEthereumProvider();
      
      if (!ethereum) {
        throw new Error('No Web3 wallet detected. Please install a Web3 wallet extension like MetaMask or OKX Wallet.');
      }

      // Request account access
      const accounts = await (ethereum as any).request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your Web3 wallet.');
      }

      const account = accounts[0];
      
      // Create ethers provider and signer
      this.provider = new ethers.BrowserProvider(ethereum as any);
      this.signer = await this.provider.getSigner();
      
      // Get network information
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(account);
      
      const walletInfo: WalletInfo = {
        address: account,
        balance: ethers.formatEther(balance),
        chainId: network.chainId.toString(),
        isConnected: true,
      };

      return walletInfo;
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.provider || !this.signer) {
      return null;
    }

    try {
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.formatEther(balance),
        chainId: network.chainId.toString(),
        isConnected: true,
      };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }
}

// Create a singleton instance
export const web3WalletService = new Web3WalletService();
