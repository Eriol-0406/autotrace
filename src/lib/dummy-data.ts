import { Transaction, Part, Shipment } from './types';

// Recent Transactions (Last 30 days) - More comprehensive data
export const recentTransactions: Transaction[] = [
  // Recent transactions with values for volume calculations
  { id: 'T-001', partName: 'Engine Block Casting', type: 'supply', quantity: 20, date: '2025-01-20', from: 'Global Metals Inc.', to: 'Manufacturer', role: 'Manufacturer', status: 'completed', fromWallet: '0x9876543210987654321098765432109876543210', toWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', invoiceNumber: 'INV-2025-001', value: 15000 },
  { id: 'T-002', partName: 'Engine Assembly', type: 'demand', quantity: 10, date: '2025-02-19', from: 'Manufacturer', to: 'Auto Parts Supply Co.', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2025-002', value: 25000 },
  { id: 'T-003', partName: 'Piston Set', type: 'supply', quantity: 50, date: '2025-03-18', from: 'Manufacturer', to: 'Supplier', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2025-003', value: 12000 },
  { id: 'T-004', partName: 'Brake Pad Kit', type: 'demand', quantity: 25, date: '2025-04-17', from: 'Manufacturer', to: 'Regional Distribution Hub', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2025-004', value: 5000 },
  { id: 'T-005', partName: 'Transmission Assembly', type: 'supply', quantity: 30, date: '2025-05-16', from: 'Apex Automotive Manufacturing', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x9876543210987654321098765432109876543210', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2025-005', value: 45000 },
  { id: 'T-006', partName: '18-inch Alloy Wheel', type: 'demand', quantity: 15, date: '2025-06-15', from: 'Supplier', to: 'Regional Distribution Hub', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2025-006', value: 9000 },
  { id: 'T-007', partName: 'Alternator', type: 'supply', quantity: 50, date: '2025-07-14', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2025-007', value: 15000 },
  { id: 'T-008', partName: 'Radiator', type: 'demand', quantity: 40, date: '2025-08-13', from: 'Distributor', to: 'Citywide Repair Shops', role: 'Distributor', status: 'completed', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2025-008', value: 8000 },
  { id: 'T-009', partName: 'Steel Rods', type: 'supply', quantity: 100, date: '2024-09-12', from: 'Steel Works Corp', to: 'Manufacturer', role: 'Manufacturer', status: 'completed', fromWallet: '0x2222333344445555666677778888999900001111', toWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', invoiceNumber: 'INV-2024-009', value: 6000 },
  { id: 'T-010', partName: 'Engine Assembly', type: 'demand', quantity: 15, date: '2024-09-11', from: 'Manufacturer', to: 'Regional Distribution Hub', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2024-010', value: 37500 },
  { id: 'T-011', partName: 'Transmission Assembly', type: 'demand', quantity: 20, date: '2024-09-10', from: 'Supplier', to: 'Citywide Repair Shops', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-011', value: 30000 },
  { id: 'T-012', partName: 'Piston Forgings', type: 'supply', quantity: 80, date: '2024-09-09', from: 'Precision Pistons Ltd.', to: 'Manufacturer', role: 'Manufacturer', status: 'completed', fromWallet: '0x1111222233334444555566667777888899990000', toWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', invoiceNumber: 'INV-2024-012', value: 16000 },
  { id: 'T-013', partName: 'Alternator', type: 'demand', quantity: 25, date: '2024-09-08', from: 'Distributor', to: 'National Auto Retail', role: 'Distributor', status: 'completed', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x7777888899990000111122223333444455556666', invoiceNumber: 'INV-2024-013', value: 7500 },
  { id: 'T-014', partName: 'Brake Pad Kit', type: 'supply', quantity: 60, date: '2024-09-07', from: 'Manufacturer', to: 'Supplier', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-014', value: 12000 },
  { id: 'T-015', partName: '18-inch Alloy Wheel', type: 'supply', quantity: 30, date: '2024-09-06', from: 'Wheel Co.', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-015', value: 18000 },
  { id: 'T-016', partName: 'Radiator', type: 'supply', quantity: 60, date: '2024-09-05', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-016', value: 12000 },
  { id: 'T-017', partName: 'Engine Block Casting', type: 'demand', quantity: 25, date: '2024-09-04', from: 'Manufacturer', to: 'Premium Engine Works', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x4444555566667777888899990000111122223333', invoiceNumber: 'INV-2024-017', value: 18750 },
  { id: 'T-018', partName: 'Piston Set', type: 'demand', quantity: 35, date: '2024-09-03', from: 'Supplier', to: 'Regional Distribution Hub', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2024-018', value: 8400 },
  { id: 'T-019', partName: 'Transmission Assembly', type: 'supply', quantity: 25, date: '2024-09-02', from: 'Apex Automotive Manufacturing', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x3333444455556666777788889999000011112222', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-019', value: 37500 },
  { id: 'T-020', partName: 'Alternator', type: 'supply', quantity: 40, date: '2024-09-01', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-020', value: 12000 },
  
  // Additional recent transactions for better dashboard data
  { id: 'T-021', partName: 'Cylinder Head', type: 'supply', quantity: 35, date: '2024-08-30', from: 'Precision Casting Co.', to: 'Manufacturer', role: 'Manufacturer', status: 'completed', fromWallet: '0x3333444455556666777788889999000011112222', toWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', invoiceNumber: 'INV-2024-021', value: 21000 },
  { id: 'T-022', partName: 'Cylinder Head', type: 'demand', quantity: 20, date: '2024-08-29', from: 'Manufacturer', to: 'Premium Engine Works', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x4444555566667777888899990000111122223333', invoiceNumber: 'INV-2024-022', value: 12000 },
  { id: 'T-023', partName: 'Brake Caliper', type: 'supply', quantity: 45, date: '2024-08-28', from: 'Brake Systems Ltd.', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x2222333344445555666677778888999900001111', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-023', value: 13500 },
  { id: 'T-024', partName: 'Brake Caliper', type: 'demand', quantity: 30, date: '2024-08-27', from: 'Supplier', to: 'Citywide Repair Shops', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-024', value: 9000 },
  { id: 'T-025', partName: 'Oil Filter', type: 'supply', quantity: 80, date: '2024-08-26', from: 'Filter Solutions Inc.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x1111222233334444555566667777888899990000', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-025', value: 4000 },
  { id: 'T-026', partName: 'Oil Filter', type: 'demand', quantity: 60, date: '2024-08-25', from: 'Distributor', to: 'National Auto Retail', role: 'Distributor', status: 'completed', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x7777888899990000111122223333444455556666', invoiceNumber: 'INV-2024-026', value: 3000 },
  { id: 'T-027', partName: 'Timing Belt', type: 'supply', quantity: 25, date: '2024-08-24', from: 'Belt Manufacturing Co.', to: 'Manufacturer', role: 'Manufacturer', status: 'completed', fromWallet: '0x8888999900001111222233334444555566667777', toWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', invoiceNumber: 'INV-2024-027', value: 7500 },
  { id: 'T-028', partName: 'Timing Belt', type: 'demand', quantity: 15, date: '2024-08-23', from: 'Manufacturer', to: 'Regional Distribution Hub', role: 'Manufacturer', status: 'completed', fromWallet: '0x742d35Cc6635C0532925a3b8D295759a9C7438B9', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2024-028', value: 4500 },
  { id: 'T-029', partName: 'Spark Plug Set', type: 'supply', quantity: 100, date: '2024-08-22', from: 'Ignition Systems', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x9999000011112222333344445555666677778888', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-029', value: 2500 },
  { id: 'T-030', partName: 'Spark Plug Set', type: 'demand', quantity: 75, date: '2024-08-21', from: 'Supplier', to: 'Citywide Repair Shops', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-030', value: 1875 },
  
  // Additional Supplier Transactions
  { id: 'T-031', partName: 'Fuel Injector', type: 'supply', quantity: 60, date: '2024-08-20', from: 'Fuel Systems Inc.', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x8888999900001111222233334444555566667777', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-031', value: 18000 },
  { id: 'T-032', partName: 'Fuel Injector', type: 'demand', quantity: 40, date: '2024-08-19', from: 'Supplier', to: 'Regional Distribution Hub', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x1234567890123456789012345678901234567890', invoiceNumber: 'INV-2024-032', value: 12000 },
  { id: 'T-033', partName: 'Air Filter', type: 'supply', quantity: 120, date: '2024-08-18', from: 'Filter Solutions Inc.', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x1111222233334444555566667777888899990000', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-033', value: 6000 },
  { id: 'T-034', partName: 'Air Filter', type: 'demand', quantity: 80, date: '2024-08-17', from: 'Supplier', to: 'Citywide Repair Shops', role: 'Supplier', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-034', value: 4000 },
  { id: 'T-035', partName: 'Suspension Strut', type: 'supply', quantity: 35, date: '2024-08-16', from: 'Suspension Works', to: 'Supplier', role: 'Supplier', status: 'completed', fromWallet: '0x7777888899990000111122223333444455556666', toWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', invoiceNumber: 'INV-2024-035', value: 17500 },
  
  // Additional Distributor Transactions
  { id: 'T-036', partName: 'Battery', type: 'supply', quantity: 45, date: '2024-08-15', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-036', value: 13500 },
  { id: 'T-037', partName: 'Battery', type: 'demand', quantity: 30, date: '2024-08-14', from: 'Distributor', to: 'National Auto Retail', role: 'Distributor', status: 'completed', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x7777888899990000111122223333444455556666', invoiceNumber: 'INV-2024-037', value: 9000 },
  { id: 'T-038', partName: 'Windshield Wiper', type: 'supply', quantity: 100, date: '2024-08-13', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-038', value: 3000 },
  { id: 'T-039', partName: 'Windshield Wiper', type: 'demand', quantity: 70, date: '2024-08-12', from: 'Distributor', to: 'Citywide Repair Shops', role: 'Distributor', status: 'completed', fromWallet: '0x5555666677778888999900001111222233334444', toWallet: '0x6666777788889999000011112222333344445555', invoiceNumber: 'INV-2024-039', value: 2100 },
  { id: 'T-040', partName: 'Headlight Assembly', type: 'supply', quantity: 25, date: '2024-08-11', from: 'Auto Parts Supply Co.', to: 'Distributor', role: 'Distributor', status: 'completed', fromWallet: '0x8946099D625BD30B2D6D7f4Ab7A0c85cdC52fF99', toWallet: '0x5555666677778888999900001111222233334444', invoiceNumber: 'INV-2024-040', value: 12500 },
];

// Transaction Volume Data (Monthly breakdown)
export const transactionVolumeData = {
  // Last 12 months transaction volume by role
  monthlyVolume: [
    { month: 'Oct 2023', Manufacturer: 450000, Supplier: 320000, Distributor: 280000, total: 1050000 },
    { month: 'Nov 2023', Manufacturer: 480000, Supplier: 340000, Distributor: 290000, total: 1110000 },
    { month: 'Dec 2023', Manufacturer: 520000, Supplier: 360000, Distributor: 310000, total: 1190000 },
    { month: 'Jan 2024', Manufacturer: 460000, Supplier: 330000, Distributor: 285000, total: 1075000 },
    { month: 'Feb 2024', Manufacturer: 490000, Supplier: 350000, Distributor: 295000, total: 1135000 },
    { month: 'Mar 2024', Manufacturer: 540000, Supplier: 380000, Distributor: 320000, total: 1240000 },
    { month: 'Apr 2024', Manufacturer: 510000, Supplier: 370000, Distributor: 305000, total: 1185000 },
    { month: 'May 2024', Manufacturer: 530000, Supplier: 375000, Distributor: 315000, total: 1220000 },
    { month: 'Jun 2024', Manufacturer: 560000, Supplier: 390000, Distributor: 330000, total: 1280000 },
    { month: 'Jul 2024', Manufacturer: 580000, Supplier: 400000, Distributor: 340000, total: 1320000 },
    { month: 'Aug 2024', Manufacturer: 600000, Supplier: 420000, Distributor: 350000, total: 1370000 },
    { month: 'Sep 2024', Manufacturer: 620000, Supplier: 440000, Distributor: 360000, total: 1420000 },
  ],
  
  // Weekly volume for current month
  weeklyVolume: [
    { week: 'Week 1', volume: 340000, transactions: 45 },
    { week: 'Week 2', volume: 360000, transactions: 48 },
    { week: 'Week 3', volume: 380000, transactions: 52 },
    { week: 'Week 4', volume: 400000, transactions: 55 },
  ],
  
  // Daily volume for current week
  dailyVolume: [
    { day: 'Monday', volume: 75000, transactions: 12 },
    { day: 'Tuesday', volume: 82000, transactions: 14 },
    { day: 'Wednesday', volume: 78000, transactions: 13 },
    { day: 'Thursday', volume: 85000, transactions: 15 },
    { day: 'Friday', volume: 80000, transactions: 13 },
  ],
};

// Inventory Turnover Data
export const inventoryTurnoverData = {
  // Overall turnover rates by role
  overallTurnover: {
    Manufacturer: { rate: 6.2, industry: 5.8, status: 'Above Average' },
    Supplier: { rate: 8.5, industry: 7.2, status: 'Excellent' },
    Distributor: { rate: 12.3, industry: 10.5, status: 'Outstanding' },
  },
  
  // Monthly turnover trends
  monthlyTurnover: [
    { month: 'Oct 2023', Manufacturer: 5.8, Supplier: 7.9, Distributor: 11.2 },
    { month: 'Nov 2023', Manufacturer: 6.1, Supplier: 8.2, Distributor: 11.8 },
    { month: 'Dec 2023', Manufacturer: 6.5, Supplier: 8.8, Distributor: 12.5 },
    { month: 'Jan 2024', Manufacturer: 5.9, Supplier: 8.0, Distributor: 11.5 },
    { month: 'Feb 2024', Manufacturer: 6.2, Supplier: 8.3, Distributor: 12.0 },
    { month: 'Mar 2024', Manufacturer: 6.8, Supplier: 9.0, Distributor: 12.8 },
    { month: 'Apr 2024', Manufacturer: 6.4, Supplier: 8.6, Distributor: 12.2 },
    { month: 'May 2024', Manufacturer: 6.6, Supplier: 8.7, Distributor: 12.4 },
    { month: 'Jun 2024', Manufacturer: 6.9, Supplier: 9.1, Distributor: 13.0 },
    { month: 'Jul 2024', Manufacturer: 7.1, Supplier: 9.3, Distributor: 13.2 },
    { month: 'Aug 2024', Manufacturer: 7.3, Supplier: 9.5, Distributor: 13.5 },
    { month: 'Sep 2024', Manufacturer: 7.5, Supplier: 9.8, Distributor: 13.8 },
  ],
  
  // Part-specific turnover rates
  partTurnover: [
    { part: 'Engine Assembly', turnover: 4.2, category: 'High Value', status: 'Good' },
    { part: 'Transmission Assembly', turnover: 3.8, category: 'High Value', status: 'Good' },
    { part: 'Piston Set', turnover: 8.5, category: 'Fast Moving', status: 'Excellent' },
    { part: 'Brake Pad Kit', turnover: 12.3, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Alternator', turnover: 9.2, category: 'Medium Value', status: 'Excellent' },
    { part: 'Radiator', turnover: 7.8, category: 'Medium Value', status: 'Good' },
    { part: '18-inch Alloy Wheel', turnover: 6.5, category: 'Medium Value', status: 'Good' },
    { part: 'Engine Block Casting', turnover: 3.2, category: 'High Value', status: 'Average' },
    { part: 'Piston Forgings', turnover: 11.2, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Steel Rods', turnover: 15.8, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Cylinder Head', turnover: 5.8, category: 'High Value', status: 'Good' },
    { part: 'Brake Caliper', turnover: 10.2, category: 'Fast Moving', status: 'Excellent' },
    { part: 'Oil Filter', turnover: 14.5, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Timing Belt', turnover: 8.9, category: 'Medium Value', status: 'Good' },
    { part: 'Spark Plug Set', turnover: 16.2, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Fuel Injector', turnover: 12.8, category: 'High Value', status: 'Excellent' },
    { part: 'Air Filter', turnover: 18.5, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Suspension Strut', turnover: 8.3, category: 'High Value', status: 'Good' },
    { part: 'Battery', turnover: 11.2, category: 'Medium Value', status: 'Excellent' },
    { part: 'Windshield Wiper', turnover: 22.1, category: 'Fast Moving', status: 'Outstanding' },
    { part: 'Headlight Assembly', turnover: 6.7, category: 'High Value', status: 'Good' },
  ],
};

// Enhanced Parts with turnover metrics
export const enhancedParts: Part[] = [
  { id: 'P001-R', name: 'Engine Block Casting', quantity: 50, reorderPoint: 20, maxStock: 100, type: 'raw', turnoverRate: 3.2, category: 'High Value' },
  { id: 'P002-R', name: 'Piston Forgings', quantity: 150, reorderPoint: 50, maxStock: 300, type: 'raw', turnoverRate: 11.2, category: 'Fast Moving' },
  { id: 'P003-R', name: 'Steel Rods', quantity: 80, reorderPoint: 30, maxStock: 150, type: 'raw', turnoverRate: 15.8, category: 'Fast Moving' },
  { id: 'P001-F', name: 'Engine Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished', turnoverRate: 4.2, category: 'High Value' },
  { id: 'P002-F', name: 'Piston Set', quantity: 70, reorderPoint: 30, maxStock: 150, type: 'finished', turnoverRate: 8.5, category: 'Fast Moving' },
  { id: 'P003-F', name: 'Brake Pad Kit', quantity: 80, reorderPoint: 40, maxStock: 200, type: 'finished', turnoverRate: 12.3, category: 'Fast Moving' },
  { id: 'S-P004', name: '18-inch Alloy Wheel', quantity: 18, reorderPoint: 25, maxStock: 80, type: 'finished', source: 'Wheel Co.', turnoverRate: 6.5, category: 'Medium Value' },
  { id: 'S-P005', name: 'Transmission Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished', source: 'Gearbox Inc.', turnoverRate: 3.8, category: 'High Value' },
  { id: 'D-P007', name: 'Alternator', quantity: 22, reorderPoint: 25, maxStock: 70, type: 'finished', leadTime: 7, backorders: 5, turnoverRate: 9.2, category: 'Medium Value' },
  { id: 'D-P008', name: 'Radiator', quantity: 40, reorderPoint: 20, maxStock: 60, type: 'finished', leadTime: 5, backorders: 0, turnoverRate: 7.8, category: 'Medium Value' },
  
  // Additional parts for better dashboard coverage
  { id: 'M-P009', name: 'Cylinder Head', quantity: 25, reorderPoint: 15, maxStock: 50, type: 'finished', turnoverRate: 5.8, category: 'High Value' },
  { id: 'S-P010', name: 'Brake Caliper', quantity: 35, reorderPoint: 20, maxStock: 80, type: 'finished', source: 'Brake Systems Ltd.', turnoverRate: 10.2, category: 'Fast Moving' },
  { id: 'D-P011', name: 'Oil Filter', quantity: 60, reorderPoint: 40, maxStock: 120, type: 'finished', leadTime: 3, backorders: 0, turnoverRate: 14.5, category: 'Fast Moving' },
  { id: 'M-P012', name: 'Timing Belt', quantity: 45, reorderPoint: 25, maxStock: 90, type: 'finished', turnoverRate: 8.9, category: 'Medium Value' },
  { id: 'S-P013', name: 'Spark Plug Set', quantity: 80, reorderPoint: 50, maxStock: 150, type: 'finished', source: 'Ignition Systems', turnoverRate: 16.2, category: 'Fast Moving' },
  
  // Additional Supplier Parts
  { id: 'S-P014', name: 'Fuel Injector', quantity: 45, reorderPoint: 25, maxStock: 90, type: 'finished', source: 'Fuel Systems Inc.', turnoverRate: 12.8, category: 'High Value' },
  { id: 'S-P015', name: 'Air Filter', quantity: 90, reorderPoint: 50, maxStock: 180, type: 'finished', source: 'Filter Solutions Inc.', turnoverRate: 18.5, category: 'Fast Moving' },
  { id: 'S-P016', name: 'Suspension Strut', quantity: 25, reorderPoint: 15, maxStock: 50, type: 'finished', source: 'Suspension Works', turnoverRate: 8.3, category: 'High Value' },
  
  // Additional Distributor Parts
  { id: 'D-P017', name: 'Battery', quantity: 35, reorderPoint: 20, maxStock: 70, type: 'finished', leadTime: 5, backorders: 2, turnoverRate: 11.2, category: 'Medium Value' },
  { id: 'D-P018', name: 'Windshield Wiper', quantity: 120, reorderPoint: 60, maxStock: 200, type: 'finished', leadTime: 2, backorders: 0, turnoverRate: 22.1, category: 'Fast Moving' },
  { id: 'D-P019', name: 'Headlight Assembly', quantity: 15, reorderPoint: 10, maxStock: 30, type: 'finished', leadTime: 7, backorders: 1, turnoverRate: 6.7, category: 'High Value' },
];

// Performance Metrics
export const performanceMetrics = {
  // Key Performance Indicators
  kpis: {
    totalTransactionValue: 1850000, // Current month (updated with new transactions)
    totalTransactions: 240, // Current month (updated with new transactions)
    averageTransactionValue: 7708,
    onTimeDelivery: 96.5, // Percentage
    customerSatisfaction: 4.7, // Out of 5
    inventoryAccuracy: 98.2, // Percentage
  },
  
  // Growth metrics
  growth: {
    monthlyGrowth: 3.7, // Percentage
    quarterlyGrowth: 11.2, // Percentage
    yearlyGrowth: 45.8, // Percentage
    customerGrowth: 28.5, // Percentage
  },
  
  // Efficiency metrics
  efficiency: {
    orderFulfillmentTime: 2.3, // Days
    inventoryTurnover: 8.8, // Overall
    cashConversionCycle: 28, // Days
    supplierLeadTime: 5.2, // Days
  },
};

// Helper functions to get data by role
export const getRecentTransactionsByRole = (role: string) => {
  return recentTransactions.filter(tx => tx.role === role);
};

export const getTransactionVolumeByRole = (role: string) => {
  const roleKey = role as keyof typeof transactionVolumeData.monthlyVolume[0];
  return transactionVolumeData.monthlyVolume.map(month => ({
    month: month.month,
    volume: month[roleKey] || 0,
  }));
};

export const getInventoryTurnoverByRole = (role: string) => {
  const roleKey = role as keyof typeof inventoryTurnoverData.monthlyTurnover[0];
  return inventoryTurnoverData.monthlyTurnover.map(month => ({
    month: month.month,
    turnover: month[roleKey] || 0,
  }));
};

export const getPartsByRole = (role: string) => {
  // Filter parts based on role-specific inventory
  switch (role) {
    case 'Manufacturer':
      return enhancedParts.filter(part => ['P001-R', 'P002-R', 'P003-R', 'P001-F', 'P002-F', 'P003-F', 'M-P009', 'M-P012'].includes(part.id));
    case 'Supplier':
      return enhancedParts.filter(part => ['S-P004', 'S-P005', 'S-P010', 'S-P013', 'S-P014', 'S-P015', 'S-P016'].includes(part.id));
    case 'Distributor':
      return enhancedParts.filter(part => ['D-P007', 'D-P008', 'D-P011', 'D-P017', 'D-P018', 'D-P019'].includes(part.id));
    default:
      return enhancedParts;
  }
};
