
"use client";

import * as React from 'react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/context/app-state-provider';
import { Badge } from '@/components/ui/badge';
import { Truck, PackageCheck, CheckCircle, Package, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { receiveShipment } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

export function ShipmentTracker() {
  const { shipments, parts, transactions, updateUserData } = useAppState();
  const [selectedShipmentId, setSelectedShipmentId] = useState(shipments.length > 0 ? shipments[0].id : '');
  const { toast } = useToast();

  React.useEffect(() => {
    if (shipments.length > 0 && !shipments.find(s => s.id === selectedShipmentId)) {
        setSelectedShipmentId(shipments[0].id);
    } else if (shipments.length === 0) {
        setSelectedShipmentId('');
    }
  }, [shipments, selectedShipmentId]);

  const selectedShipment = useMemo(() =>
    shipments.find(s => s.id === selectedShipmentId),
    [selectedShipmentId, shipments]
  );
  
  const handleReceiveShipment = () => {
    if (!selectedShipment) return;

    const result = receiveShipment(selectedShipment.id, { parts, shipments, transactions });

    if (result.success) {
      updateUserData(result.updatedData);
      toast({
        title: 'Shipment Received!',
        description: `${selectedShipment.quantity} units of ${selectedShipment.partName} have been added to your inventory.`,
      });
      // Select another shipment if available, or clear selection
      const nextShipment = shipments.find(s => s.id !== selectedShipment.id);
      setSelectedShipmentId(nextShipment ? nextShipment.id : '');
    } else {
        toast({
            title: 'Error',
            description: 'Could not receive shipment.',
            variant: 'destructive'
        });
    }
  };


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'In Transit': return 'default';
      case 'Delivered': return 'secondary';
      case 'Delayed': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Order Placed': return <Package className="h-5 w-5" />;
      case 'In Transit': return <Truck className="h-5 w-5" />;
      case 'Out for Delivery': return <PackageCheck className="h-5 w-5" />;
      case 'Delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Package className="h-5 w-5" />;
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>Tracking Details</CardTitle>
            </CardHeader>
            <CardContent>
                {selectedShipment ? (
                    <div className="relative pl-6">
                        <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-border -translate-x-1/2"></div>
                        <ul className="space-y-8">
                            {selectedShipment.history.map((event, index) => (
                                <li key={index} className="flex items-start gap-4">
                                    <div className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 z-10",
                                        index === selectedShipment.history.length - 1 ? 'border-primary' : 'border-border'
                                    )}>
                                        {getStatusIcon(event.status)}
                                    </div>
                                    <div className="pt-0.5">
                                        <p className="font-semibold">{event.status}</p>
                                        <p className="text-sm text-muted-foreground">{event.location}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString()}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        <p>No shipments to display. Place an order to start tracking.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Shipment</label>
              <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId} disabled={shipments.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a shipment" />
                </SelectTrigger>
                <SelectContent>
                  {shipments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.id}: {s.partName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedShipment && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">{selectedShipment.partName}</span>
                  <Badge variant={getStatusVariant(selectedShipment.status)}>{selectedShipment.status}</Badge>
                </div>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p><strong>Tracking ID:</strong> {selectedShipment.id}</p>
                  <p><strong>From:</strong> {selectedShipment.from}</p>
                  <p><strong>To:</strong> {selectedShipment.to}</p>
                  <p><strong>Quantity:</strong> <span className="font-mono">{selectedShipment.quantity}</span></p>
                  <p><strong>Est. Delivery:</strong> {new Date(selectedShipment.estimatedDelivery).toLocaleDateString()}</p>
                </div>
                {selectedShipment.status !== 'Delivered' && (
                    <Button onClick={handleReceiveShipment} className="w-full">
                        <Warehouse className="mr-2 h-4 w-4" />
                        Receive Shipment
                    </Button>
                )}
              </div>
            )}
            {shipments.length === 0 && !selectedShipment && (
                <p className="text-sm text-muted-foreground pt-2">No active shipments.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
