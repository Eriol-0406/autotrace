"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { smartContractService } from '@/lib/smart-contract';
import { web3WalletService } from '@/lib/web3-wallet';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { BlockchainBadge } from '@/components/ui/blockchain-badge';
import { AppLayout } from '@/components/app-layout';
import type { BlockchainOrder } from '@/lib/smart-contract';
import type { Shipment, Transaction } from '@/lib/types';
import { getVendorsForRole } from '@/lib/data';

export default function BlockchainPage() {
  const [orders, setOrders] = useState<BlockchainOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const { walletConnected, walletInfo, role, isAdmin, parts, transactions, shipments, vendors, updateUserData, syncToDatabase } = useAppState();

  const loadOrders = async () => {
    if (!walletConnected && !isAdmin) return;
    
    setLoading(true);
    try {
      const count = await smartContractService.getOrderCount();
      setOrderCount(count);
      
      if (count > 0) {
        const orderPromises = [];
        for (let i = 1; i <= count; i++) {
          orderPromises.push(smartContractService.getOrder(i));
        }
        
        const allOrders = await Promise.all(orderPromises);
        
        // Filter orders by connected wallet - only show orders where user is buyer or seller
        // Exception: Admin users can see all orders
        const currentWalletAddress = walletInfo?.address?.toLowerCase();
        let filteredOrders = allOrders;
        
        if (!isAdmin) {
          filteredOrders = allOrders.filter(order => {
            if (!currentWalletAddress) return false;
            return order.buyer.toLowerCase() === currentWalletAddress || 
                   order.seller.toLowerCase() === currentWalletAddress;
          });
        }
        
        setOrders(filteredOrders);
        console.log(`📊 Loaded ${allOrders.length} total orders, ${filteredOrders.length} ${isAdmin ? '(Admin - showing all)' : `for current wallet (${currentWalletAddress})`}`);

        // After loading, sync into tracking if missing
        syncOrdersIntoTracking(filteredOrders);
      } else {
        // If no orders, set empty array
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Set demo data when contract is not available
      setOrders([]);
      setOrderCount(0);
    } finally {
      setLoading(false);
    }
  };

  const syncOrdersIntoTracking = (allOrders: BlockchainOrder[]) => {
    const txHashes = new Set((transactions as any[]).map(t => t.blockchainTxHash).filter(Boolean));
    const orderIds = new Set((shipments as any[]).map(s => s.blockchainOrderId).filter(Boolean));

    const { vendors: roleVendors } = getVendorsForRole(role || 'Distributor', vendors);

    const newTransactions: Transaction[] = [];
    const newShipments: Shipment[] = [];

    for (const o of allOrders) {
      const isDuplicate = (o.txHash && txHashes.has(o.txHash)) || orderIds.has(o.orderId);
      if (isDuplicate) continue;

      newTransactions.push({
        id: `T${String(transactions.length + newTransactions.length + 1).padStart(3, '0')}`,
        partName: o.partName,
        type: 'supply',
        quantity: o.quantity,
        date: new Date(o.timestamp * 1000).toISOString().split('T')[0],
        from: roleVendors[0]?.name || 'Vendor',
        to: role || 'Distributor',
        role: role || 'Distributor',
        status: o.completed ? 'completed' : (o.approved ? 'approved' : 'pending'),
        blockchainOrderId: o.orderId,
        blockchainTxHash: o.txHash,
        etherscanUrl: o.etherscanUrl,
      });

      const shId = `SHP-${String(shipments.length + newShipments.length + 1).padStart(3, '0')}`;
      newShipments.push({
        id: shId,
        partName: o.partName,
        quantity: o.quantity,
        from: roleVendors[0]?.name || 'Vendor',
        to: role || 'Distributor',
        status: o.completed ? 'Delivered' : 'Pending',
        estimatedDelivery: new Date().toISOString().split('T')[0],
        history: [
          { status: o.completed ? 'Delivered' : 'Pending', location: roleVendors[0]?.name || 'Vendor', date: new Date(o.timestamp * 1000).toISOString() }
        ],
        role: role || 'Distributor',
        blockchainOrderId: o.orderId,
        blockchainTxHash: o.txHash,
        etherscanUrl: o.etherscanUrl,
      } as any);
    }

    if (!newTransactions.length && !newShipments.length) return; // idempotent

    // Merge with existing, no dupes by blockchain keys
    const mergedTransactions = [...transactions];
    for (const t of newTransactions) {
      const exists = (mergedTransactions as any[]).some(x => x.blockchainOrderId === t.blockchainOrderId || (t.blockchainTxHash && x.blockchainTxHash === t.blockchainTxHash));
      if (!exists) mergedTransactions.unshift(t);
    }

    const mergedShipments = [...shipments];
    for (const s of newShipments) {
      const exists = (mergedShipments as any[]).some(x => x.blockchainOrderId === (s as any).blockchainOrderId);
      if (!exists) mergedShipments.unshift(s);
    }

    updateUserData({ transactions: mergedTransactions, shipments: mergedShipments, parts });
    syncToDatabase();
  };

  useEffect(() => {
    if (walletConnected || isAdmin) {
      loadOrders();
    }
  }, [walletConnected, isAdmin]);

  if (!walletConnected && !isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Transactions</CardTitle>
              <CardDescription>
                Connect your Web3 wallet to view blockchain orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Please connect your Web3 wallet to view blockchain transaction history.
                </p>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Demo Mode:</strong> When connected, this system will work with demo blockchain data. 
                    For full functionality, deploy the smart contract to a testnet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'Blockchain Audit' : 'Blockchain Transactions'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Audit and monitor all blockchain transactions across the network'
              : 'View your orders recorded on the blockchain'
            }
          </p>
        <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>🔗 Real Blockchain:</strong> Connected to Sepolia testnet! All transactions are real and can be viewed on Etherscan.
            {isAdmin && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                👑 Admin View - Showing all network orders
              </span>
            )}
          </p>
        </div>
        </div>
        <Button onClick={loadOrders} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? 'Total Orders (Network)' : 'Your Orders'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? orderCount : orders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'All orders on blockchain' : 'Orders you are involved in'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => order.completed).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully fulfilled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(order => !order.completed).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            All blockchain orders with transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading blockchain orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No blockchain orders found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Place an order through the inventory system to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.orderId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Order #{order.orderId}</h3>
                      <Badge variant={order.completed ? "default" : "secondary"}>
                        {order.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(order.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Part: {order.partName}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Buyer: {order.buyer.slice(0, 8)}...{order.buyer.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">Seller: {order.seller.slice(0, 8)}...{order.seller.slice(-6)}</p>
                    </div>
                  </div>
                  
                  {order.txHash && (
                    <div className="mt-3 pt-3 border-t">
                      <BlockchainBadge 
                        txHash={order.txHash} 
                        etherscanUrl={order.etherscanUrl || ''}
                        orderId={order.orderId}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
