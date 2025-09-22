
"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getDataForRole } from '@/lib/data';
import type { Transaction } from '@/lib/types';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { ArrowDown, ArrowUp, ListFilter, Search } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { BlockchainBadge } from '@/components/ui/blockchain-badge';

const roleSpecifics = {
    Manufacturer: {
      allText: 'All Movements',
      supplyText: 'Materials In',
      demandText: 'Products Out',
    },
    Supplier: {
      allText: 'All Transactions',
      supplyText: 'Inbound',
      demandText: 'Outbound',
    },
    Distributor: {
      allText: 'All Shipments',
      supplyText: 'Stock In',
      demandText: 'Fulfilled',
    },
  };

export function RecentTransactions() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'supply' | 'demand'>('all');
  const { role, currentUser, walletInfo } = useAppState();

  if (!role) {
    return null; // Or a loading skeleton
  }

  const specifics = roleSpecifics[role] || roleSpecifics.Supplier;

  // Framework requirement: Show user's latest Demand/Supply transactions filtered by wallet
  const userWallet = walletInfo?.address;
  const userId = currentUser?._id;
  
  // Use dummy data directly instead of empty useAppState transactions
  const { transactions: userTransactions } = getDataForRole(
    role,
    userId || '',
    userWallet, // Pass wallet for filtering
    false // not admin
  );

  const filteredTransactions = userTransactions.filter((tx) => {
    const searchMatch =
        tx.partName.toLowerCase().includes(search.toLowerCase()) ||
        tx.from.toLowerCase().includes(search.toLowerCase()) ||
        tx.to.toLowerCase().includes(search.toLowerCase());
    
    const filterMatch = filter === 'all' || tx.type === filter;

    return searchMatch && filterMatch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Overview of the latest stock movements.
            </CardDescription>
          </div>
          <ToggleGroup type="single" value={filter} onValueChange={(value: 'all' | 'supply' | 'demand') => value && setFilter(value)} aria-label="Filter transactions">
            <ToggleGroupItem value="all" aria-label="All transactions">
                <ListFilter className="mr-2 h-4 w-4" />
                {specifics.allText}
            </ToggleGroupItem>
            <ToggleGroupItem value="supply" aria-label="Supply transactions">
                <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
                {specifics.supplyText}
            </ToggleGroupItem>
            <ToggleGroupItem value="demand" aria-label="Demand transactions">
                <ArrowDown className="mr-2 h-4 w-4 text-red-500" />
                {specifics.demandText}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-8 sm:w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part Name</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden md:table-cell">From</TableHead>
              <TableHead className="hidden md:table-cell">To</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.slice(0, 5).map((tx, index) => (
              <TableRow key={`${tx.id}-${index}`}>
                <TableCell>
                  <div className="font-medium">{tx.partName}</div>
                  <div className="text-sm text-muted-foreground md:hidden">{new Date(tx.date).toLocaleDateString()}</div>
                  {tx.blockchainTxHash && tx.etherscanUrl && (
                    <div className="mt-1">
                      <BlockchainBadge 
                        txHash={tx.blockchainTxHash} 
                        etherscanUrl={tx.etherscanUrl}
                        orderId={tx.blockchainOrderId}
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {tx.type === 'supply' ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      <ArrowUp className="mr-1 h-3 w-3" /> Supply
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                      <ArrowDown className="mr-1 h-3 w-3" /> Demand
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">{tx.from}</TableCell>
                <TableCell className="hidden md:table-cell">{tx.to}</TableCell>
                <TableCell className="text-right font-mono">{tx.quantity}</TableCell>
                <TableCell className="hidden md:table-cell">{new Date(tx.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
             {filteredTransactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                        No transactions found.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
