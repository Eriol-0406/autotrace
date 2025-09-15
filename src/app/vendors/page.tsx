
"use client";

import { AppLayout } from '@/components/app-layout';
import { VendorsList } from '@/components/vendors/vendors-list';
import { AddVendorDialog } from '@/components/vendors/add-vendor-dialog';
import { useAppState } from '@/context/enhanced-app-state-provider';
import type { Role } from '@/lib/types';
import { Building, Factory, Handshake, Store, Truck, Shield, Plus } from 'lucide-react';
import { AdminVendorsList } from '@/components/vendors/admin-vendors-list';

const roleSpecifics: Record<Role, { title: string; description: string; icon: React.ElementType }> = {
  Manufacturer: {
    title: 'Suppliers & Customers',
    description: "View approved vendors and their supplied parts. Create orders to vendors for inventory needs.",
    icon: Factory,
  },
  Supplier: {
    title: 'Partners',
    description: "View approved business partners. Rate vendors based on delivery reliability and service quality.",
    icon: Building,
  },
  Distributor: {
    title: 'Suppliers & Customers',
    description: "View approved vendors in your network. Create orders and rate vendor performance.",
    icon: Truck,
  },
};

const adminSpecifics = {
    title: 'Vendor Management',
    description: "Oversee and manage all vendors in the network.",
    icon: Shield,
};


export default function VendorsPage() {
  const { role, isAdmin } = useAppState();
  
  const specifics = isAdmin ? adminSpecifics : roleSpecifics[role!] || roleSpecifics.Supplier;
  const Icon = specifics.icon;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Icon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">{specifics.title}</h1>
            <p className="text-muted-foreground">
              {specifics.description}
            </p>
          </div>
          
          {/* Add Vendor Button (only for admin users) */}
          {isAdmin && (
            <AddVendorDialog />
          )}
        </div>
        {isAdmin ? <AdminVendorsList /> : <VendorsList />}
      </div>
    </AppLayout>
  );
}
