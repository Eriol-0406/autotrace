
"use client";
import { AppLayout } from '@/components/app-layout';
import { ShipmentTracker } from "@/components/tracking/shipment-tracker";
import { useAppState } from '@/context/app-state-provider';

const roleSpecifics = {
    Manufacturer: {
      title: 'Material & Production Tracking',
      description: 'Track inbound raw materials and outbound shipments to suppliers.',
    },
    Supplier: {
        title: 'Inbound & Outbound Shipments',
        description: 'Monitor stock movements from manufacturers and deliveries to distributors.',
    },
    Distributor: {
      title: 'Customer Shipment Tracking',
      description: 'Follow shipments from your suppliers and track deliveries to your customers.',
    },
  };

export default function TrackingPage() {
    const { role } = useAppState();
    
    if (!role) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <p>Loading...</p>
                </div>
            </AppLayout>
        )
    }

    const specifics = roleSpecifics[role] || roleSpecifics.Supplier;

    return (
        <AppLayout>
            <div className="flex flex-col gap-8">
                <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">{specifics.title}</h1>
                <p className="text-muted-foreground">
                    {specifics.description}
                </p>
                </div>
                <ShipmentTracker />
            </div>
        </AppLayout>
    );
}
