
"use client";

import { Boxes, Package, AlertCircle, ArrowDownUp, Factory, Building, Truck } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { StockAlerts } from '@/components/dashboard/stock-alerts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { SupplyForecast } from '@/components/dashboard/supply-forecast';
import { getDataForRole } from '@/lib/data';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { ReportsDataService } from '@/lib/reports-data';

const roleSpecifics = {
  Manufacturer: {
    color: 'text-blue-500',
    icon: Factory,
    cards: [
      { title: 'Total Inventory', icon: Boxes, description: 'Raw materials + finished goods' },
      { title: 'SKUs', icon: Package, description: 'Unique part types' },
      { title: 'Material Alerts', icon: AlertCircle, description: 'Raw materials below reorder' },
      { title: 'Shipments', icon: ArrowDownUp, description: 'Outbound to suppliers' },
    ]
  },
  Supplier: {
    color: 'text-green-500',
    icon: Building,
    cards: [
      { title: 'Warehouse Stock', icon: Boxes, description: 'Total items in warehouse' },
      { title: 'Part Varieties', icon: Package, description: 'Unique SKUs handled' },
      { title: 'Low Stock Alerts', icon: AlertCircle, description: 'Items below reorder point' },
      { title: 'Transactions', icon: ArrowDownUp, description: 'Inbound/outbound movements' },
    ]
  },
  Distributor: {
    color: 'text-orange-500',
    icon: Truck,
    cards: [
      { title: 'Sellable Stock', icon: Boxes, description: 'Customer-facing inventory' },
      { title: 'Product Lines', icon: Package, description: 'Number of product lines' },
      { title: 'Backorders', icon: AlertCircle, description: 'Unfulfilled customer orders' },
      { title: 'Fulfilled Orders', icon: ArrowDownUp, description: 'Recent sales to customers' },
    ]
  }
};

export function ClientDashboard() {
  const { role, currentUser, walletInfo } = useAppState();
  
  if (!role) {
    return <div className="flex items-center justify-center h-full"><p>Loading data...</p></div>
  }

  // Framework requirement: Filter by user's wallet for B2B context
  const userWallet = walletInfo?.address;
  const userId = currentUser?._id;
  
  // Use dummy data directly instead of relying on useAppState
  const { parts: userParts, transactions: userTransactions } = getDataForRole(
    role,
    userId || '',
    userWallet, // Pass wallet for filtering
    false // not admin
  );
  
  // Get enhanced reports data
  const summary = ReportsDataService.getTransactionSummary(role, 30);
  const recentTxs = ReportsDataService.getRecentTransactions(role, 5);
  const inventoryHealth = ReportsDataService.getInventoryHealth(role);
  const topParts = ReportsDataService.getTopPerformingParts(role, 3);
  
  const specifics = roleSpecifics[role] || roleSpecifics.Manufacturer;
  const RoleIcon = specifics.icon;

  // Framework requirement: Display user's current inventory and wallet-specific data
  const getStatValues = () => {
    if (!userParts) return [0,0,0,0];
    
    // Use enhanced data from reports service
    switch (role) {
      case 'Manufacturer':
        return [
          userParts.reduce((sum, part) => sum + part.quantity, 0).toLocaleString(),
          new Set(userParts.map(p => p.name)).size,
          inventoryHealth.reorderItems,
          summary.demandTransactions
        ];
      case 'Supplier':
        return [
          userParts.reduce((sum, part) => sum + part.quantity, 0).toLocaleString(),
          userParts.length,
          inventoryHealth.reorderItems,
          summary.supplyTransactions
        ];
      case 'Distributor':
        return [
          userParts.reduce((sum, part) => sum + part.quantity, 0).toLocaleString(),
          userParts.length,
          userParts.reduce((sum, part) => sum + (part.backorders || 0), 0),
          summary.demandTransactions
        ];
      default:
        return [0, 0, 0, 0];
    }
  }

  const statValues = getStatValues();

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
        <RoleIcon className={`w-8 h-8 ${specifics.color}`} />
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">{role} Dashboard</h1>
            <p className="text-muted-foreground">
            A complete overview of your operations.
            </p>
        </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {specifics.cards.map((card, index) => (
            <StatCard
            key={card.title}
            title={card.title}
            value={statValues[index]?.toLocaleString() ?? '0'}
            icon={<card.icon className="h-4 w-4 text-muted-foreground" />}
            description={card.description}
            />
        ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <RecentTransactions />
        </div>
        <div className="flex flex-col gap-6">
            <SupplyForecast />
            <StockAlerts />
        </div>
        </div>
    </div>
  );
}
