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
      // Detect Web3 provider
      const ethereum = await detectEthereumProvider();
      
      if (!ethereum) {
        throw new Error('No Web3 wallet detected. Please install a Web3 wallet extension like MetaMask or Phantom.');
      }

      const walletName = this.getWalletName(ethereum as any);
      const walletId = this.getWalletId(ethereum as any);

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
      
      // Remember this wallet for current session only (not persistent across browser restarts)
      sessionStorage.setItem('lastConnectedWallet', walletId);
      
      console.log(`✅ ${walletName} connected:`, account.slice(0, 6) + '...' + account.slice(-4));

      return walletInfo;
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  /**
   * Attempt to restore a previously authorized session without prompting the user.
   * If the wallet extension has already granted access, fetch fresh balance and chain info.
   * Respects manual disconnection by the user and tracks wallet-specific permissions.
   * 
   * @param forceManualSelection - If true, always return null to force manual wallet selection
   */
  async reconnectIfAuthorized(forceManualSelection: boolean = false): Promise<WalletInfo | null> {
    try {
      // If force manual selection is enabled, always require user to manually connect
      if (forceManualSelection) {
        console.log('🎯 Manual wallet selection mode - skipping auto-reconnection');
        return null;
      }

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

      // Detect wallet type for better logging
      const walletName = this.getWalletName(ethereum as any);

      // Query without prompting for connection
      const accounts: string[] = await (ethereum as any).request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        console.log(`🔍 No authorized accounts found for ${walletName}`);
        return null;
      }

      // Check if this specific wallet was previously connected in this session
      const lastConnectedWallet = sessionStorage.getItem('lastConnectedWallet');
      const currentWalletId = this.getWalletId(ethereum as any);
      
      if (lastConnectedWallet && lastConnectedWallet !== currentWalletId) {
        console.log(`🚫 Different wallet detected (${walletName}). Previous: ${lastConnectedWallet}, Current: ${currentWalletId}. Skipping auto-reconnect.`);
        return null;
      }

      const account = accounts[0];
      this.provider = new ethers.BrowserProvider(ethereum as any);
      this.signer = await this.provider.getSigner();

      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(account);

      console.log(`🔄 Auto-reconnected to ${walletName}:`, account.slice(0, 6) + '...' + account.slice(-4));

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
    
    // Clear the last connected wallet to prevent auto-reconnect to any wallet
    sessionStorage.removeItem('lastConnectedWallet');
    
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

  /**
   * Get a human-readable name for the detected wallet
   */
  private getWalletName(ethereum: any): string {
    if (ethereum.isMetaMask) return 'MetaMask';
    if (ethereum.isPhantom) return 'Phantom';
    if (ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
    if (ethereum.isOkxWallet) return 'OKX Wallet';
    if (ethereum.isTrustWallet) return 'Trust Wallet';
    if (ethereum.isBraveWallet) return 'Brave Wallet';
    
    // Check for other wallet identifiers
    if (ethereum.providerInfo?.name) return ethereum.providerInfo.name;
    if (ethereum._metamask) return 'MetaMask (Legacy)';
    
    return 'Unknown Wallet';
  }

  /**
   * Get a unique identifier for the detected wallet to track connections
   */
  private getWalletId(ethereum: any): string {
    // Use wallet-specific identifiers
    if (ethereum.isMetaMask) return 'metamask';
    if (ethereum.isPhantom) return 'phantom';
    if (ethereum.isCoinbaseWallet) return 'coinbase';
    if (ethereum.isOkxWallet) return 'okx';
    if (ethereum.isTrustWallet) return 'trust';
    if (ethereum.isBraveWallet) return 'brave';
    
    // Fallback to provider info or a generic identifier
    if (ethereum.providerInfo?.uuid) return ethereum.providerInfo.uuid;
    if (ethereum.providerInfo?.name) return ethereum.providerInfo.name.toLowerCase().replace(/\s+/g, '-');
    
    // Last resort: use a hash of some wallet properties
    const identifier = JSON.stringify({
      isMetaMask: ethereum.isMetaMask,
      isPhantom: ethereum.isPhantom,
      chainId: ethereum.chainId,
      selectedAddress: ethereum.selectedAddress
    });
    
    return 'wallet-' + btoa(identifier).slice(0, 8);
  }
}

// Create a singleton instance
export const web3WalletService = new Web3WalletService();
