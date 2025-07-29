
"use client";
import { AppLayout } from '@/components/app-layout';
import { InventoryTurnoverChart } from '@/components/reports/inventory-turnover-chart';
import { StockHistoryChart } from '@/components/reports/stock-history-chart';
import { TransactionVolumeChart } from '@/components/reports/transaction-volume-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/context/app-state-provider';
import { getDataForRole } from '@/lib/data';
import { Shield } from 'lucide-react';

const roleSpecifics = {
  Manufacturer: {
    title: 'Production Analytics',
    description: 'Analyze material consumption and production output.',
    cards: {
      valueTitle: 'Total Inventory Value',
      valueDesc: 'Raw material + finished goods value',
      oosTitle: 'Materials Halting Production',
      oosDesc: 'Out of stock raw materials',
      slowTitle: 'Slow-Moving Goods',
      slowDesc: 'Finished goods >90 days in stock',
    }
  },
  Supplier: {
    title: 'Warehouse Analytics',
    description: 'Visualize inventory data and transaction history.',
    cards: {
        valueTitle: 'Warehouse Inventory Value',
        valueDesc: 'Estimated value of all parts',
        oosTitle: 'Out of Stock Items',
        oosDesc: 'Parts causing distributor backorders',
        slowTitle: 'Slow-Moving SKUs',
        slowDesc: 'Items with low turnover',
    }
  },
  Distributor: {
    title: 'Sales & Stock Analytics',
    description: 'Analyze sales trends and fulfillment efficiency.',
    cards: {
        valueTitle: 'Sellable Inventory Value',
        valueDesc: 'Value of customer-facing stock',
        oosTitle: 'Lost Sales Items',
        oosDesc: 'Out of stock items with recent demand',
        slowTitle: 'Aging Items',
        slowDesc: 'Items with >60 days shelf time',
    }
  }
};

const ClientReports = () => {
  const { role, parts, transactions } = useAppState();

  if (!role) {
    return <p>Loading reports...</p>;
  }

  const specifics = roleSpecifics[role] || roleSpecifics.Supplier;

  const totalValue = parts.reduce((sum, part) => sum + part.quantity * 50, 0); // Assuming avg price of $50
  const outOfStock = parts.filter(p => p.quantity === 0).length;
  const slowMoving = parts.filter(p => transactions.filter(t => t.partName === p.name).length < 2).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">{specifics.title}</h1>
        <p className="text-muted-foreground">
          {specifics.description}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardHeader>
                  <CardTitle>{specifics.cards.valueTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{specifics.cards.valueDesc}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>{specifics.cards.oosTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">{outOfStock}</p>
                  <p className="text-xs text-muted-foreground">{specifics.cards.oosDesc}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>{specifics.cards.slowTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">{slowMoving}</p>
                  <p className="text-xs text-muted-foreground">{specifics.cards.slowDesc}</p>
              </CardContent>
          </Card>
      </div>
      <StockHistoryChart />
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionVolumeChart transactions={transactions} />
        <InventoryTurnoverChart parts={parts} transactions={transactions} />
      </div>
    </div>
  );
};

const AdminReports = () => {
    const { role, parts, transactions, shipments } = useAppState();
    const { parts: roleParts, transactions: roleTransactions } = getDataForRole(role, parts, transactions, shipments);

    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">System-Wide Analytics</h1>
              <p className="text-muted-foreground">
                Generate reports on the network's performance. Use the role switcher in the header to filter by entity.
              </p>
            </div>
        </div>
        <StockHistoryChart />
        <div className="grid gap-6 lg:grid-cols-2">
          <TransactionVolumeChart transactions={roleTransactions} />
          <InventoryTurnoverChart parts={roleParts} transactions={roleTransactions} />
        </div>
      </div>
    );
  };


export default function ReportsPage() {
  const { isAdmin } = useAppState();

  return (
    <AppLayout>
        <div className="flex flex-col gap-8">
            {isAdmin ? <AdminReports /> : <ClientReports />}
        </div>
    </AppLayout>
  );
}
