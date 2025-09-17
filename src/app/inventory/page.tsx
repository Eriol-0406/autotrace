
"use client";
import { AppLayout } from '@/components/app-layout';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, ArrowDown, ArrowUp, History } from 'lucide-react';
import { OrderPartsDialog } from '@/components/inventory/order-parts-dialog';
import { DemandTransactionDialog } from '@/components/inventory/demand-transaction-dialog';
import { SupplyTransactionDialog } from '@/components/inventory/supply-transaction-dialog';
import { TransactionHistory } from '@/components/inventory/transaction-history';
import { AdminInventoryModule } from '@/components/inventory/admin-inventory-module';
import type { Role } from '@/lib/types';

const roleSpecifics: Record<Role, { title: string; description: string; context: string }> = {
  Manufacturer: {
    title: 'Inventory Transactions Module',
    description: 'Manage inventory stock through Demand and Supply transactions - the primary mechanism for B2B inventory flow.',
    context: 'Demand: Request parts from other businesses. Supply: Add stock to inventory. Transaction History: View past transactions.',
  },
  Supplier: {
    title: 'Inventory Transactions Module',
    description: 'Manage inventory stock through Demand and Supply transactions - the primary mechanism for B2B inventory flow.',
    context: 'Demand: Request parts from other businesses. Supply: Add stock to inventory. Transaction History: View past transactions.',
  },
  Distributor: {
    title: 'Inventory Transactions Module',
    description: 'Manage inventory stock through Demand and Supply transactions - the primary mechanism for B2B inventory flow.',
    context: 'Demand: Request parts from other businesses. Supply: Add stock to inventory. Transaction History: View past transactions.',
  },
};

export default function InventoryPage() {
  const { role, isAdmin } = useAppState();

  if (!role && !isAdmin) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-full">
                <p>Loading...</p>
            </div>
        </AppLayout>
    )
  }

  const specifics = isAdmin 
    ? { 
        title: 'Inventory Transactions Module (Admin Oversight)', 
        description: 'Admin oversight of all inventory transactions system-wide. Admins ensure transaction integrity.',
        context: 'View all transactions, approve pending transactions, and analyze transaction trends across all entities.'
      }
    : (roleSpecifics[role!] || roleSpecifics.Supplier);

  return (
    <AppLayout>
       <div className="flex flex-col gap-8">
            <div className="flex justify-between items-start">
                <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">{specifics.title}</h1>
                <p className="text-muted-foreground">
                    {specifics.description}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    <strong>B2B Context:</strong> {specifics.context}
                </p>
                </div>
                {/* Framework-compliant transaction actions for non-admin users */}
                {!isAdmin && role && (
                  <div className="flex gap-2">
                    <DemandTransactionDialog role={role}>
                      <Button variant="outline">
                          <ArrowDown className="mr-2 h-4 w-4 text-red-500" />
                          Demand Transaction
                      </Button>
                    </DemandTransactionDialog>
                    <SupplyTransactionDialog role={role}>
                      <Button variant="outline">
                          <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
                          Supply Transaction
                      </Button>
                    </SupplyTransactionDialog>
                  </div>
                )}
            </div>
            
            {/* Framework-compliant modules */}
            {isAdmin ? (
              <AdminInventoryModule />
            ) : role ? (
              <Tabs defaultValue="inventory" className="w-full">
                <TabsList>
                  <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
                  <TabsTrigger value="history">Transaction History</TabsTrigger>
                </TabsList>
                <TabsContent value="inventory" className="space-y-4">
                  <InventoryTable />
                </TabsContent>
                <TabsContent value="history" className="space-y-4">
                  <TransactionHistory />
                </TabsContent>
              </Tabs>
            ) : (
              <InventoryTable />
            )}
        </div>
    </AppLayout>
  );
}
