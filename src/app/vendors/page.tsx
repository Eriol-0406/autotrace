
"use client";

import { AppLayout } from '@/components/app-layout';
import { VendorsList } from '@/components/vendors/vendors-list';
import { useAppState } from '@/context/app-state-provider';
import type { Role } from '@/lib/types';
import { Building, Factory, Handshake, Store, Truck, Shield } from 'lucide-react';
import { AdminVendorsList } from '@/components/vendors/admin-vendors-list';

const roleSpecifics: Record<Role, { title: string; description: string; icon: React.ElementType }> = {
  Manufacturer: {
    title: 'Suppliers & Customers',
    description: "Manage your raw material suppliers and the distributors you ship to.",
    icon: Factory,
  },
  Supplier: {
    title: 'Partners',
    description: "Manage the manufacturers you source from and the distributors you supply.",
    icon: Building,
  },
  Distributor: {
    title: 'Suppliers & Customers',
    description: "Manage your network of suppliers and the customers you serve.",
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
        </div>
        {isAdmin ? <AdminVendorsList /> : <VendorsList />}
      </div>
    </AppLayout>
  );
}
