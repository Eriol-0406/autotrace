
import type { Part, Transaction, Shipment, Role, Vendor } from './types';

export const demoParts: Part[] = [
  // Manufacturer: Raw Materials
  { id: 'P001-R', name: 'Engine Block Casting', quantity: 50, reorderPoint: 20, maxStock: 100, type: 'raw' },
  { id: 'P002-R', name: 'Piston Forgings', quantity: 150, reorderPoint: 50, maxStock: 300, type: 'raw' },
  // Manufacturer: WIP
  { id: 'P001-W', name: 'Machined Engine Block', quantity: 15, reorderPoint: 5, maxStock: 30, type: 'wip' },
  // Manufacturer: Finished Goods
  { id: 'P001-F', name: 'Engine Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished' },
  { id: 'P002-F', name: 'Piston Set', quantity: 70, reorderPoint: 30, maxStock: 150, type: 'finished' },
  { id: 'P003-F', name: 'Brake Pad Kit', quantity: 80, reorderPoint: 40, maxStock: 200, type: 'finished' },

  // Supplier
  { id: 'S-P004', name: '18-inch Alloy Wheel', quantity: 18, reorderPoint: 25, maxStock: 80, type: 'finished', source: 'Wheel Co.' },
  { id: 'S-P005', name: 'Transmission Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished', source: 'Gearbox Inc.' },
  { id: 'S-P006', name: 'Headlight Assembly', quantity: 90, reorderPoint: 40, maxStock: 150, type: 'finished', source: 'Lights R Us' },

  // Distributor
  { id: 'D-P007', name: 'Alternator', quantity: 22, reorderPoint: 25, maxStock: 70, type: 'finished', leadTime: 7, backorders: 5 },
  { id: 'D-P008', name: 'Radiator', quantity: 40, reorderPoint: 20, maxStock: 60, type: 'finished', leadTime: 5, backorders: 0 },
];

export const demoTransactions: Transaction[] = [
  // Manufacturer
  { id: 'T001', partName: 'Engine Block Casting', type: 'supply', quantity: 20, date: '2024-07-15', from: 'Global Metals Inc.', to: 'Manufacturer', role: 'Manufacturer' },
  { id: 'T002', partName: 'Engine Assembly', type: 'demand', quantity: 10, date: '2024-07-14', from: 'Manufacturer', to: 'Auto Parts Supply Co.', role: 'Manufacturer' },
  // Supplier
  { id: 'T003', partName: 'Transmission Assembly', type: 'supply', quantity: 30, date: '2024-07-13', from: 'Apex Automotive Manufacturing', to: 'Supplier', role: 'Supplier' },
  { id: 'T004', partName: 'Transmission Assembly', type: 'demand', quantity: 15, date: '2024-07-12', from: 'Supplier', to: 'Regional Distribution Hub', role: 'Supplier' },
  // Distributor
  { id: 'T005', partName: 'Alternator', type: 'supply', quantity: 50, date: '2024-07-11', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor' },
  { id: 'T006', partName: 'Alternator', type: 'demand', quantity: 25, date: '2024-07-10', from: 'Distributor', to: 'Citywide Repair Shops', role: 'Distributor' },
  { id: 'T007', partName: 'Radiator', type: 'supply', quantity: 60, date: '2024-07-09', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor' },
  { id: 'T008', partName: 'Piston Set', type: 'supply', quantity: 200, date: '2024-07-08', from: 'Apex Automotive Manufacturing', to: 'Supplier', role: 'Supplier' },
];

// Generate a more realistic transaction history for charts
const generateInitialTransactions = () => {
  const history: Transaction[] = [];
  const partsToTrack = demoParts.slice(0, 5); // Use a subset of parts for history
  const today = new Date();

  for (let i = 365 * 2; i > 0; i--) { // 2 years of history
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Randomly create a transaction
    if (Math.random() > 0.8) { // Create a transaction on ~20% of days
      const part = partsToTrack[Math.floor(Math.random() * partsToTrack.length)];
      const type = Math.random() > 0.5 ? 'supply' : 'demand';
      const quantity = Math.floor(Math.random() * (part.maxStock / 10)) + 5;
      
      // Assign role based on part type for realism
      let role: Role = 'Distributor';
      if (part.type === 'raw' || part.type === 'wip' || part.id.startsWith('P')) {
          role = 'Manufacturer';
      } else if (part.source) {
          role = 'Supplier';
      }

      history.push({
        id: `TH-${history.length + 1}`,
        partName: part.name,
        type: type,
        quantity: quantity,
        date: date.toISOString().split('T')[0],
        from: type === 'supply' ? 'Source' : role,
        to: type === 'supply' ? role : 'Destination',
        role: role
      });
    }
  }
  // This check prevents re-adding history on every hot-reload in dev
  if (demoTransactions.length < 20) {
    demoTransactions.push(...history);
  }
}

generateInitialTransactions();


export const demoShipments: Shipment[] = [
  {
    id: 'SHP-001',
    partName: 'Engine Block Casting',
    quantity: 10,
    from: 'Global Metals Inc.',
    to: 'Manufacturer',
    status: 'In Transit',
    estimatedDelivery: '2024-07-28',
    history: [
      { status: 'In Transit', location: 'Mid-Atlantic Ocean', date: '2024-07-25T14:00:00Z' },
      { status: 'In Transit', location: 'Port of Hamburg', date: '2024-07-22T08:30:00Z' },
      { status: 'Order Placed', location: 'Global Metals Inc.', date: '2024-07-21T16:45:00Z' },
    ],
    role: 'Manufacturer',
  },
  {
    id: 'SHP-002',
    partName: 'Brake Pad Kit',
    quantity: 50,
    from: 'Manufacturer',
    to: 'Auto Parts Supply Co.',
    status: 'Delivered',
    estimatedDelivery: '2024-07-20',
    history: [
        { status: 'Delivered', location: 'Auto Parts Supply Co.', date: '2024-07-20T11:00:00Z' },
        { status: 'Out for Delivery', location: 'Chicago Distribution Center', date: '2024-07-20T08:00:00Z' },
        { status: 'In Transit', location: 'I-94 Highway', date: '2024-07-19T15:20:00Z' },
        { status: 'Order Placed', location: 'Manufacturer', date: '2024-07-19T10:15:00Z' },
    ],
    role: 'Supplier'
  },
  {
    id: 'SHP-003',
    partName: '18-inch Alloy Wheel',
    quantity: 20,
    from: 'Auto Parts Supply Co.',
    to: 'Regional Distribution Hub',
    status: 'Delayed',
    estimatedDelivery: '2024-07-22',
    history: [
        { status: 'Delayed', location: 'Customs at Port of Los Angeles', date: '2024-07-23T09:00:00Z' },
        { status: 'In Transit', location: 'Port of Los Angeles, USA', date: '2024-07-22T18:00:00Z' },
        { status: 'In Transit', location: 'Union Pacific Rail, Denver', date: '2024-07-20T12:00:00Z' },
        { status: 'In Transit', location: 'Central Supplier Hub, Chicago', date: '2024-07-19T11:40:00Z' },
        { status: 'Order Placed', location: 'Auto Parts Supply Co.', date: '2024-07-18T14:00:00Z' },
    ],
    role: 'Distributor'
  },
];

const wallet = () => "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

export const allVendors: Vendor[] = [
    // Manufacturer's Vendors (Raw Material Suppliers)
    { id: 'V001', name: 'Global Metals Inc.', category: 'Raw Materials', onboardingDate: '2022-01-15', contactEmail: 'sales@globalmetals.com', relationshipType: 'vendor', roles: ['Manufacturer'], walletAddress: wallet(), rating: 4.8, fulfillmentRate: 98, suppliedParts: [demoParts[0], demoParts[1]] },
    { id: 'V002', name: 'Precision Pistons Ltd.', category: 'Component Forgings', onboardingDate: '2021-11-20', contactEmail: 'contact@precisionpistons.com', relationshipType: 'vendor', roles: ['Manufacturer'], walletAddress: wallet(), rating: 4.5, fulfillmentRate: 92, suppliedParts: [demoParts[1]] },

    // Supplier's Vendors (Manufacturers)
    { id: 'V004', name: 'Apex Automotive Manufacturing', category: 'Engine Assemblies', onboardingDate: '2022-05-25', contactEmail: 'b2b@apexauto.com', relationshipType: 'vendor', roles: ['Supplier'], walletAddress: wallet(), rating: 4.9, fulfillmentRate: 99, suppliedParts: [demoParts[3], demoParts[4], demoParts[5]] },
    
    // Distributor's Vendors (Suppliers)
    { id: 'V003', name: 'Auto Parts Supply Co.', category: 'General Components', onboardingDate: '2023-03-10', contactEmail: 'orders@autopartssupply.com', relationshipType: 'vendor', roles: ['Distributor'], walletAddress: wallet(), rating: 4.2, fulfillmentRate: 88, suppliedParts: [demoParts[6], demoParts[7], demoParts[8]] },
    { id: 'V005', name: 'Regional Distribution Hub', category: 'General Automotive', onboardingDate: '2020-08-01', contactEmail: 'inbound@regionaldist.com', relationshipType: 'vendor', roles: ['Distributor'], walletAddress: wallet(), rating: 4.0, fulfillmentRate: 94, suppliedParts: [demoParts[9], demoParts[10]] },
    
    // Customers (for various roles)
    { id: 'C001', name: 'Auto Parts Supply Co.', category: 'Engine Components', onboardingDate: '2023-03-10', contactEmail: 'orders@autopartssupply.com', relationshipType: 'customer', roles: ['Manufacturer'], walletAddress: wallet(), rating: 5.0, fulfillmentRate: 100 },
    { id: 'C002', name: 'Regional Distribution Hub', category: 'General Automotive', onboardingDate: '2020-08-01', contactEmail: 'inbound@regionaldist.com', relationshipType: 'customer', roles: ['Supplier'], walletAddress: wallet(), rating: 4.6, fulfillmentRate: 97 },
    { id: 'C003', name: 'Citywide Repair Shops', category: 'Service & Repair', onboardingDate: '2019-06-18', contactEmail: 'parts@citywiderepair.com', relationshipType: 'customer', roles: ['Distributor'], walletAddress: wallet(), rating: 4.8, fulfillmentRate: 100 },
    { id: 'C004', name: 'National Auto Retail', category: 'Retail', onboardingDate: '2021-02-22', contactEmail: 'procurement@nationalauto.com', relationshipType: 'customer', roles: ['Distributor'], walletAddress: wallet(), rating: 4.3, fulfillmentRate: 91 },
];

// Helper functions to get role-specific data
export const getDataForRole = (role: Role | null, allParts: Part[], allTransactions: Transaction[], allShipments: Shipment[]) => {
    if (!role) return { parts: [], transactions: [], shipments: [] };
    
    const roleTransactions = allTransactions.filter(t => t.role === role || (role === 'Supplier' && t.to === 'Supplier'));
    const roleShipments = allShipments.filter(s => s.role === role);

    switch (role) {
        case 'Manufacturer':
            return {
                parts: allParts.filter(p => ['raw', 'wip', 'finished'].includes(p.type) && !p.source && !p.leadTime),
                transactions: roleTransactions,
                shipments: roleShipments,
            };
        case 'Supplier':
             return {
                parts: allParts.filter(p => !!p.source),
                transactions: roleTransactions,
                shipments: roleShipments,
            };
        case 'Distributor':
            return {
                parts: allParts.filter(p => !!p.leadTime),
                transactions: roleTransactions,
                shipments: roleShipments,
            };
        default:
            return { parts: [], transactions: [], shipments: [] };
    }
}

export const getVendorsForRole = (role: Role | null, currentVendors: Vendor[]) => {
    if (!role) return { vendors: [], customers: [] };

    const vendors = currentVendors.filter(v => v.roles.includes(role) && v.relationshipType === 'vendor');
    const customers = currentVendors.filter(v => v.roles.includes(role) && v.relationshipType === 'customer');

    return { vendors, customers };
}

export function placeOrder(
    order: { fromRole: Role, toVendor: Vendor, part: Part, quantity: number },
    currentData: { parts: Part[], transactions: Transaction[], shipments: Shipment[] }
) {
    const { fromRole, toVendor, part, quantity } = order;

    const orderDate = new Date();

    const newTransactions = [...currentData.transactions];
    const newShipments = [...currentData.shipments];

    // Create a new "supply" transaction for the ordering user
    const newTransaction: Transaction = {
        id: `T${String(newTransactions.length + 1).padStart(3, '0')}`,
        partName: part.name,
        type: 'supply',
        quantity: quantity,
        date: orderDate.toISOString().split('T')[0],
        from: toVendor.name,
        to: fromRole,
        role: fromRole,
    };
    newTransactions.unshift(newTransaction);

    // Create a corresponding new Shipment
    const estDelivery = new Date();
    estDelivery.setDate(orderDate.getDate() + (part.leadTime || 7)); // Use part lead time or default to 7 days
    
    const newShipment: Shipment = {
        id: `SHP-${String(newShipments.length + 1).padStart(3, '0')}`,
        partName: part.name,
        quantity: quantity,
        from: toVendor.name,
        to: fromRole,
        status: 'Order Placed',
        estimatedDelivery: estDelivery.toISOString().split('T')[0],
        history: [
            { status: 'Order Placed', location: toVendor.name, date: orderDate.toISOString() }
        ],
        role: fromRole,
    };
    newShipments.unshift(newShipment);

    // NOTE: Inventory is NOT updated here anymore. It's updated upon receiving the shipment.
    
    return { 
        success: true, 
        updatedData: {
            parts: currentData.parts, // Parts are unchanged for now
            transactions: newTransactions,
            shipments: newShipments,
        }
    };
}


export function receiveShipment(
    shipmentId: string,
    currentData: { parts: Part[], transactions: Transaction[], shipments: Shipment[] }
) {
    const { parts, shipments, transactions } = currentData;
    const shipmentToReceive = shipments.find(s => s.id === shipmentId);

    if (!shipmentToReceive || shipmentToReceive.status === 'Delivered') {
        return { success: false, updatedData: currentData };
    }

    const newParts = [...parts];
    const newShipments = [...shipments];

    // 1. Update part quantity
    const partToUpdateIdx = newParts.findIndex(p => p.name === shipmentToReceive.partName);
    if (partToUpdateIdx > -1) {
        newParts[partToUpdateIdx].quantity += shipmentToReceive.quantity;
    } else {
        // If the part doesn't exist, create it.
        const masterPart = demoParts.find(p => p.name === shipmentToReceive.partName) || { id: `P-NEW-${Math.random()}`, reorderPoint: 20, maxStock: 100, type: 'finished' };
        newParts.push({
            ...masterPart,
            id: `${shipmentToReceive.role.charAt(0)}-${masterPart.id}`,
            name: shipmentToReceive.partName,
            quantity: shipmentToReceive.quantity,
            type: shipmentToReceive.role === 'Manufacturer' ? 'raw' : 'finished'
        });
    }

    // 2. Update shipment status
    const shipmentToUpdateIdx = newShipments.findIndex(s => s.id === shipmentId);
    if (shipmentToUpdateIdx > -1) {
        newShipments[shipmentToUpdateIdx].status = 'Delivered';
        newShipments[shipmentToUpdateIdx].history.unshift({
            status: 'Delivered',
            location: shipmentToReceive.to,
            date: new Date().toISOString(),
        });
    }

    return {
        success: true,
        updatedData: {
            parts: newParts,
            shipments: newShipments,
            transactions: transactions, // Transactions are unchanged
        }
    };
}


export const getPartHistory = (part: Part, allTransactions: Transaction[]) => {
    const relevantTransactions = allTransactions
        .filter(t => t.partName === part.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (relevantTransactions.length === 0) {
        return [{ date: new Date().toISOString().split('T')[0], stock: part.quantity }];
    }
    
    let currentStock = part.quantity;
    const history: { date: string, stock: number }[] = [{ date: new Date().toISOString().split('T')[0], stock: currentStock }];

    // Work backwards from the current stock level
    for (let i = relevantTransactions.length - 1; i >= 0; i--) {
        const tx = relevantTransactions[i];
        if (new Date(tx.date) < new Date(history[0].date)) {
             if (tx.type === 'supply') {
                currentStock -= tx.quantity;
            } else { // demand
                currentStock += tx.quantity;
            }
            history.unshift({ date: tx.date, stock: Math.max(0, currentStock) });
        }
    }

    return history;
};
