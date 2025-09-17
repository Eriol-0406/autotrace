"use client";

import { useState, useMemo } from 'react';
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
import { ArrowDown, ArrowUp, Search, ExternalLink } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '../ui/scroll-area';
import { BlockchainBadge } from '@/components/ui/blockchain-badge';

export function TransactionHistory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'supply' | 'demand'>('all');
  const { role, transactions, currentUser, walletInfo, isAdmin } = useAppState();

  // Framework requirement: View past Demand/Supply transactions tied to the user's wallet
  const userWallet = walletInfo?.address;
  const userId = currentUser?._id || currentUser?.email;
  
  const { transactions: userTransactions } = getDataForRole(
    role, 
    [], // parts not needed for transaction history
    transactions, 
    [], // shipments not needed for transaction history
    isAdmin,
    userId,
    userWallet // Pass wallet for filtering
  );

  const filteredTransactions = useMemo(() => {
    return userTransactions.filter((tx) => {
      const searchMatch =
          tx.partName.toLowerCase().includes(search.toLowerCase()) ||
          tx.from.toLowerCase().includes(search.toLowerCase()) ||
          tx.to.toLowerCase().includes(search.toLowerCase()) ||
          (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(search.toLowerCase()));
      
      const filterMatch = filter === 'all' || tx.type === filter;

      return searchMatch && filterMatch;
    });
  }, [userTransactions, search, filter]);

  if (!role) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Past Demand/Supply transactions tied to your wallet with details (part, quantity, invoice, timestamp).
            </CardDescription>
          </div>
          <ToggleGroup type="single" value={filter} onValueChange={(value: 'all' | 'supply' | 'demand') => value && setFilter(value)} aria-label="Filter transactions">
            <ToggleGroupItem value="all" aria-label="All transactions">
                All
            </ToggleGroupItem>
            <ToggleGroupItem value="demand" aria-label="Demand transactions">
                <ArrowDown className="mr-2 h-4 w-4 text-red-500" />
                Demand
            </ToggleGroupItem>
            <ToggleGroupItem value="supply" aria-label="Supply transactions">
                <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
                Supply
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by part, entity, invoice..."
            className="pl-8 sm:w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {userWallet && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>🔗 Wallet Filter:</strong> Showing transactions for wallet: {userWallet.slice(0, 8)}...{userWallet.slice(-6)}
            </p>
          </div>
        )}
        
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">From</TableHead>
                <TableHead className="hidden md:table-cell">To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="hidden sm:table-cell">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    <div className="text-muted-foreground">
                      <p>No transaction history found.</p>
                      <p className="text-sm">Create demand or supply transactions to see them here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx, index) => (
                  <TableRow key={`${tx.id}-${index}`}>
                    <TableCell>
                      <div className="font-medium">{tx.partName}</div>
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
                    <TableCell>
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
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        {tx.from}
                        {tx.fromWallet && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {tx.fromWallet.slice(0, 6)}...{tx.fromWallet.slice(-4)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        {tx.to}
                        {tx.toWallet && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {tx.toWallet.slice(0, 6)}...{tx.toWallet.slice(-4)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{tx.quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {tx.invoiceNumber && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {tx.invoiceNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tx.status === 'completed' ? 'default' : 
                          tx.status === 'approved' ? 'secondary' : 
                          tx.status === 'pending' ? 'outline' : 
                          'destructive'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(tx.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleTimeString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {filteredTransactions.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} 
            {filter !== 'all' && ` (${filter} only)`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
