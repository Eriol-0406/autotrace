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
        throw new Error('No Web3 wallet detected. Please install a Web3 wallet extension like MetaMask.');
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

      // Clear manual disconnection flag since user is explicitly connecting
      localStorage.removeItem('walletManuallyDisconnected');
      console.log('✅ Wallet connected:', account.slice(0, 6) + '...' + account.slice(-4));

      return walletInfo;
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  }

  /**
   * Attempt to restore a previously authorized session without prompting the user.
   * If the wallet extension has already granted access, fetch fresh balance and chain info.
   * Respects manual disconnection by the user.
   */
  async reconnectIfAuthorized(): Promise<WalletInfo | null> {
    try {
      // Check if user manually disconnected - if so, don't auto-reconnect
      const manuallyDisconnected = localStorage.getItem('walletManuallyDisconnected');
      if (manuallyDisconnected === 'true') {
        console.log('🚫 Auto-reconnection skipped - wallet was manually disconnected');
        return null;
      }

      const ethereum = await detectEthereumProvider();
      if (!ethereum) {
        return null;
      }

      // Query without prompting for connection
      const accounts: string[] = await (ethereum as any).request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        return null;
      }

      const account = accounts[0];
      this.provider = new ethers.BrowserProvider(ethereum as any);
      this.signer = await this.provider.getSigner();

      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(account);

      console.log('🔄 Auto-reconnected to wallet:', account.slice(0, 6) + '...' + account.slice(-4));

      return {
        address: account,
        balance: ethers.formatEther(balance),
        chainId: network.chainId.toString(),
        isConnected: true,
      };
    } catch (error) {
      console.error('Error during reconnectIfAuthorized:', error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    // Clear wallet connection state
    this.provider = null;
    this.signer = null;
    
    // Store manual disconnect flag to prevent auto-reconnection
    localStorage.setItem('walletManuallyDisconnected', 'true');
    
    console.log('🔌 Wallet manually disconnected - auto-reconnection disabled');
  }

  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.provider || !this.signer) {
      return null;
    }

    try {
      const address = await this.signer.getAddress();
      
      // Double-check provider is still available before network calls
      if (!this.provider) {
        console.warn('Provider became null during getWalletInfo execution');
        return null;
      }
      
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
