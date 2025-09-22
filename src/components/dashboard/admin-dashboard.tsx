
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppState } from "@/context/enhanced-app-state-provider";
import { getDataForRole } from "@/lib/data";
import { ReportsDataService } from "@/lib/reports-data";
import type { Role, Transaction, Part } from "@/lib/types";
import { Boxes, ArrowDownUp, Factory, Building, Truck, Shield, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "../ui/badge";

const AdminStatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
);

const EntityOverview = ({ parts, vendors }: { parts: Part[], vendors: any[] }) => {
    // Get specific entity examples from vendors data
    const entityExamples = vendors.slice(0, 6).map(vendor => {
        const entityParts = parts.filter(part => 
            // Match parts to entities based on role or random assignment for demo
            part.id.includes(vendor.id.slice(-1)) || Math.random() > 0.7
        ).slice(0, 2); // Limit to 2 parts per entity for display
        
        const totalQuantity = entityParts.reduce((sum, part) => sum + part.quantity, 0);
        
        return {
            name: vendor.name,
            role: vendor.roles?.[0] || 'Supplier',
            parts: entityParts,
            totalQuantity
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Entity Overview</CardTitle>
                <CardDescription>Specific entity inventory examples (e.g., "Supplier A: 200 Tires").</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {entityExamples.map((entity, index) => (
                        <div key={index} className="p-3 rounded-md border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{entity.role}</Badge>
                                    <span className="font-semibold text-sm">{entity.name}</span>
                                </div>
                                <span className="font-mono text-sm font-semibold">{entity.totalQuantity} units</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {entity.parts.length > 0 ? (
                                    entity.parts.map(part => `${part.quantity} ${part.name}`).join(', ')
                                ) : (
                                    'No specific parts assigned'
                                )}
                            </div>
                        </div>
                    ))}
                    {entityExamples.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No entities found. Add vendors to see entity-specific inventory.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const GlobalActivityLog = ({ transactions, vendors }: { transactions: Transaction[], vendors: any[] }) => {
    // Create a mix of transaction activities and admin activities
    const allActivities = [
        // Recent transactions
        ...transactions.slice(0, 5).map(tx => ({
            id: tx.id,
            type: 'transaction',
            entity: tx.role || 'Unknown',
            action: tx.type === 'supply' ? 'added' : 'demanded',
            item: tx.partName,
            quantity: tx.quantity,
            timestamp: tx.date,
            status: tx.status
        })),
        // Mock admin activities (in real app, these would come from admin action logs)
        ...vendors.slice(0, 2).map((vendor, index) => ({
            id: `admin-${index}`,
            type: 'admin_action',
            entity: 'Admin',
            action: 'approved vendor',
            item: vendor.name,
            quantity: null,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(), // Random within last week
            status: 'completed'
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system-wide actions including admin approvals and entity transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entity</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allActivities.map((activity, index) => (
                             <TableRow key={`${activity.type}-${activity.id}-${index}`}>
                                <TableCell>
                                    <Badge variant={activity.type === 'admin_action' ? 'default' : 'outline'}>
                                        {activity.entity}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {activity.type === 'transaction' && activity.action === 'added' ? (
                                            <>
                                                <ArrowUp className="h-3 w-3 text-green-600" />
                                                <span className="text-green-600">Added</span>
                                            </>
                                        ) : activity.type === 'transaction' && activity.action === 'demanded' ? (
                                            <>
                                                <ArrowDown className="h-3 w-3 text-red-600" />
                                                <span className="text-red-600">Demanded</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-3 w-3 text-blue-600" />
                                                <span className="text-blue-600">Approved</span>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {activity.type === 'transaction' ? (
                                        <span>{activity.quantity} {activity.item}</span>
                                    ) : (
                                        <span>{activity.item}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={activity.status === 'pending' ? 'secondary' : 'default'} className="text-xs">
                                        {activity.status}
                                    </Badge>
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export function AdminDashboard() {
  const { isAdmin, unifiedDataService } = useAppState();
  const [systemData, setSystemData] = useState<{
    parts: Part[];
    transactions: Transaction[];
    vendors: any[];
    shipments: any[];
  }>({ parts: [], transactions: [], vendors: [], shipments: [] });

  // Load dummy data directly for admin dashboard
  useEffect(() => {
    if (isAdmin) {
      // Use dummy data directly instead of relying on database
      const dummyData = getDataForRole('Admin', '', undefined, true);
      setSystemData({
        parts: dummyData.parts,
        transactions: dummyData.transactions,
        vendors: dummyData.vendors,
        shipments: dummyData.shipments
      });
      console.log('🎯 Admin Dashboard loaded dummy data:', {
        parts: dummyData.parts.length,
        transactions: dummyData.transactions.length,
        vendors: dummyData.vendors.length,
        shipments: dummyData.shipments.length
      });
    }
  }, [isAdmin]);

  const { parts, transactions, vendors, shipments } = systemData;
  
  // Get enhanced reports data for admin view
  const systemSummary = ReportsDataService.getTransactionSummary();
  const systemPerformance = ReportsDataService.getPerformanceMetrics();
  const inventoryHealth = ReportsDataService.getInventoryHealth();
  const topPerformingParts = ReportsDataService.getTopPerformingParts();
  const vendorPerformance = ReportsDataService.getVendorPerformance();
  
  const totalInventory = parts.reduce((sum, part) => sum + part.quantity, 0);
  const totalParts = parts.length;
  const totalTransactions = transactions.length;
  const totalEntities = vendors.length;
  const pendingApprovals = transactions.filter(tx => tx.status === 'pending').length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard Module</h1>
          <p className="text-muted-foreground">
            Overview of inventory status and key activities across all entities. Admins oversee all businesses' inventory for system health.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
          <AdminStatCard 
              title="Total Parts"
              value={`${totalParts.toLocaleString()} SKUs`}
              icon={<Boxes className="h-4 w-4 text-muted-foreground" />}
              description={`${totalInventory.toLocaleString()} total units across all entities`}
          />
          <AdminStatCard 
              title="Total Transactions"
              value={totalTransactions.toLocaleString()}
              icon={<ArrowDownUp className="h-4 w-4 text-muted-foreground" />}
              description="Supply and demand transactions system-wide"
          />
          <AdminStatCard 
              title="Active Entities"
              value={totalEntities.toLocaleString()}
              icon={<Building className="h-4 w-4 text-muted-foreground" />}
              description="Registered businesses in the network"
          />
          <AdminStatCard 
              title="Pending Approvals"
              value={pendingApprovals.toLocaleString()}
              icon={<Shield className="h-4 w-4 text-muted-foreground" />}
              description="Transactions awaiting admin approval"
          />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GlobalActivityLog transactions={transactions} vendors={vendors} />
        </div>
        <div className="lg:col-span-1">
          <EntityOverview parts={parts} vendors={vendors} />
        </div>
      </div>
    </div>
  );
}
