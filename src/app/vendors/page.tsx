
"use client";

import { AppLayout } from '@/components/app-layout';
import { VendorsList } from '@/components/vendors/vendors-list';
import { AddVendorDialog } from '@/components/vendors/add-vendor-dialog';
import { useAppState } from '@/context/enhanced-app-state-provider';
import type { Role } from '@/lib/types';
import { Building, Factory, Handshake, Store, Truck, Shield, Plus } from 'lucide-react';
import { AdminVendorModule } from '@/components/vendors/admin-vendor-module';

const roleSpecifics: Record<Role, { title: string; description: string; context: string; icon: React.ElementType }> = {
  Manufacturer: {
    title: 'Vendors Module',
    description: "Manage vendor relationships for sourcing inventory parts. View vendors with supplied parts, create vendor orders, and rate delivery reliability.",
    context: "View Vendors: Browse vendor catalog. Vendor Orders: Order parts from vendors. Vendor Ratings: Rate vendor performance.",
    icon: Factory,
  },
  Supplier: {
    title: 'Vendors Module',
    description: "Manage vendor relationships for sourcing inventory parts. View vendors with supplied parts, create vendor orders, and rate delivery reliability.",
    context: "View Vendors: Browse vendor catalog. Vendor Orders: Order parts from vendors. Vendor Ratings: Rate vendor performance.",
    icon: Building,
  },
  Distributor: {
    title: 'Vendors Module',
    description: "Manage vendor relationships for sourcing inventory parts. View vendors with supplied parts, create vendor orders, and rate delivery reliability.",
    context: "View Vendors: Browse vendor catalog. Vendor Orders: Order parts from vendors. Vendor Ratings: Rate vendor performance.",
    icon: Truck,
  },
};

const adminSpecifics = {
    title: 'Vendors Module (Admin Oversight)',
    description: "Manage vendor relationships for sourcing inventory parts. Admins strengthen B2B vendor-client relationships.",
    context: "Manage Vendors: Add/remove via registerWallet. Vendor Performance: View metrics and fulfillment rates. Vendor Audit: Audit transactions for compliance.",
    icon: Shield,
};


export default function VendorsPage() {
  const { role, isAdmin, loggedIn } = useAppState();
  
  // For unauthenticated users, show generic vendor browsing interface
  const defaultSpecifics = {
    title: 'Browse Vendors',
    description: 'Explore our vendor network. Login to create orders and rate vendors.',
    icon: Store,
  };
  
  const specifics = isAdmin 
    ? adminSpecifics 
    : (loggedIn && role) 
      ? roleSpecifics[role] 
      : defaultSpecifics;
  const Icon = specifics.icon;

  return (
    <AppLayout allowUnauthenticated={true}>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Icon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">{specifics.title}</h1>
            <p className="text-muted-foreground">
              {specifics.description}
            </p>
            {loggedIn && 'context' in specifics && (
              <p className="text-sm text-muted-foreground mt-1">
                <strong>B2B Context:</strong> {specifics.context}
              </p>
            )}
            {!loggedIn && (
              <p className="text-sm text-muted-foreground mt-1">
                <strong>💡 Tip:</strong> <a href="/login" className="text-primary hover:underline">Login</a> to access ordering and rating features.
              </p>
            )}
          </div>
          
          {/* Add Vendor Button (only for admin users) - now handled within AdminVendorModule */}
        </div>
        {isAdmin ? <AdminVendorModule /> : <VendorsList />}
      </div>
    </AppLayout>
  );
}
