import type { Part, Transaction, Shipment, Role, Vendor } from './types';

// Simplified demo data - only 10 records per account type
export const demoParts: Part[] = [
  // Manufacturer: Raw Materials (3)
  { id: 'P001-R', name: 'Engine Block Casting', quantity: 50, reorderPoint: 20, maxStock: 100, type: 'raw' },
  { id: 'P002-R', name: 'Piston Forgings', quantity: 150, reorderPoint: 50, maxStock: 300, type: 'raw' },
  { id: 'P003-R', name: 'Steel Rods', quantity: 80, reorderPoint: 30, maxStock: 150, type: 'raw' },
  
  // Manufacturer: Finished Goods (3)
  { id: 'P001-F', name: 'Engine Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished' },
  { id: 'P002-F', name: 'Piston Set', quantity: 70, reorderPoint: 30, maxStock: 150, type: 'finished' },
  { id: 'P003-F', name: 'Brake Pad Kit', quantity: 80, reorderPoint: 40, maxStock: 200, type: 'finished' },

  // Supplier (2)
  { id: 'S-P004', name: '18-inch Alloy Wheel', quantity: 18, reorderPoint: 25, maxStock: 80, type: 'finished', source: 'Wheel Co.' },
  { id: 'S-P005', name: 'Transmission Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished', source: 'Gearbox Inc.' },

  // Distributor (2)
  { id: 'D-P007', name: 'Alternator', quantity: 22, reorderPoint: 25, maxStock: 70, type: 'finished', leadTime: 7, backorders: 5 },
  { id: 'D-P008', name: 'Radiator', quantity: 40, reorderPoint: 20, maxStock: 60, type: 'finished', leadTime: 5, backorders: 0 },
];

export const demoTransactions: Transaction[] = [
  // Manufacturer transactions (4)
  { id: 'T-001', partName: 'Engine Block Casting', type: 'supply', quantity: 20, date: '2024-07-15', from: 'Global Metals Inc.', to: 'Manufacturer', role: 'Manufacturer', status: 'completed', fromWallet: '0x9876543210987654321098765432109876543210', toWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', invoiceNumber: 'INV-2024-001' },
  { id: 'T-002', partName: 'Engine Assembly', type: 'demand', quantity: 10, date: '2024-07-14', from: 'Manufacturer', to: 'Auto Parts Supply Co.', role: 'Manufacturer', status: 'approved', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-002' },
  { id: 'T-003', partName: 'Piston Set', type: 'supply', quantity: 50, date: '2024-07-13', from: 'Manufacturer', to: 'Supplier', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-003' },
  { id: 'T-004', partName: 'Brake Pad Kit', type: 'demand', quantity: 25, date: '2024-07-12', from: 'Manufacturer', to: 'Regional Distribution Hub', role: 'Manufacturer', status: 'pending', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2024-004' },
  
  // Supplier transactions (3)
  { id: 'T-005', partName: 'Transmission Assembly', type: 'supply', quantity: 30, date: '2024-07-11', from: 'Apex Automotive Manufacturing', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x9876543210987654321098765432109876543210', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-005' },
  { id: 'T-006', partName: '18-inch Alloy Wheel', type: 'demand', quantity: 15, date: '2024-07-10', from: 'Supplier', to: 'Regional Distribution Hub', role: 'Supplier', status: 'approved', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2024-006' },
  { id: 'T-007', partName: 'Transmission Assembly', type: 'demand', quantity: 20, date: '2024-07-09', from: 'Supplier', to: 'Citywide Repair Shops', role: 'Supplier', status: 'pending', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-007' },
  
  // Distributor transactions (3)
  { id: 'T-008', partName: 'Alternator', type: 'supply', quantity: 50, date: '2024-07-08', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-008' },
  { id: 'T-009', partName: 'Alternator', type: 'demand', quantity: 25, date: '2024-07-07', from: 'Distributor', to: 'Citywide Repair Shops', role: 'Distributor', status: 'approved', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-009' },
  { id: 'T-010', partName: 'Radiator', type: 'supply', quantity: 60, date: '2024-07-06', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-010' },
];

export const demoShipments: Shipment[] = [
  // Manufacturer shipments (3)
  { id: 'SHP-011', partName: 'Engine Assembly', quantity: 10, status: 'Delivered', estimatedDelivery: '2024-07-15', history: [{ status: 'Delivered', location: 'Auto Parts Supply Co.', date: '2024-07-15' }], role: 'Manufacturer', from: 'Manufacturer', to: 'Auto Parts Supply Co.', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99' },
  { id: 'SHP-012', partName: 'Piston Set', quantity: 50, status: 'In Transit', estimatedDelivery: '2024-07-16', history: [{ status: 'In Transit', location: 'Distribution Center', date: '2024-07-14' }], role: 'Manufacturer', from: 'Manufacturer', to: 'Supplier', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99' },
  { id: 'SHP-013', partName: 'Brake Pad Kit', quantity: 25, status: 'Pending', estimatedDelivery: '2024-07-18', history: [{ status: 'Pending', location: 'Warehouse', date: '2024-07-13' }], role: 'Manufacturer', from: 'Manufacturer', to: 'Regional Distribution Hub', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x1234567890123456789012345678901234567890' },
  
  // Supplier shipments (3)
  { id: 'SHP-014', partName: 'Transmission Assembly', quantity: 30, status: 'Delivered', estimatedDelivery: '2024-07-12', history: [{ status: 'Delivered', location: 'Supplier Warehouse', date: '2024-07-12' }], role: 'Supplier', from: 'Apex Automotive Manufacturing', to: 'Supplier', fromWallet: '0x9876543210987654321098765432109876543210', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99' },
  { id: 'SHP-015', partName: '18-inch Alloy Wheel', quantity: 15, status: 'In Transit', estimatedDelivery: '2024-07-13', history: [{ status: 'In Transit', location: 'Regional Hub', date: '2024-07-11' }], role: 'Supplier', from: 'Supplier', to: 'Regional Distribution Hub', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x1234567890123456789012345678901234567890' },
  { id: 'SHP-016', partName: 'Transmission Assembly', quantity: 20, status: 'Pending', estimatedDelivery: '2024-07-15', history: [{ status: 'Pending', location: 'Supplier Warehouse', date: '2024-07-10' }], role: 'Supplier', from: 'Supplier', to: 'Citywide Repair Shops', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x6666777788889999000011112222333344445555' },
  
  // Distributor shipments (4)
  { id: 'SHP-017', partName: 'Alternator', quantity: 50, status: 'Delivered', estimatedDelivery: '2024-07-09', history: [{ status: 'Delivered', location: 'Distributor Hub', date: '2024-07-09' }], role: 'Distributor', from: 'Auto Parts Supply Co.', to: 'Distributor', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444' },
  { id: 'SHP-018', partName: 'Alternator', quantity: 25, status: 'In Transit', estimatedDelivery: '2024-07-10', history: [{ status: 'In Transit', location: 'Citywide Repair', date: '2024-07-08' }], role: 'Distributor', from: 'Distributor', to: 'Citywide Repair Shops', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x6666777788889999000011112222333344445555' },
  { id: 'SHP-019', partName: 'Radiator', quantity: 60, status: 'Delivered', estimatedDelivery: '2024-07-07', history: [{ status: 'Delivered', location: 'Distributor Hub', date: '2024-07-07' }], role: 'Distributor', from: 'Auto Parts Supply Co.', to: 'Distributor', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444' },
  { id: 'SHP-020', partName: 'Radiator', quantity: 30, status: 'Pending', estimatedDelivery: '2024-07-12', history: [{ status: 'Pending', location: 'Distributor Warehouse', date: '2024-07-06' }], role: 'Distributor', from: 'Distributor', to: 'National Auto Retail', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x7777888899990000111122223333444455556666' },
];

export const allVendors: Vendor[] = [
  // Manufacturer's Vendors (3)
  { id: 'V001', name: 'Global Metals Inc.', category: 'Raw Materials', onboardingDate: '2022-01-15', contactEmail: 'sales@globalmetals.com', relationshipType: 'vendor', roles: ['Manufacturer'], walletAddress: '0x9876543210987654321098765432109876543210', rating: 4.8, fulfillmentRate: 98, suppliedParts: [demoParts[0], demoParts[1]] },
  { id: 'V002', name: 'Precision Pistons Ltd.', category: 'Component Forgings', onboardingDate: '2021-11-20', contactEmail: 'contact@precisionpistons.com', relationshipType: 'vendor', roles: ['Manufacturer'], walletAddress: '0x1111222233334444555566667777888899990000', rating: 4.5, fulfillmentRate: 92, suppliedParts: [demoParts[1]] },
  { id: 'V003', name: 'Steel Works Corp', category: 'Raw Materials', onboardingDate: '2022-03-10', contactEmail: 'orders@steelworks.com', relationshipType: 'vendor', roles: ['Manufacturer'], walletAddress: '0x2222333344445555666677778888999900001111', rating: 4.2, fulfillmentRate: 88, suppliedParts: [demoParts[2]] },

  // Supplier's Vendors (3)
  { id: 'V004', name: 'Apex Automotive Manufacturing', category: 'Engine Assemblies', onboardingDate: '2022-05-25', contactEmail: 'b2b@apexauto.com', relationshipType: 'vendor', roles: ['Supplier'], walletAddress: '0x3333444455556666777788889999000011112222', rating: 4.9, fulfillmentRate: 99, suppliedParts: [demoParts[3], demoParts[4], demoParts[5]] },
  { id: 'V005', name: 'Premium Engine Works', category: 'Engine Manufacturing', onboardingDate: '2021-08-15', contactEmail: 'sales@premiumengines.com', relationshipType: 'vendor', roles: ['Supplier'], walletAddress: '0x4444555566667777888899990000111122223333', rating: 4.7, fulfillmentRate: 95, suppliedParts: [demoParts[0], demoParts[2]] },
  { id: 'V006', name: 'Wheel Co.', category: 'Wheel Manufacturing', onboardingDate: '2022-02-20', contactEmail: 'orders@wheelco.com', relationshipType: 'vendor', roles: ['Supplier'], walletAddress: '0x5555666677778888999900001111222233334444', rating: 4.3, fulfillmentRate: 90, suppliedParts: [demoParts[6]] },

  // Distributor's Vendors (3)
  { id: 'V007', name: 'Auto Parts Supply Co.', category: 'General Components', onboardingDate: '2023-03-10', contactEmail: 'orders@autopartssupply.com', relationshipType: 'vendor', roles: ['Distributor'], walletAddress: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', rating: 4.2, fulfillmentRate: 88, suppliedParts: [demoParts[7], demoParts[8]] },
  { id: 'V008', name: 'Regional Distribution Hub', category: 'General Automotive', onboardingDate: '2020-08-01', contactEmail: 'inbound@regionaldist.com', relationshipType: 'vendor', roles: ['Distributor'], walletAddress: '0x1234567890123456789012345678901234567890', rating: 4.0, fulfillmentRate: 94, suppliedParts: [demoParts[9]] },
  { id: 'V009', name: 'Citywide Repair Shops', category: 'Service & Repair', onboardingDate: '2019-06-18', contactEmail: 'parts@citywiderepair.com', relationshipType: 'vendor', roles: ['Distributor'], walletAddress: '0x6666777788889999000011112222333344445555', rating: 4.8, fulfillmentRate: 100, suppliedParts: [demoParts[8], demoParts[9]] },

  // Customers (1)
  { id: 'C001', name: 'National Auto Retail', category: 'Retail', onboardingDate: '2021-02-22', contactEmail: 'procurement@nationalauto.com', relationshipType: 'customer', roles: ['Distributor'], walletAddress: '0x7777888899990000111122223333444455556666', rating: 4.3, fulfillmentRate: 91 },
];

// Helper function to generate wallet addresses
function wallet(): string {
  return '0x' + Math.random().toString(16).substr(2, 40).padStart(40, '0');
}

// Simplified data generation functions
export const generateInitialTransactions = (userId: string): Transaction[] => {
  // Return empty array - we'll use the static demoTransactions
  return [];
};

export const generateInitialShipments = (userId: string): Shipment[] => {
  // Return empty array - we'll use the static demoShipments
  return [];
};

export const generateUserInventory = (transactions: Transaction[]): Part[] => {
  // Simple inventory calculation based on transactions
  const inventoryMap = new Map<string, number>();
  
  transactions.forEach(tx => {
    if (tx.type === 'supply') {
      inventoryMap.set(tx.partName, (inventoryMap.get(tx.partName) || 0) + tx.quantity);
    } else if (tx.type === 'demand') {
      inventoryMap.set(tx.partName, (inventoryMap.get(tx.partName) || 0) - tx.quantity);
    }
  });

  return Array.from(inventoryMap.entries()).map(([partName, quantity]) => ({
    id: `P-${partName.replace(/\s+/g, '-')}`,
    name: partName,
    quantity: Math.max(0, quantity),
    reorderPoint: 10,
    maxStock: 100,
    type: 'finished' as const,
  }));
};

export const makeUniqueParts = (parts: Part[], userId: string): Part[] => {
  const userPrefix = userId || 'demo';
  return parts.map((part, index) => ({
    ...part,
    id: `${userPrefix}-P${String(index + 1).padStart(3, '0')}`,
    name: String(part.name), // Ensure name is a string
  }));
};

export const makeUniqueTransactions = (transactions: Transaction[], userId: string): Transaction[] => {
  const userPrefix = userId || 'demo';
  return transactions.map((transaction, index) => ({
    ...transaction,
    id: `T${String(index + 1).padStart(3, '0')}`,
    partName: String(transaction.partName), // Ensure partName is a string
  }));
};

export const makeUniqueShipments = (shipments: Shipment[], userId: string): Shipment[] => {
  const userPrefix = userId || 'demo';
  return shipments.map((shipment, index) => ({
    ...shipment,
    id: `S${String(index + 1).padStart(3, '0')}`,
    partName: String(shipment.partName), // Ensure partName is a string
  }));
};

export const getVendorsForRole = (role: Role, forceVendors?: Vendor[]): { vendors: Vendor[]; customers: Vendor[] } => {
  const vendorsToUse = forceVendors || allVendors;
  
  switch (role) {
    case 'Manufacturer':
      return {
        vendors: vendorsToUse.filter(v => v.roles.includes('Manufacturer') && v.relationshipType === 'vendor'),
        customers: vendorsToUse.filter(v => v.roles.includes('Manufacturer') && v.relationshipType === 'customer')
      };
    case 'Supplier':
      return {
        vendors: vendorsToUse.filter(v => v.roles.includes('Supplier') && v.relationshipType === 'vendor'),
        customers: vendorsToUse.filter(v => v.roles.includes('Supplier') && v.relationshipType === 'customer')
      };
    case 'Distributor':
      return {
        vendors: vendorsToUse.filter(v => v.roles.includes('Distributor') && v.relationshipType === 'vendor'),
        customers: vendorsToUse.filter(v => v.roles.includes('Distributor') && v.relationshipType === 'customer')
      };
    default:
      return { vendors: [], customers: [] };
  }
};

export const getDataForRole = (
  role: Role,
  userId: string,
  userWallet?: string,
  isAdmin: boolean = false
): {
  parts: Part[];
  transactions: Transaction[];
  shipments: Shipment[];
  vendors: Vendor[];
} => {
  // Filter transactions by wallet if userWallet is provided
  let filteredTransactions = demoTransactions;
  let filteredShipments = demoShipments;
  
  if (userWallet && !isAdmin) {
    filteredTransactions = demoTransactions.filter(
      tx => tx.fromWallet === userWallet || tx.toWallet === userWallet
    );
    filteredShipments = demoShipments.filter(
      s => s.fromWallet === userWallet || s.toWallet === userWallet
    );
  }

  // Use demo parts directly instead of generating from transactions to avoid [object Object] issues
  const { vendors } = getVendorsForRole(role);
  
  return {
    parts: demoParts.slice(0, 8), // Use first 8 demo parts directly
    transactions: filteredTransactions,
    shipments: demoShipments.slice(0, 10), // Use first 10 demo shipments directly with proper IDs
    vendors,
  };
};

// Simple transaction creation function
export const placeOrder = (
  partName: string,
  quantity: number,
  type: 'demand' | 'supply',
  from: string,
  to: string,
  role: Role,
  fromWallet: string,
  toWallet: string
): Transaction => {
  const newTransactions = [...demoTransactions];
  const transactionId = `T-${String(newTransactions.length + 1).padStart(3, '0')}`;
  
  return {
    id: transactionId,
    partName,
    type,
    quantity,
    date: new Date().toISOString().split('T')[0],
    from,
    to,
    role,
    status: 'pending',
    fromWallet,
    toWallet,
    invoiceNumber: `INV-2024-${String(newTransactions.length + 1).padStart(3, '0')}`,
  };
};

// Missing functions that components are trying to import
export const receiveShipment = (shipmentId: string, userId: string): Shipment | null => {
  // Simple implementation - just return a mock shipment
  return demoShipments.find(s => s.id === shipmentId) || null;
};

export const updateShipmentStatus = (shipmentId: string, status: 'Pending' | 'In Transit' | 'Delivered' | 'Delayed', userId: string): boolean => {
  // Simple implementation - just return true for now
  return true;
};

export const getPartHistory = (partName: string, userId: string): { date: string, stock: number }[] => {
  // Simple implementation - return stock history for the part
  const transactions = demoTransactions.filter(tx => tx.partName === partName);
  
  // Generate mock stock history based on transactions
  const history: { date: string, stock: number }[] = [];
  let currentStock = 100; // Starting stock
  
  // Add historical data points
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    
    // Simulate stock changes based on transactions
    const monthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
    });
    
    monthTransactions.forEach(tx => {
      if (tx.type === 'supply') {
        currentStock += tx.quantity;
      } else if (tx.type === 'demand') {
        currentStock -= tx.quantity;
      }
    });
    
    // Add some random variation
    currentStock += Math.floor(Math.random() * 20) - 10;
    currentStock = Math.max(0, currentStock);
    
    history.push({
      date: date.toISOString().split('T')[0],
      stock: currentStock
    });
  }
  
  return history;
};