
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { getDataForRole } from '@/lib/data';

const roleSpecifics = {
    Manufacturer: {
      title: 'Material Alerts',
      description: 'Raw materials that have fallen below their reorder point.',
    },
    Supplier: {
      title: 'Stock Alerts',
      description: 'Parts that have fallen below their reorder point.',
    },
    Distributor: {
        title: 'Customer Backorders',
        description: 'Current items with unfulfilled customer orders.',
    },
};

export function StockAlerts() {
    const { role, parts, currentUser, walletInfo } = useAppState();

    if (!role) {
        return null; // Or a loading skeleton
    }
    
    const specifics = roleSpecifics[role] || roleSpecifics.Supplier;

    // Framework requirement: Filter alerts by user.wallet
    const userWallet = walletInfo?.address;
    const userId = currentUser?.id;
    
    const { parts: userParts } = getDataForRole(
        role, 
        parts, 
        [], // transactions not needed for alerts
        [], // shipments not needed for alerts
        false, // not admin
        userId,
        userWallet // Pass wallet for filtering
    );

    const lowStockParts = userParts.filter(
        (part) => part.quantity < part.reorderPoint
    );

    const backorderedParts = userParts.filter(p => p.backorders && p.backorders > 0);

    const renderContent = () => {
        if (role === 'Distributor') {
            if (backorderedParts.length > 0) {
                return (
                    <ul className="space-y-3">
                        {backorderedParts.map((part, index) => (
                        <li key={`${part.id}-backorder-${index}`} className="flex justify-between items-center text-sm">
                            <span>{part.name}</span>
                            <span className="font-mono text-destructive">
                            {part.backorders} orders
                            </span>
                        </li>
                        ))}
                    </ul>
                )
            }
            return <p className="text-sm text-muted-foreground">No customer backorders.</p>
        }

        if (lowStockParts.length > 0) {
            return (
                <ul className="space-y-3">
                {lowStockParts.map((part, index) => (
                    <li key={`${part.id}-lowstock-${index}`} className="flex justify-between items-center text-sm">
                    <span>{part.name}</span>
                    <span className="font-mono text-destructive">
                        {part.quantity} / {part.reorderPoint}
                    </span>
                    </li>
                ))}
                </ul>
            )
        }
        
        return <p className="text-sm text-muted-foreground">No stock alerts. All items are above reorder points.</p>
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span>{specifics.title}</span>
        </CardTitle>
        <CardDescription>
          {specifics.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
