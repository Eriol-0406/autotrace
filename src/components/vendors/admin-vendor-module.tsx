"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Shield, UserPlus, BarChart3, FileSearch, Search, Star, TrendingUp, AlertTriangle, CheckCircle, Users, Wallet, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddVendorDialog } from './add-vendor-dialog';
import { EditVendorDialog } from './edit-vendor-dialog';
import { databaseService } from '@/lib/database';
import type { Vendor, Transaction } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

export function AdminVendorModule() {
  const { vendors, transactions, removeVendor } = useAppState();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<string>('all');
  const [auditVendor, setAuditVendor] = useState<string | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Framework Requirement 1: Manage Vendors - Add/remove vendors via registerWallet
  const activeVendors = vendors?.filter(v => v.relationshipType === 'vendor') || [];
  const totalVendors = activeVendors.length;
  const highPerformanceVendors = activeVendors.filter(v => (v.fulfillmentRate || 0) >= 95).length;
  const lowPerformanceVendors = activeVendors.filter(v => (v.fulfillmentRate || 0) < 80).length;

  // Framework Requirement 2: Vendor Performance - View vendor metrics
  const vendorMetrics = useMemo(() => {
    return activeVendors.map(vendor => {
      const vendorTransactions = transactions.filter(tx => 
        tx.from === vendor.name || tx.to === vendor.name ||
        tx.fromWallet === vendor.walletAddress || tx.toWallet === vendor.walletAddress
      );

      const completedTransactions = vendorTransactions.filter(tx => tx.status === 'completed');
      const totalTransactions = vendorTransactions.length;
      const actualFulfillmentRate = totalTransactions > 0 
        ? Math.round((completedTransactions.length / totalTransactions) * 100)
        : vendor.fulfillmentRate || 0;

      const totalVolume = vendorTransactions.reduce((sum, tx) => sum + tx.quantity, 0);
      const avgRating = vendor.rating || 0;

      const recentActivity = vendorTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return {
        ...vendor,
        actualFulfillmentRate,
        totalTransactions,
        completedTransactions: completedTransactions.length,
        totalVolume,
        avgRating,
        recentActivity,
        performanceStatus: actualFulfillmentRate >= 95 ? 'excellent' : 
                          actualFulfillmentRate >= 80 ? 'good' : 'needs-improvement'
      };
    });
  }, [activeVendors, transactions]);

  // Framework Requirement 3: Vendor Audit - Audit vendor transactions for compliance
  const auditData = useMemo(() => {
    if (!auditVendor) return null;

    const vendor = vendorMetrics.find(v => v.id === auditVendor);
    if (!vendor) return null;

    const vendorTransactions = transactions.filter(tx => 
      tx.from === vendor.name || tx.to === vendor.name ||
      tx.fromWallet === vendor.walletAddress || tx.toWallet === vendor.walletAddress
    );

    const complianceIssues = [];
    
    // Check for transaction anomalies
    const pendingTooLong = vendorTransactions.filter(tx => 
      tx.status === 'pending' && 
      (new Date().getTime() - new Date(tx.date).getTime()) > 7 * 24 * 60 * 60 * 1000 // 7 days
    );
    
    if (pendingTooLong.length > 0) {
      complianceIssues.push({
        type: 'Delayed Transactions',
        count: pendingTooLong.length,
        severity: 'warning',
        description: `${pendingTooLong.length} transactions pending for over 7 days`
      });
    }

    // Check for unusual volume patterns
    const monthlyVolumes = vendorTransactions.reduce((acc, tx) => {
      const month = tx.date.slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + tx.quantity;
      return acc;
    }, {} as Record<string, number>);

    const volumes = Object.values(monthlyVolumes);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    const hasVolumeSpikes = volumes.some(vol => vol > avgVolume * 2);

    if (hasVolumeSpikes) {
      complianceIssues.push({
        type: 'Volume Anomaly',
        count: 1,
        severity: 'info',
        description: 'Unusual volume spikes detected in transaction history'
      });
    }

    return {
      vendor,
      transactions: vendorTransactions,
      complianceIssues,
      summary: {
        totalTransactions: vendorTransactions.length,
        complianceScore: Math.max(0, 100 - (complianceIssues.length * 10)),
        lastAuditDate: new Date().toISOString().split('T')[0]
      }
    };
  }, [auditVendor, vendorMetrics, transactions]);

  const filteredVendors = useMemo(() => {
    return vendorMetrics.filter(vendor => {
      const matchesSearch = !searchTerm || 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && vendor.actualFulfillmentRate >= 80) ||
        (statusFilter === 'inactive' && vendor.actualFulfillmentRate < 80);
        
      const matchesPerformance = performanceFilter === 'all' || vendor.performanceStatus === performanceFilter;
      
      return matchesSearch && matchesStatus && matchesPerformance;
    });
  }, [vendorMetrics, searchTerm, statusFilter, performanceFilter]);

  const handleAuditVendor = (vendorId: string) => {
    const vendor = activeVendors.find(v => v.id === vendorId);
    if (!vendor) {
      toast({
        title: 'Vendor Not Found',
        description: 'Could not find vendor for audit.',
        variant: 'destructive',
      });
      return;
    }

    setAuditVendor(vendorId);
    toast({
      title: 'Audit Initiated',
      description: `Loading audit data for ${vendor.name}...`,
    });
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowEditDialog(true);
  };

  const handleDeleteVendor = async (vendor: Vendor) => {
    if (!confirm(`Are you sure you want to delete vendor "${vendor.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from database
      const success = await databaseService.deleteVendor((vendor as any)._id || vendor.id);
      
      if (success) {
        // Remove from local state
        removeVendor(vendor.id);
        
        toast({
          title: 'Vendor Deleted',
          description: `${vendor.name} has been successfully deleted.`,
        });
      } else {
        throw new Error('Database deletion failed');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error Deleting Vendor',
        description: 'Failed to delete vendor. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleVendorUpdated = () => {
    toast({
      title: 'Vendor Updated',
      description: 'Vendor information has been successfully updated.',
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Framework Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendors}</div>
            <p className="text-xs text-muted-foreground">Active vendor relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Performers</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highPerformanceVendors}</div>
            <p className="text-xs text-muted-foreground">≥95% fulfillment rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowPerformanceVendors}</div>
            <p className="text-xs text-muted-foreground">&lt;80% fulfillment rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVendors > 0 
                ? Math.round(vendorMetrics.reduce((sum, v) => sum + v.actualFulfillmentRate, 0) / totalVendors)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Network average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Manage Vendors</TabsTrigger>
          <TabsTrigger value="performance">Vendor Performance</TabsTrigger>
          <TabsTrigger value="audit">Vendor Audit</TabsTrigger>
        </TabsList>

        {/* Framework Requirement 1: Manage Vendors */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vendor Management</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add/remove vendors via registerWallet. Manage vendor relationships for sourcing inventory parts.
                  </p>
                </div>
                <AddVendorDialog>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Vendor
                  </Button>
                </AddVendorDialog>
              </div>
              
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors by name, category, or wallet..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/32x32.png?text=${vendor.name.charAt(0)}`} />
                              <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{vendor.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {vendor.roles && vendor.roles.length > 0 ? vendor.roles[0] : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{vendor.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Wallet className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">
                              {vendor.walletAddress.slice(0, 6)}...{vendor.walletAddress.slice(-4)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{vendor.onboardingDate}</TableCell>
                        <TableCell>
                          <Badge variant={vendor.actualFulfillmentRate >= 80 ? 'default' : 'secondary'}>
                            {vendor.actualFulfillmentRate >= 80 ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Vendor
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAuditVendor(vendor.id)}>
                                <FileSearch className="mr-2 h-4 w-4" />
                                Audit Transactions
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteVendor(vendor)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Vendor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Framework Requirement 2: Vendor Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                View vendor metrics including fulfillment rates, transaction volumes, and ratings.
              </p>
              
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Performance</SelectItem>
                    <SelectItem value="excellent">Excellent (≥95%)</SelectItem>
                    <SelectItem value="good">Good (80-94%)</SelectItem>
                    <SelectItem value="needs-improvement">Needs Improvement (&lt;80%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Fulfillment Rate</TableHead>
                      <TableHead>Total Transactions</TableHead>
                      <TableHead>Volume Handled</TableHead>
                      <TableHead>Avg Rating</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://placehold.co/32x32.png?text=${vendor.name.charAt(0)}`} />
                              <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{vendor.name}</div>
                              <div className="text-sm text-muted-foreground">{vendor.category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-bold">{vendor.actualFulfillmentRate}%</div>
                            <Badge 
                              variant={vendor.actualFulfillmentRate >= 95 ? 'default' : 
                                     vendor.actualFulfillmentRate >= 80 ? 'secondary' : 'destructive'}
                            >
                              {vendor.completedTransactions}/{vendor.totalTransactions}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{vendor.totalTransactions}</TableCell>
                        <TableCell className="font-mono">{vendor.totalVolume.toLocaleString()} units</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-medium">{vendor.avgRating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              vendor.performanceStatus === 'excellent' ? 'default' :
                              vendor.performanceStatus === 'good' ? 'secondary' : 'destructive'
                            }
                            className={
                              vendor.performanceStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                              vendor.performanceStatus === 'good' ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'
                            }
                          >
                            {vendor.performanceStatus === 'excellent' ? 'Excellent' :
                             vendor.performanceStatus === 'good' ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Framework Requirement 3: Vendor Audit */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Audit & Compliance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Audit vendor transactions for compliance. Check vendor supply history and identify anomalies.
              </p>
            </CardHeader>
            <CardContent>
              {!auditData ? (
                <div className="text-center py-12">
                  <FileSearch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select Vendor to Audit</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a vendor from the Manage or Performance tabs to view their audit trail.
                  </p>
                  <div className="grid gap-2 max-w-md mx-auto">
                    {vendorMetrics.slice(0, 5).map((vendor) => (
                      <Button 
                        key={vendor.id}
                        variant="outline" 
                        onClick={() => handleAuditVendor(vendor.id)}
                        className="justify-start"
                      >
                        <FileSearch className="mr-2 h-4 w-4" />
                        Audit {vendor.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Audit Summary */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Compliance Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {auditData.summary.complianceScore}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Transactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {auditData.summary.totalTransactions}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Issues Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                          {auditData.complianceIssues.length}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Compliance Issues */}
                  {auditData.complianceIssues.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Compliance Issues</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {auditData.complianceIssues.map((issue, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                              <div>
                                <div className="font-medium">{issue.type}</div>
                                <div className="text-sm text-muted-foreground">{issue.description}</div>
                              </div>
                              <Badge variant="outline" className="ml-auto">
                                {issue.severity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Transaction History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Transaction Audit Trail - {auditData.vendor.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Part</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Blockchain</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditData.transactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="text-sm">{transaction.date}</TableCell>
                                <TableCell>
                                  <Badge variant={transaction.type === 'supply' ? 'default' : 'secondary'}>
                                    {transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{transaction.partName}</TableCell>
                                <TableCell>{transaction.quantity.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      transaction.status === 'completed' ? 'default' :
                                      transaction.status === 'approved' ? 'secondary' :
                                      transaction.status === 'pending' ? 'outline' : 'destructive'
                                    }
                                  >
                                    {transaction.status}
                                  </Badge>
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
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setAuditVendor(null)}>
                      Close Audit
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Vendor Dialog */}
      {editingVendor && (
        <EditVendorDialog
          vendor={editingVendor}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onVendorUpdated={handleVendorUpdated}
        />
      )}
    </div>
  );
}
