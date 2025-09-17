"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Shield, CheckCircle, XCircle, Clock, FileText, Wallet, TrendingUp, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { smartContractService } from '@/lib/smart-contract';
import type { Transaction } from '@/lib/types';

const StatusBadge = ({ status }: { status: Transaction['status'] }) => {
  const variants = {
    pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
    approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
    rejected: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    completed: { variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600' },
  };

  const normalizedStatus = status || 'completed';
  const statusConfig = variants[normalizedStatus] || variants.completed;
  const { variant, icon: Icon, color } = statusConfig;

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${color}`} />
      {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
    </Badge>
  );
};

export function AdminInventoryModule() {
  const { isAdmin, unifiedDataService, updateUserData } = useAppState();
  const { toast } = useToast();
  const [processingTx, setProcessingTx] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  // Framework Requirement 1: View Transactions - List all transactions system-wide
  useEffect(() => {
    if (isAdmin && unifiedDataService) {
      const fetchSystemTransactions = async () => {
        try {
          const systemData = await unifiedDataService.getSystemData();
          setAllTransactions(systemData.transactions);
          console.log('🎯 Admin Inventory loaded system transactions:', systemData.transactions.length);
        } catch (error) {
          console.error('Error fetching system transactions:', error);
        }
      };
      fetchSystemTransactions();
    }
  }, [isAdmin, unifiedDataService]);
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const matchesSearch = !searchTerm || 
        tx.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allTransactions, searchTerm, statusFilter, typeFilter]);

  // Framework Requirement 2: Approve Transactions
  const pendingTransactions = allTransactions.filter(tx => tx.status === 'pending');
  const approvedTransactions = allTransactions.filter(tx => tx.status === 'approved');
  const rejectedTransactions = allTransactions.filter(tx => tx.status === 'rejected');
  const completedTransactions = allTransactions.filter(tx => tx.status === 'completed');

  // Framework Requirement 3: Transaction Analytics
  const analytics = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const thisMonthTransactions = allTransactions.filter(tx => 
      tx.date.startsWith(currentMonth)
    );

    // Most demanded part analysis
    const demandCounts: Record<string, number> = {};
    thisMonthTransactions
      .filter(tx => tx.type === 'demand')
      .forEach(tx => {
        demandCounts[tx.partName] = (demandCounts[tx.partName] || 0) + tx.quantity;
      });

    const mostDemandedPart = Object.entries(demandCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Supply vs Demand trends
    const supplyTotal = thisMonthTransactions
      .filter(tx => tx.type === 'supply')
      .reduce((sum, tx) => sum + tx.quantity, 0);
    
    const demandTotal = thisMonthTransactions
      .filter(tx => tx.type === 'demand')
      .reduce((sum, tx) => sum + tx.quantity, 0);

    // Entity activity analysis
    const entityActivity: Record<string, {supply: number, demand: number}> = {};
    thisMonthTransactions.forEach(tx => {
      const entity = tx.role || 'Unknown';
      if (!entityActivity[entity]) {
        entityActivity[entity] = {supply: 0, demand: 0};
      }
      entityActivity[entity][tx.type] += tx.quantity;
    });

    return {
      thisMonth: {
        total: thisMonthTransactions.length,
        supply: supplyTotal,
        demand: demandTotal,
        mostDemandedPart: mostDemandedPart ? {
          name: mostDemandedPart[0],
          quantity: mostDemandedPart[1]
        } : null
      },
      entityActivity: Object.entries(entityActivity)
        .sort(([,a], [,b]) => (b.supply + b.demand) - (a.supply + a.demand))
        .slice(0, 5)
    };
  }, [allTransactions]);

  const handleApproveTransaction = async (transaction: Transaction) => {
    setProcessingTx(transaction.id);
    try {
      const updatedTransactions = transactions.map(tx => 
        tx.id === transaction.id 
          ? { 
              ...tx, 
              status: 'approved' as const, 
              approvedBy: 'Admin',
              approvedAt: new Date().toISOString()
            }
          : tx
      );

      updateUserData({ transactions: updatedTransactions });

      if (transaction.blockchainOrderId) {
        try {
          await smartContractService.approveOrder(transaction.blockchainOrderId);
        } catch (blockchainError) {
          console.warn('Blockchain approval failed, but local approval succeeded:', blockchainError);
        }
      }

      toast({
        title: 'Transaction Approved',
        description: `${transaction.type} of ${transaction.quantity} ${transaction.partName} approved.`,
      });
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingTx(null);
    }
  };

  const handleRejectTransaction = async (transaction: Transaction) => {
    setProcessingTx(transaction.id);
    try {
      const updatedTransactions = transactions.map(tx => 
        tx.id === transaction.id 
          ? { 
              ...tx, 
              status: 'rejected' as const, 
              approvedBy: 'Admin',
              approvedAt: new Date().toISOString()
            }
          : tx
      );

      updateUserData({ transactions: updatedTransactions });

      toast({
        title: 'Transaction Rejected',
        description: `${transaction.type} of ${transaction.quantity} ${transaction.partName} rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProcessingTx(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Framework Requirement 3: Transaction Analytics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.thisMonth.total}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Demanded</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {analytics.thisMonth.mostDemandedPart?.name || 'No data'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.thisMonth.mostDemandedPart 
                ? `${analytics.thisMonth.mostDemandedPart.quantity} units this month`
                : 'No demands this month'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supply vs Demand</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Supply: {analytics.thisMonth.supply}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Demand: {analytics.thisMonth.demand}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">View Transactions</TabsTrigger>
          <TabsTrigger value="approvals">Approve Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Transaction Analytics</TabsTrigger>
        </TabsList>

        {/* Framework Requirement 1: View Transactions */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All System Transactions</CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by part, entity, or transaction ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="supply">Supply</SelectItem>
                    <SelectItem value="demand">Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockchain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 20).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.role || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'supply' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.partName}</TableCell>
                      <TableCell>{transaction.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{transaction.date}</TableCell>
                      <TableCell>
                        <StatusBadge status={transaction.status} />
                      </TableCell>
                      <TableCell>
                        {transaction.blockchainOrderId ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Wallet className="h-3 w-3" />
                            #{transaction.blockchainOrderId}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    No transactions match your current filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Framework Requirement 2: Approve Transactions */}
        <TabsContent value="approvals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending ({pendingTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{tx.partName}</div>
                          <div className="text-xs text-muted-foreground">
                            {tx.role} • {tx.quantity} units • {tx.type}
                          </div>
                        </div>
                        <StatusBadge status={tx.status} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveTransaction(tx)}
                          disabled={processingTx === tx.id}
                          className="h-7 px-2 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectTransaction(tx)}
                          disabled={processingTx === tx.id}
                          className="h-7 px-2 text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending transactions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recently Approved ({approvedTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvedTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{tx.partName}</div>
                          <div className="text-xs text-muted-foreground">
                            {tx.role} • {tx.quantity} units • {tx.type}
                          </div>
                        </div>
                        <StatusBadge status={tx.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Approved by {tx.approvedBy}
                      </div>
                    </div>
                  ))}
                  {approvedTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No approved transactions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Completed ({completedTransactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-sm">{tx.partName}</div>
                          <div className="text-xs text-muted-foreground">
                            {tx.role} • {tx.quantity} units • {tx.type}
                          </div>
                        </div>
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  ))}
                  {completedTransactions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No completed transactions
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Framework Requirement 3: Transaction Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Entity Activity This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.entityActivity.map(([entity, activity]) => (
                    <div key={entity} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{entity}</div>
                        <div className="text-xs text-muted-foreground">
                          Supply: {activity.supply} | Demand: {activity.demand}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold">
                          {(activity.supply + activity.demand).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">total units</div>
                      </div>
                    </div>
                  ))}
                  {analytics.entityActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No activity this month
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Trends Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Supply Transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">
                      {analytics.thisMonth.supply.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">units added this month</div>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-800">Demand Transactions</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {analytics.thisMonth.demand.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-600">units requested this month</div>
                  </div>

                  {analytics.thisMonth.mostDemandedPart && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Most Demanded Part</span>
                      </div>
                      <div className="text-xl font-bold text-blue-700">
                        {analytics.thisMonth.mostDemandedPart.name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {analytics.thisMonth.mostDemandedPart.quantity} units this month
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
