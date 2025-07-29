
"use client";

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import type { Part } from '@/lib/types';
import { useAppState } from '@/context/app-state-provider';
import { Search } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const getStatus = (part: Part) => {
  if (part.quantity === 0) {
    return { text: 'Out of Stock', color: 'bg-red-500', variant: 'destructive' as const };
  }
  if (part.quantity < part.reorderPoint) {
    return { text: 'Low Stock', color: 'bg-yellow-500', variant: 'secondary' as const };
  }
  return { text: 'In Stock', color: 'bg-green-500', variant: 'default' as const };
};

const PartTable = ({ parts }: { parts: Part[] }) => {
  const { role } = useAppState();
  const [search, setSearch] = useState('');

  const filteredParts = useMemo(() =>
    parts.filter(
      (part) =>
        part.name.toLowerCase().includes(search.toLowerCase()) ||
        part.id.toLowerCase().includes(search.toLowerCase())
    ), [parts, search]);
  
  const hasBackorders = useMemo(() => parts.some(p => p.backorders && p.backorders > 0), [parts]);

  if (parts.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
            <p>No inventory items found.</p>
            <p className="text-sm">Place an order to add items to your inventory.</p>
        </div>
      );
  }

  return (
    <>
      <div className="relative mt-2">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by part name or ID..."
          className="pl-8 sm:w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
       <ScrollArea className="h-[400px]">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                {role === 'Supplier' && <TableHead>Source</TableHead>}
                {role === 'Distributor' && <TableHead>Lead Time</TableHead>}
                {role === 'Distributor' && hasBackorders && <TableHead className="text-right">Backorders</TableHead>}
                <TableHead className="w-[150px] sm:w-[200px]">Stock Level</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {filteredParts.map((part) => {
                const status = getStatus(part);
                const stockPercentage = Math.round((part.quantity / part.maxStock) * 100);

                return (
                <TableRow key={part.id}>
                    <TableCell>
                    <div className="font-medium">{part.name}</div>
                    <div className="text-sm text-muted-foreground">{part.id}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                    <Badge variant={status.variant}>{status.text}</Badge>
                    </TableCell>
                    {role === 'Supplier' && <TableCell>{part.source}</TableCell>}
                    {role === 'Distributor' && <TableCell>{part.leadTime} days</TableCell>}
                    {role === 'Distributor' && hasBackorders && <TableCell className="text-right font-mono">{part.backorders || 0}</TableCell>}
                    <TableCell>
                    <div className="flex items-center gap-2">
                        <Progress value={stockPercentage} aria-label={`${stockPercentage}% in stock`} />
                        <span className="text-xs text-muted-foreground font-mono">{stockPercentage}%</span>
                    </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{part.quantity} / {part.maxStock}</TableCell>
                </TableRow>
                );
            })}
            </TableBody>
        </Table>
       </ScrollArea>
    </>
  );
};


export function InventoryTable() {
  const { role, parts } = useAppState();

  const manufacturerParts = useMemo(() => {
      if (!parts) return { raw: [], wip: [], finished: [] };
      return {
          raw: parts.filter(p => p.type === 'raw'),
          wip: parts.filter(p => p.type === 'wip'),
          finished: parts.filter(p => p.type === 'finished'),
      }
  }, [parts]);

  if (!role) {
      return null; // or loading state
  }

  if (role === 'Manufacturer') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Inventory Breakdown</CardTitle>
                <CardDescription>Manage your materials, work-in-progress, and finished goods.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="raw">
                    <TabsList>
                        <TabsTrigger value="raw">Raw Materials ({manufacturerParts.raw.length})</TabsTrigger>
                        <TabsTrigger value="wip">Work-in-Progress ({manufacturerParts.wip.length})</TabsTrigger>
                        <TabsTrigger value="finished">Finished Goods ({manufacturerParts.finished.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="raw">
                        <PartTable parts={manufacturerParts.raw} />
                    </TabsContent>
                    <TabsContent value="wip">
                        <PartTable parts={manufacturerParts.wip} />
                    </TabsContent>
                    <TabsContent value="finished">
                        <PartTable parts={manufacturerParts.finished} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Parts</CardTitle>
        <CardDescription>A complete overview of all parts in your inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <PartTable parts={parts} />
      </CardContent>
    </Card>
  );
}
