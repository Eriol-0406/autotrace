"use client";

import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Shield, CheckCircle, XCircle, Clock, FileText, Wallet } from 'lucide-react';
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

  // Handle undefined or unexpected status values
  const normalizedStatus = status || 'completed'; // Default to 'completed' for backward compatibility
  const statusConfig = variants[normalizedStatus] || variants.completed; // Fallback to completed if status is not recognized
  const { variant, icon: Icon, color } = statusConfig;

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${color}`} />
      {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
    </Badge>
  );
};

export default function AdminTransactionsPage() {
  const { transactions, updateUserData, isAdmin } = useAppState();
  const { toast } = useToast();
  const [processingTx, setProcessingTx] = useState<string | null>(null);

  // Filter to show all transactions across the system
  const allTransactions = transactions.filter(tx => tx.status !== 'completed');
  const pendingTransactions = allTransactions.filter(tx => tx.status === 'pending');
  const approvedTransactions = allTransactions.filter(tx => tx.status === 'approved');

  const handleApproveTransaction = async (transaction: Transaction) => {
    setProcessingTx(transaction.id);
    try {
      // Update transaction status
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

      // If this is a blockchain order, approve it on-chain too
      if (transaction.blockchainOrderId) {
        try {
          await smartContractService.approveOrder(transaction.blockchainOrderId);
        } catch (blockchainError) {
          console.warn('Blockchain approval failed, but local approval succeeded:', blockchainError);
        }
      }

      toast({
        title: 'Transaction Approved',
        description: `Transaction ${transaction.id} has been approved successfully.`,
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
        description: `Transaction ${transaction.id} has been rejected.`,
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

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-muted-foreground">
                You need administrator privileges to access transaction management.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Transaction Management</h1>
            <p className="text-muted-foreground">
              Review and approve transactions across the entire supply chain network.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Transactions awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Approved transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                All active transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {allTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Transactions</h3>
                <p className="text-muted-foreground">
                  All transactions have been completed or there are no pending transactions.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Part</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockchain</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTransactions.map((transaction, index) => (
                    <TableRow key={`${transaction.id}-${index}-${(transaction as any)._id || Math.random()}`}>
                      <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'supply' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.partName}</TableCell>
                      <TableCell>{transaction.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{transaction.from}</span>
                          <span className="text-muted-foreground">↓</span>
                          <span>{transaction.to}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
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
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveTransaction(transaction)}
                              disabled={processingTx === transaction.id}
                              className="h-8 px-3"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectTransaction(transaction)}
                              disabled={processingTx === transaction.id}
                              className="h-8 px-3"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {transaction.status === 'approved' && (
                          <Badge variant="outline" className="text-xs">
                            Approved
                          </Badge>
                        )}
                        {transaction.status === 'rejected' && (
                          <Badge variant="destructive" className="text-xs">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
