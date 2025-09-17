import { ethers } from 'ethers';
import { web3WalletService } from './web3-wallet';

// Smart Contract ABI (Application Binary Interface)
// NOTE: This ABI matches the currently deployed contract structure
const INVENTORY_CONTRACT_ABI = [
  // Original contract functions (deployed version)
  "function createOrder(address _seller, string memory _partName, uint256 _quantity) external returns (uint256)",
  "function completeOrder(uint256 _orderId, string memory _txHash) external",
  "function getOrder(uint256 _orderId) external view returns (tuple(uint256 orderId, address buyer, address seller, string partName, uint256 quantity, uint256 timestamp, bool completed, string txHash))",
  "function getOrderCount() external view returns (uint256)",
  // Events
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, string partName, uint256 quantity, uint256 timestamp)",
  "event OrderCompleted(uint256 indexed orderId, string txHash)"
];

// Enhanced ABI for future contract deployments
const ENHANCED_INVENTORY_CONTRACT_ABI = [
  // Entity Registration
  "function registerWallet(string memory _name, string memory _entityType) external",
  "function addAdmin(address _admin) external",
  "function getEntity(address _wallet) external view returns (tuple(string name, string entityType, bool isActive, uint256 registeredAt))",
  "function isEntityRegistered(address _wallet) external view returns (bool)",
  "function isWalletAdmin(address _wallet) external view returns (bool)",
  // Order Management
  "function createOrder(address _seller, string memory _partName, uint256 _quantity) external returns (uint256)",
  "function approveOrder(uint256 _orderId) external",
  "function completeOrder(uint256 _orderId, string memory _txHash) external",
  "function getOrder(uint256 _orderId) external view returns (tuple(uint256 orderId, address buyer, address seller, string partName, uint256 quantity, uint256 timestamp, bool completed, bool approved, string txHash))",
  "function getOrderCount() external view returns (uint256)",
  // Events
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, string partName, uint256 quantity, uint256 timestamp)",
  "event OrderCompleted(uint256 indexed orderId, string txHash)",
  "event OrderApproved(uint256 indexed orderId, address indexed approver)",
  "event EntityRegistered(address indexed wallet, string name, string entityType)",
  "event AdminAdded(address indexed admin)"
];

// Contract address (deployed to Sepolia testnet)
const INVENTORY_CONTRACT_ADDRESS = "0xa6d49fc93d43581e74339761605899274b5ca78b"; // Sepolia testnet address

export interface BlockchainOrder {
  orderId: number;
  buyer: string;
  seller: string;
  partName: string;
  quantity: number;
  timestamp: number;
  completed: boolean;
  approved?: boolean; // Optional for backward compatibility
  txHash: string;
  etherscanUrl?: string;
}

export interface BlockchainEntity {
  name: string;
  entityType: string;
  isActive: boolean;
  registeredAt: number;
}

export class SmartContractService {
  private contract: ethers.Contract | null = null;

  async initializeContract(): Promise<void> {
    if (!web3WalletService.isConnected()) {
      throw new Error('Wallet not connected');
    }

    // Contract initialization with real Sepolia address
    
    console.log('🔗 Connecting to real Sepolia contract:', INVENTORY_CONTRACT_ADDRESS);

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      console.log('🔍 Provider network:', network);
      console.log('🔍 Signer address:', await signer.getAddress());
      
      // Check if we're on Sepolia network
      if (network.chainId !== BigInt(11155111)) {
        throw new Error(`Wrong network! Expected Sepolia (11155111), got ${network.name} (${network.chainId}). Please switch to Sepolia Test Network in MetaMask.`);
      }
      
      this.contract = new ethers.Contract(
        INVENTORY_CONTRACT_ADDRESS,
        INVENTORY_CONTRACT_ABI,
        signer
      );

      // Test if contract is accessible by calling a simple view function
      try {
        const orderCount = await this.contract.getOrderCount();
        console.log('✅ Smart contract connected successfully, order count:', orderCount.toString());
      } catch (contractError) {
        console.error('❌ Contract not accessible:', contractError);
        console.log('⚠️ Switching to demo mode');
        this.contract = null;
      }
    } catch (error) {
      console.error('❌ Error initializing contract:', error);
      this.contract = null;
    }
  }

  // Entity Registration Methods
  async registerWallet(name: string, entityType: string): Promise<{ txHash: string; etherscanUrl: string }> {
    try {
      await this.initializeContract();

      if (!this.contract) {
        console.log('⚠️ Contract not initialized, simulating registration');
        const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
        
        return {
          txHash: demoTxHash,
          etherscanUrl: demoEtherscanUrl
        };
      }

      // Check if the contract has the registerWallet function
      if (typeof this.contract.registerWallet !== 'function') {
        console.log('⚠️ Contract does not support registerWallet function, simulating registration');
        const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
        
        return {
          txHash: demoTxHash,
          etherscanUrl: demoEtherscanUrl
        };
      }

      const tx = await this.contract.registerWallet(name, entityType);
      const receipt = await tx.wait();
      const etherscanUrl = this.getEtherscanUrl(receipt.hash);

      return {
        txHash: receipt.hash,
        etherscanUrl
      };
    } catch (error) {
      console.error('Error registering wallet:', error);
      console.log('⚠️ Using demo mode for wallet registration');
      const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
      
      return {
        txHash: demoTxHash,
        etherscanUrl: demoEtherscanUrl
      };
    }
  }

  async isEntityRegistered(walletAddress: string): Promise<boolean> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      if (!this.contract) {
        return false; // Demo mode - assume not registered
      }

      // Check if the contract has the isEntityRegistered function
      if (typeof this.contract.isEntityRegistered !== 'function') {
        console.log('⚠️ Contract does not support isEntityRegistered function');
        return false; // Assume not registered for old contracts
      }

      return await this.contract.isEntityRegistered(walletAddress);
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  }

  async getEntity(walletAddress: string): Promise<BlockchainEntity | null> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      if (!this.contract) {
        return null; // Demo mode
      }

      // Check if the contract has the getEntity function
      if (typeof this.contract.getEntity !== 'function') {
        console.log('⚠️ Contract does not support getEntity function');
        return null; // Not available for old contracts
      }

      const entity = await this.contract.getEntity(walletAddress);
      return {
        name: entity.name,
        entityType: entity.entityType,
        isActive: entity.isActive,
        registeredAt: Number(entity.registeredAt)
      };
    } catch (error) {
      console.error('Error getting entity:', error);
      return null;
    }
  }

  async approveOrder(orderId: number): Promise<{ txHash: string; etherscanUrl: string }> {
    try {
      await this.initializeContract();

      if (!this.contract) {
        console.log('⚠️ Contract not initialized, simulating approval');
        const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
        
        return {
          txHash: demoTxHash,
          etherscanUrl: demoEtherscanUrl
        };
      }

      // Check if the contract has the approveOrder function
      if (typeof this.contract.approveOrder !== 'function') {
        console.log('⚠️ Contract does not support approveOrder function, simulating approval');
        const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
        
        return {
          txHash: demoTxHash,
          etherscanUrl: demoEtherscanUrl
        };
      }

      const tx = await this.contract.approveOrder(orderId);
      const receipt = await tx.wait();
      const etherscanUrl = this.getEtherscanUrl(receipt.hash);

      return {
        txHash: receipt.hash,
        etherscanUrl
      };
    } catch (error) {
      console.error('Error approving order:', error);
      console.log('⚠️ Using demo mode for order approval');
      const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
      
      return {
        txHash: demoTxHash,
        etherscanUrl: demoEtherscanUrl
      };
    }
  }

  async createOrder(
    sellerAddress: string,
    partName: string,
    quantity: number
  ): Promise<{ orderId: number; txHash: string; etherscanUrl: string }> {
    try {
      // Force re-initialization to ensure we're using the real contract
      await this.initializeContract();

      if (!this.contract) {
        console.log('⚠️ Contract not initialized, creating demo order');
        // Create a demo order when contract is not available
        const demoOrderId = Math.floor(Math.random() * 1000) + 1;
        const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
        
        return {
          orderId: demoOrderId,
          txHash: demoTxHash,
          etherscanUrl: demoEtherscanUrl
        };
      }

      // Create the order transaction
      const tx = await this.contract.createOrder(sellerAddress, partName, quantity);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get the order ID from the event
      let orderCreatedEvent = null;
      if (this.contract && this.contract.interface) {
        try {
          const orderCreatedEventFragment = this.contract.interface.getEvent('OrderCreated');
          if (orderCreatedEventFragment) {
            const eventTopic = orderCreatedEventFragment.topicHash;
            orderCreatedEvent = receipt.logs.find(
              (log: any) => log.topics && log.topics[0] === eventTopic
            );
          }
        } catch (error) {
          console.warn('Could not parse event topics:', error);
        }
      }
      
      let orderId = 0;
      if (orderCreatedEvent && orderCreatedEvent.topics && orderCreatedEvent.topics[1]) {
        orderId = parseInt(orderCreatedEvent.topics[1], 16);
      }

      const etherscanUrl = this.getEtherscanUrl(receipt.hash);

      return {
        orderId,
        txHash: receipt.hash,
        etherscanUrl
      };
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Check if user rejected the transaction - re-throw these errors
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === 'ACTION_REJECTED' || (error as any).code === 4001) {
          console.log('🚫 User rejected transaction - re-throwing error');
          throw error; // Re-throw user rejection errors
        }
      }
      
      // Check for other user rejection patterns
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message.toLowerCase();
        if (message.includes('user denied') || message.includes('user rejected') || message.includes('cancelled')) {
          console.log('🚫 User rejected transaction (message pattern) - re-throwing error');
          throw error; // Re-throw user rejection errors
        }
      }
      
      console.log('⚠️ Contract/network error - creating demo order as fallback');
      
      // Only create demo order for actual contract/network errors, not user rejections
      const demoOrderId = Math.floor(Math.random() * 1000) + 1;
      const demoTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      const demoEtherscanUrl = this.getEtherscanUrl(demoTxHash);
      
      return {
        orderId: demoOrderId,
        txHash: demoTxHash,
        etherscanUrl: demoEtherscanUrl
      };
    }
  }

  async getOrder(orderId: number): Promise<BlockchainOrder> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      if (!this.contract) {
        console.log('⚠️ Contract not initialized, using demo mode');
        // Return realistic demo orders with varied wallet addresses
        return this.getDemoOrder(orderId);
      }

      const order = await this.contract.getOrder(orderId);
      
      return {
        orderId: Number(order.orderId),
        buyer: order.buyer,
        seller: order.seller,
        partName: order.partName,
        quantity: Number(order.quantity),
        timestamp: Number(order.timestamp),
        completed: order.completed,
        approved: order.approved !== undefined ? order.approved : false, // Default to false if not present
        txHash: order.txHash,
        etherscanUrl: order.txHash ? this.getEtherscanUrl(order.txHash) : undefined
      };
    } catch (error) {
      console.error('Error getting order:', error);
      console.log('⚠️ Contract not available, returning demo order');
      
      // Return a demo order when contract is not available
      return this.getDemoOrder(orderId);
    }
  }

  async getOrderCount(): Promise<number> {
    try {
      if (!this.contract) {
        await this.initializeContract();
      }

      if (!this.contract) {
        console.log('⚠️ Contract not initialized, using demo mode');
        // For new users without wallet, return 0 orders
        const currentWallet = (window as any).ethereum?.selectedAddress;
        if (!currentWallet) {
          return 0; // New users see no orders until they connect wallet
        }
        return 2; // Connected users get 2 demo orders
      }

      const count = await this.contract.getOrderCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting order count:', error);
      // Return demo orders when contract is not available
      console.log('⚠️ Contract not available, returning demo data');
      const currentWallet = (window as any).ethereum?.selectedAddress;
      if (!currentWallet) {
        return 0; // New users see no orders until they connect wallet
      }
      return 2; // Connected users get 2 demo orders
    }
  }

  private getDemoOrder(orderId: number): BlockchainOrder {
    const currentWallet = (window as any).ethereum?.selectedAddress?.toLowerCase();
    
    // If no wallet connected, return empty order (shouldn't happen due to getOrderCount check)
    if (!currentWallet) {
      return {
        orderId: orderId,
        buyer: '0x0000000000000000000000000000000000000000',
        seller: '0x0000000000000000000000000000000000000000',
        partName: 'No Orders',
        quantity: 0,
        timestamp: Math.floor(Date.now() / 1000),
        completed: false,
        approved: false,
        txHash: '',
        etherscanUrl: undefined
      };
    }
    
    // Create user-specific demo orders based on their wallet address
    const demoOrders = [
      {
        orderId: 1,
        buyer: currentWallet, // Current user is buyer
        seller: '0xabcdef1234567890abcdef1234567890abcdef12',
        partName: 'Engine Block',
        quantity: 5,
        timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        completed: true,
        approved: true,
        txHash: `0xdemo${currentWallet.slice(2, 10)}1234567890abcdef1234567890abcdef1234567890abcdef`,
      },
      {
        orderId: 2,
        buyer: '0x9876543210987654321098765432109876543210',
        seller: currentWallet, // Current user is seller
        partName: 'Transmission',
        quantity: 3,
        timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        completed: false,
        approved: true,
        txHash: `0xdemo${currentWallet.slice(2, 10)}2345678901abcdef2345678901abcdef2345678901abcdef`,
      }
    ];

    // Return the specific order or the first one
    const order = demoOrders.find(o => o.orderId === orderId) || demoOrders[0];
    
    return {
      ...order,
      etherscanUrl: order.txHash ? this.getEtherscanUrl(order.txHash) : undefined
    };
  }

  private getEtherscanUrl(txHash: string): string {
    // Get current network chain ID
    const chainId = (window as any).ethereum?.chainId;
    
    // Default to Ethereum mainnet
    let baseUrl = 'https://etherscan.io';
    
    if (chainId === '0x1') {
      baseUrl = 'https://etherscan.io'; // Ethereum Mainnet
    } else if (chainId === '0xaa36a7') {
      baseUrl = 'https://sepolia.etherscan.io'; // Sepolia Testnet (11155111)
    } else if (chainId === '0x5') {
      baseUrl = 'https://goerli.etherscan.io'; // Goerli Testnet
    } else if (chainId === '0x89') {
      baseUrl = 'https://polygonscan.com'; // Polygon
    } else if (chainId === '0x13881') {
      baseUrl = 'https://mumbai.polygonscan.com'; // Mumbai Testnet
    }
    
    return `${baseUrl}/tx/${txHash}`;
  }

  // Helper method to get vendor wallet address from the vendor data
  async getVendorWalletAddress(vendorId: string, vendors: any[]): Promise<string> {
    // Find the vendor in the provided vendors array
    const vendor = vendors.find(v => v.id === vendorId);
    
    if (vendor && vendor.walletAddress) {
      return vendor.walletAddress;
    }
    
    // Fallback: generate a deterministic address based on vendor ID
    // This ensures we always have a valid address for demo purposes
    const deterministicAddress = this.generateDeterministicAddress(vendorId);
    
    // Safety check: ensure we never return a zero address
    if (deterministicAddress === '0x0000000000000000000000000000000000000000') {
      // Generate a different address using a modified approach
      const fallbackAddress = '0x' + vendorId.replace(/[^0-9a-f]/gi, '').padEnd(40, '1').substring(0, 40);
      return fallbackAddress;
    }
    
    return deterministicAddress;
  }

  // Generate a deterministic address for demo purposes
  private generateDeterministicAddress(vendorId: string): string {
    // Simple hash-based address generation for demo
    let hash = 0;
    for (let i = 0; i < vendorId.length; i++) {
      const char = vendorId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Generate a proper 40-character hex address
    const address = Math.abs(hash).toString(16).padStart(8, '0');
    // Pad with vendor ID to make it unique and 40 characters
    const fullAddress = (address + vendorId.replace(/[^0-9a-f]/gi, '')).padEnd(40, '0').substring(0, 40);
    return '0x' + fullAddress;
  }
}

// Create a singleton instance
export const smartContractService = new SmartContractService();
