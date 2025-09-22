"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Search, FileSearch, AlertTriangle, Download, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { Transaction, Shipment } from '@/lib/types';

export function AdminTrackingModule() {
  const { isAdmin, unifiedDataService, vendors } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'part' | 'entity' | 'wallet' | 'invoice' | 'transactionId'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);

  // Fetch system-wide data for admin tracking
  useEffect(() => {
    if (isAdmin && unifiedDataService) {
      const fetchSystemData = async () => {
        try {
          const systemData = await unifiedDataService.getSystemData();
          setTransactions(systemData.transactions);
          setShipments(systemData.shipments);
          console.log('🎯 Admin Tracking loaded system data:', {
            transactions: systemData.transactions.length,
            shipments: systemData.shipments.length
          });
        } catch (error) {
          console.error('Error fetching system tracking data:', error);
        }
      };
      fetchSystemData();
    }
  }, [isAdmin, unifiedDataService]);

  // Transaction Search Logic
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Filter by search term and type
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => {
        switch (searchType) {
          case 'part':
            return transaction.partName.toLowerCase().includes(term);
          case 'entity':
            return transaction.from.toLowerCase().includes(term) || 
                   transaction.to.toLowerCase().includes(term);
          case 'wallet':
            return transaction.fromWallet?.toLowerCase().includes(term) || 
                   transaction.toWallet?.toLowerCase().includes(term);
          case 'invoice':
            return transaction.invoiceNumber?.toLowerCase().includes(term);
          case 'transactionId':
            return transaction.id.toLowerCase().includes(term);
          case 'all':
          default:
            return transaction.partName.toLowerCase().includes(term) ||
                   transaction.from.toLowerCase().includes(term) ||
                   transaction.to.toLowerCase().includes(term) ||
                   transaction.fromWallet?.toLowerCase().includes(term) ||
                   transaction.toWallet?.toLowerCase().includes(term) ||
                   transaction.invoiceNumber?.toLowerCase().includes(term) ||
                   transaction.id.toLowerCase().includes(term);
        }
      });
    }

    const toTime = (d: string) => {
      const t = new Date(d).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    return filtered.sort((a, b) => toTime(b.date) - toTime(a.date));
  }, [transactions, searchTerm, searchType, selectedStatus]);

  // Audit Log (Chronological view of all transactions)
  const auditLog = useMemo(() => {
    return transactions
      .map(t => ({
        ...t,
        timestamp: (() => { const n = new Date(t.date).getTime(); return Number.isFinite(n) ? n : 0; })(),
        type: 'transaction' as const,
      }))
      .concat(
        shipments.map(s => ({
          id: s.id,
          partName: s.partName,
          from: s.from,
          to: s.to,
          quantity: s.quantity,
          date: s.estimatedDelivery,
          status: s.status,
          timestamp: new Date(s.estimatedDelivery).getTime(),
          type: 'shipment' as const,
          role: s.role,
        }))
      )
      .sort((a, b) => {
        // Sort by ID for consistent ordering
        if (a.type === 'transaction' && b.type === 'transaction') {
          const aNum = parseInt(a.id.replace('T-', ''));
          const bNum = parseInt(b.id.replace('T-', ''));
          return bNum - aNum; // Show newest transactions first
        }
        if (a.type === 'shipment' && b.type === 'shipment') {
          const aNum = parseInt(a.id.replace('SHP-', ''));
          const bNum = parseInt(b.id.replace('SHP-', ''));
          return bNum - aNum; // Show newest shipments first
        }
        return b.timestamp - a.timestamp;
      });
  }, [transactions, shipments]);

  // Discrepancy Report Logic
  const discrepancies = useMemo(() => {
    const issues: Array<{
      id: string;
      type: 'unmatched_demand' | 'duplicate_transaction' | 'missing_shipment' | 'status_mismatch';
      description: string;
      severity: 'low' | 'medium' | 'high';
      affectedTransactions: string[];
    }> = [];

    // Check for unmatched demand/supply
    const partQuantities: Record<string, { supply: number; demand: number; transactions: string[] }> = {};
    
    transactions.forEach(t => {
      if (!partQuantities[t.partName]) {
        partQuantities[t.partName] = { supply: 0, demand: 0, transactions: [] };
      }
      
      if (t.type === 'supply') {
        partQuantities[t.partName].supply += t.quantity;
      } else {
        partQuantities[t.partName].demand += t.quantity;
      }
      partQuantities[t.partName].transactions.push(t.id);
    });

    // Identify significant imbalances
    Object.entries(partQuantities).forEach(([partName, data]) => {
      const imbalance = Math.abs(data.supply - data.demand);
      const total = data.supply + data.demand;
      const imbalancePercentage = total > 0 ? (imbalance / total) * 100 : 0;

      if (imbalancePercentage > 30 && imbalance > 10) {
        issues.push({
          id: `imbalance-${partName}`,
          type: 'unmatched_demand',
          description: `Significant supply/demand imbalance for ${partName}: ${data.supply} supply vs ${data.demand} demand`,
          severity: imbalancePercentage > 60 ? 'high' : 'medium',
          affectedTransactions: data.transactions,
        });
      }
    });

    // Check for transactions without corresponding shipments
    const transactionIds = new Set(transactions.map(t => t.id));
    const shipmentTransactionIds = new Set(shipments.map(s => s.transactionId).filter(Boolean));
    
    transactions.forEach(t => {
      if (t.status === 'completed' && !shipmentTransactionIds.has(t.id)) {
        issues.push({
          id: `missing-shipment-${t.id}`,
          type: 'missing_shipment',
          description: `Completed transaction ${t.id} (${t.partName}) has no corresponding shipment record`,
          severity: 'medium',
          affectedTransactions: [t.id],
        });
      }
    });

    // Check for duplicate transactions
    const transactionHashes = new Map<string, string[]>();
    transactions.forEach(t => {
      const hash = `${t.partName}-${t.quantity}-${t.from}-${t.to}-${t.date}`;
      if (!transactionHashes.has(hash)) {
        transactionHashes.set(hash, []);
      }
      transactionHashes.get(hash)!.push(t.id);
    });

    transactionHashes.forEach((ids, hash) => {
      if (ids.length > 1) {
        issues.push({
          id: `duplicate-${hash}`,
          type: 'duplicate_transaction',
          description: `Potential duplicate transactions detected: ${ids.join(', ')}`,
          severity: 'low',
          affectedTransactions: ids,
        });
      }
    });

    return issues.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [transactions, shipments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'completed': return <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Transaction Search
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="discrepancies" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Discrepancy Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Search</CardTitle>
              <CardDescription>
                Search all transactions by part, entity, wallet, or invoice number.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Search by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="part">Part Name</SelectItem>
                    <SelectItem value="entity">Entity</SelectItem>
                    <SelectItem value="wallet">Wallet Address</SelectItem>
                    <SelectItem value="invoice">Invoice Number</SelectItem>
                    <SelectItem value="transactionId">Transaction ID</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Part</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>From Wallet</TableHead>
                      <TableHead>To Wallet</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground">
                          No transactions found matching your search criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions
                        .filter((transaction, index, self) => index === self.findIndex(t => t.id === transaction.id))
                        .map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.id}</TableCell>
                          <TableCell>{transaction.partName}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'supply' ? 'default' : 'secondary'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.from}</TableCell>
                          <TableCell>{transaction.to}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.fromWallet ? (
                              <span title={transaction.fromWallet}>
                                {transaction.fromWallet.slice(0, 6)}...{transaction.fromWallet.slice(-4)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.toWallet ? (
                              <span title={transaction.toWallet}>
                                {transaction.toWallet.slice(0, 6)}...{transaction.toWallet.slice(-4)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.invoiceNumber || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>{transaction.quantity}</TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell>{(() => { const d = new Date(transaction.date); return Number.isFinite(d.getTime()) ? format(d, 'MMM dd, yyyy') : '—'; })()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Log</CardTitle>
              <CardDescription>
                Chronological log of all transactions and shipments across the network.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Part</TableHead>
                      <TableHead>From → To</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog
                      .slice(0, 50)
                      .filter((entry, index, self) => index === self.findIndex(e => e.id === entry.id && e.type === entry.type))
                      .map((entry) => (
                      <TableRow key={`${entry.type}-${entry.id}-${entry.timestamp}`}>
                        <TableCell className="font-mono text-sm">
                          {(() => { const d = new Date(entry.timestamp); return Number.isFinite(d.getTime()) ? format(d, 'MMM dd, yyyy HH:mm') : '—'; })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.type === 'transaction' ? 'default' : 'outline'}>
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{entry.id}</TableCell>
                        <TableCell>{entry.partName}</TableCell>
                        <TableCell>{entry.from} → {entry.to}</TableCell>
                        <TableCell>{entry.quantity}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Showing latest 50 entries of {auditLog.length} total records
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discrepancies">
          <Card>
            <CardHeader>
              <CardTitle>Discrepancy Report</CardTitle>
              <CardDescription>
                Identify and resolve transaction anomalies and system integrity issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discrepancies.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">✅</div>
                  <h3 className="text-lg font-medium text-green-800 mb-1">No Discrepancies Found</h3>
                  <p className="text-green-600">All transactions appear to be in good order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {discrepancies.map((issue) => (
                    <div 
                      key={issue.id} 
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">
                            {issue.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {getSeverityBadge(issue.severity)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Affected Transactions:</span>
                        {issue.affectedTransactions.slice(0, 3).map(id => (
                          <Badge key={id} variant="outline" className="text-xs">
                            {id}
                          </Badge>
                        ))}
                        {issue.affectedTransactions.length > 3 && (
                          <span>+{issue.affectedTransactions.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {discrepancies.length} discrepancies found
                  {discrepancies.length > 0 && (
                    <span className="ml-2">
                      ({discrepancies.filter(d => d.severity === 'high').length} high, {' '}
                      {discrepancies.filter(d => d.severity === 'medium').length} medium, {' '}
                      {discrepancies.filter(d => d.severity === 'low').length} low)
                    </span>
                  )}
                </span>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
