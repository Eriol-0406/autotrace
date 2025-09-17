
export type Transaction = {
  id: string;
  partName: string;
  type: 'supply' | 'demand';
  quantity: number;
  date: string;
  from: string;
  to: string;
  role: Role; // Which role's perspective this transaction is from
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  fromWallet?: string; // Wallet address of sender
  toWallet?: string; // Wallet address of recipient
  invoiceNumber?: string; // Invoice/receipt number
  blockchainOrderId?: number; // Blockchain order ID
  blockchainTxHash?: string; // Blockchain transaction hash
  etherscanUrl?: string; // Link to view on Etherscan
  approvedBy?: string; // Admin who approved the transaction
  approvedAt?: string; // Timestamp of approval
};

export type Part = {
  id: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  maxStock: number;
  type: 'raw' | 'wip' | 'finished'; // For Manufacturer
  source?: string; // For Supplier
  leadTime?: number; // For Distributor
  backorders?: number; // For Distributor
};

export type Role = 'Manufacturer' | 'Supplier' | 'Distributor';

export type ShipmentStatus = 'Pending' | 'In Transit' | 'Delivered' | 'Delayed';

export type ShipmentHistory = {
    status: ShipmentStatus;
    location: string;
    date: string;
};

export type Shipment = {
  id: string;
  partName: string;
  quantity: number;
  from: string;
  to: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  history: ShipmentHistory[];
  role: Role;
  fromWallet?: string; // Wallet address of sender
  toWallet?: string; // Wallet address of recipient
  blockchainOrderId?: number;
  blockchainTxHash?: string;
  etherscanUrl?: string;
};

export type Vendor = {
    id: string;
    name: string;
    category: string;
    onboardingDate: string;
    contactEmail: string;
    relationshipType: 'vendor' | 'customer';
    roles: Role[];
    walletAddress: string;
    rating: number;
    fulfillmentRate: number;
    suppliedParts?: Part[];
};
