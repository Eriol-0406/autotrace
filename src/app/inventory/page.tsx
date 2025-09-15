
"use client";
import { AppLayout } from '@/components/app-layout';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { OrderPartsDialog } from '@/components/inventory/order-parts-dialog';
import type { Role } from '@/lib/types';

const roleSpecifics: Record<Role, { title: string; description: string; primaryAction: string }> = {
  Manufacturer: {
    title: 'Production Inventory',
    description: 'Manage raw materials, work-in-progress, and finished goods.',
    primaryAction: 'Order Raw Materials',
  },
  Supplier: {
    title: 'Warehouse Inventory',
    description: 'A complete overview of all parts in your warehouse.',
    primaryAction: 'Order from Manufacturer',
  },
  Distributor: {
    title: 'Distribution Stock',
    description: 'Manage fulfillable stock and customer backorders.',
    primaryAction: 'Reorder from Supplier',
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
    ? { title: 'System Inventory Audit', description: 'Monitor and audit all inventory across the network.', primaryAction: '' }
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
                </div>
                {/* Only show order button for non-admin users */}
                {!isAdmin && role && (
                  <OrderPartsDialog role={role}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {specifics.primaryAction}
                    </Button>
                  </OrderPartsDialog>
                )}
            </div>
            <InventoryTable />
        </div>
    </AppLayout>
  );
}
