
"use client";

import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Badge } from '@/components/ui/badge';
import { Truck, PackageCheck, CheckCircle, Package, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { receiveShipment, getVendorsForRole } from '@/lib/data';
import { smartContractService } from '@/lib/smart-contract';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function ShipmentTracker() {
  const { parts, transactions, vendors, updateVendorRating, updateUserData, role, currentUser, walletInfo, isAdmin } = useAppState();
  const [blockchainShipments, setBlockchainShipments] = useState<any[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const { toast } = useToast();

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingVendorId, setRatingVendorId] = useState<string>('');

  // Load blockchain orders and convert them to shipments
  useEffect(() => {
    const loadBlockchainShipments = async () => {
      if (!walletInfo?.address && !isAdmin) return;
      
      try {
        console.log('🔗 Loading blockchain orders for tracking...');
        const orderCount = await smartContractService.getOrderCount();
        console.log(`📊 Found ${orderCount} blockchain orders`);
        
        if (orderCount > 0) {
          const orderPromises = [];
          for (let i = 1; i <= orderCount; i++) {
            orderPromises.push(smartContractService.getOrder(i));
          }
          
          const allOrders = await Promise.all(orderPromises);
          console.log(`📦 Loaded ${allOrders.length} blockchain orders`);
          
          // Filter orders for current user (same logic as blockchain page)
          const currentWalletAddress = walletInfo?.address?.toLowerCase();
          let filteredOrders = allOrders;
          
          if (!isAdmin && currentWalletAddress) {
            filteredOrders = allOrders.filter(order => 
              order.buyer.toLowerCase() === currentWalletAddress || 
              order.seller.toLowerCase() === currentWalletAddress
            );
          }
          
          console.log(`🎯 Filtered to ${filteredOrders.length} orders for current user`);
          
          // Convert blockchain orders to shipments (same logic as blockchain page)
          const { vendors: roleVendors } = getVendorsForRole(role || 'Distributor', vendors);
          const shipments = filteredOrders.map((order, index) => ({
            id: `SHP-${String(index + 1).padStart(3, '0')}`,
            partName: order.partName,
            quantity: order.quantity,
            from: roleVendors[0]?.name || 'Vendor',
            to: role || 'Distributor',
            status: order.completed ? 'Delivered' : 'Pending',
            estimatedDelivery: new Date().toISOString().split('T')[0],
            history: [
              { 
                status: order.completed ? 'Delivered' : 'Pending', 
                location: roleVendors[0]?.name || 'Vendor', 
                date: new Date(order.timestamp * 1000).toISOString() 
              }
            ],
            role: role || 'Distributor',
            blockchainOrderId: order.orderId,
            blockchainTxHash: order.txHash,
            etherscanUrl: order.etherscanUrl,
          }));
          
          console.log(`📋 Generated ${shipments.length} shipments from blockchain orders`);
          setBlockchainShipments(shipments);
        } else {
          console.log('📭 No blockchain orders found');
          setBlockchainShipments([]);
        }
      } catch (error) {
        console.error('❌ Error loading blockchain shipments:', error);
        setBlockchainShipments([]);
      }
    };

    loadBlockchainShipments();
  }, [walletInfo, isAdmin, role, vendors]);

  // Use blockchain shipments (already filtered by user's wallet)
  const userShipments = blockchainShipments;

  React.useEffect(() => {
    if (userShipments.length > 0 && !selectedShipmentId) {
        // Sort shipments by ID and select the first one (SHP-001)
        const sortedShipments = userShipments.sort((a, b) => {
          const aNum = parseInt(a.id.replace('SHP-', ''));
          const bNum = parseInt(b.id.replace('SHP-', ''));
          return aNum - bNum;
        });
        setSelectedShipmentId(sortedShipments[0].id);
    } else if (userShipments.length === 0) {
        setSelectedShipmentId('');
    }
  }, [userShipments, selectedShipmentId]);

  const selectedShipment = useMemo(() =>
    userShipments.find(s => s.id === selectedShipmentId),
    [selectedShipmentId, userShipments]
  );
  
  const handleReceiveShipment = () => {
    if (!selectedShipment) return;

    const result = receiveShipment(selectedShipment.id, { parts, shipments, transactions });

    if (result.success) {
      // 1) Update parts/shipments per domain logic
      let newTransactions = [...transactions];

      // 2) Also log a transaction entry so Reports reflect the stock update
      const supplyTx = {
        id: `T${String(newTransactions.length + 1).padStart(3, '0')}`,
        partName: selectedShipment.partName,
        type: 'supply' as const,
        quantity: selectedShipment.quantity,
        date: new Date().toISOString().split('T')[0],
        from: selectedShipment.from,
        to: selectedShipment.to,
        role: (role || 'Distributor') as any,
        // Include blockchain refs if shipment carried them
        blockchainOrderId: (selectedShipment as any).blockchainOrderId,
        blockchainTxHash: (selectedShipment as any).blockchainTxHash,
        etherscanUrl: (selectedShipment as any).etherscanUrl,
      };
      newTransactions = [supplyTx, ...newTransactions];

      updateUserData({
        parts: result.updatedData.parts,
        shipments: result.updatedData.shipments,
        transactions: newTransactions,
      });

      toast({
        title: 'Shipment Received!',
        description: `${selectedShipment.quantity} units of ${selectedShipment.partName} have been added to your inventory.`,
      });

      // 3) Prompt for vendor rating
      const vendor = vendors.find(v => v.name === selectedShipment.from);
      if (vendor) {
        setRatingVendorId(vendor.id);
        setRatingValue(vendor.rating || 5);
        setRatingOpen(true);
      }

      // Select another shipment if available, or clear selection
      const nextShipment = userShipments.find(s => s.id !== selectedShipment.id);
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
              <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId} disabled={userShipments.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a shipment" />
                </SelectTrigger>
                <SelectContent>
                  {userShipments
                    .filter((s, index, self) => index === self.findIndex(ship => ship.id === s.id))
                    .sort((a, b) => {
                      // Extract numeric part of ID for proper sorting
                      const aNum = parseInt(a.id.replace('SHP-', ''));
                      const bNum = parseInt(b.id.replace('SHP-', ''));
                      return aNum - bNum;
                    })
                    .map((s) => (
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
            {userShipments.length === 0 && !selectedShipment && (
                <p className="text-sm text-muted-foreground pt-2">No active shipments.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="rating" className="col-span-2">Rating (1-5)</Label>
              <Input id="rating" type="number" min={1} max={5} value={ratingValue}
                onChange={(e) => setRatingValue(Math.max(1, Math.min(5, parseInt(e.target.value || '0', 10))))}
                className="col-span-2" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { if (ratingVendorId) { updateVendorRating(ratingVendorId, ratingValue); } setRatingOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
