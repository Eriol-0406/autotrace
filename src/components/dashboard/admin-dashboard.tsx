
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppState } from "@/context/enhanced-app-state-provider";
import { getDataForRole } from "@/lib/data";
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

const EntityOverview = ({ parts }: { parts: Part[] }) => {
    const roles: Role[] = ['Manufacturer', 'Supplier', 'Distributor'];
    const icons: Record<Role, React.ElementType> = {
        Manufacturer: Factory,
        Supplier: Building,
        Distributor: Truck
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Entity Overview</CardTitle>
                <CardDescription>Summary of inventory held by each entity type.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {roles.map(role => {
                        const { parts: roleParts } = getDataForRole(role, parts, [], [], false); // Don't use admin mode for entity breakdown
                        const totalParts = roleParts.reduce((sum, part) => sum + part.quantity, 0);
                        const uniqueSkus = new Set(roleParts.map(p => p.name)).size;
                        const Icon = icons[role];

                        return (
                            <div key={role} className="flex items-center justify-between p-3 rounded-md border">
                                <div className="flex items-center gap-3">
                                    <Icon className="w-6 h-6 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{role}</p>
                                        <p className="text-xs text-muted-foreground">{uniqueSkus} SKUs</p>
                                    </div>
                                </div>
                                <p className="font-mono text-lg font-semibold">{totalParts.toLocaleString()} <span className="text-sm text-muted-foreground font-sans">units</span></p>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

const GlobalActivityLog = ({ transactions }: { transactions: Transaction[] }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Global Activity Log</CardTitle>
                <CardDescription>Recent system-wide transactions across all entities.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entity</TableHead>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.slice(0, 7).map(tx => (
                             <TableRow key={tx.id}>
                                <TableCell>
                                    <Badge variant="outline">{tx.role}</Badge>
                                </TableCell>
                                <TableCell>{tx.partName}</TableCell>
                                <TableCell>
                                    {tx.type === 'supply' ? (
                                        <div className="flex items-center gap-1 text-green-600">
                                            <ArrowUp className="h-3 w-3" /> Supply
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-red-600">
                                            <ArrowDown className="h-3 w-3" /> Demand
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export function AdminDashboard() {
  const { parts, transactions } = useAppState();

  const totalInventory = parts.reduce((sum, part) => sum + part.quantity, 0);
  const totalTransactions = transactions.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            A complete overview of the entire supply chain network.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
          <AdminStatCard 
              title="Total Network Inventory"
              value={totalInventory.toLocaleString()}
              icon={<Boxes className="h-4 w-4 text-muted-foreground" />}
              description="Total quantity of all parts across all entities."
          />
          <AdminStatCard 
              title="Total System Transactions"
              value={totalTransactions.toLocaleString()}
              icon={<ArrowDownUp className="h-4 w-4 text-muted-foreground" />}
              description="Total number of supply and demand transactions."
          />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GlobalActivityLog transactions={transactions} />
        </div>
        <div className="lg:col-span-1">
          <EntityOverview parts={parts} />
        </div>
      </div>
    </div>
  );
}
