
"use client";
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { InventoryTurnoverChart } from '@/components/reports/inventory-turnover-chart';
import { StockHistoryChart } from '@/components/reports/stock-history-chart';
import { TransactionVolumeChart } from '@/components/reports/transaction-volume-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { getDataForRole, getVendorsForRole } from '@/lib/data';
import { computeReplenishmentPlan } from '@/lib/forecast';
import { smartContractService } from '@/lib/smart-contract';
import { Shield, Download, FileText, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roleSpecifics = {
  Manufacturer: {
    title: 'Reports Module',
    description: 'Generate analytical reports on inventory data for decision-making. Export Stock, Transaction, and Forecast reports as CSV.',
    cards: {
      valueTitle: 'Total Inventory Value',
      valueDesc: 'Raw material + finished goods value',
      oosTitle: 'Materials Halting Production',
      oosDesc: 'Out of stock raw materials',
      slowTitle: 'Slow-Moving Goods',
      slowDesc: 'Finished goods >90 days in stock',
    }
  },
  Supplier: {
    title: 'Reports Module',
    description: 'Generate analytical reports on inventory data for decision-making. Export Stock, Transaction, and Forecast reports as CSV.',
    cards: {
        valueTitle: 'Warehouse Inventory Value',
        valueDesc: 'Estimated value of all parts',
        oosTitle: 'Out of Stock Items',
        oosDesc: 'Parts causing distributor backorders',
        slowTitle: 'Slow-Moving SKUs',
        slowDesc: 'Items with low turnover',
    }
  },
  Distributor: {
    title: 'Reports Module',
    description: 'Generate analytical reports on inventory data for decision-making. Export Stock, Transaction, and Forecast reports as CSV.',
    cards: {
        valueTitle: 'Sellable Inventory Value',
        valueDesc: 'Value of customer-facing stock',
        oosTitle: 'Lost Sales Items',
        oosDesc: 'Out of stock items with recent demand',
        slowTitle: 'Aging Items',
        slowDesc: 'Items with >60 days shelf time',
    }
  }
};

// CSV Export Utilities
const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header.toLowerCase().replace(/\s+/g, '')];
      // Escape commas and quotes in values
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ClientReports = () => {
  const { role, currentUser, walletInfo, isAdmin, vendors } = useAppState();
  const { toast } = useToast();
  const [userParts, setUserParts] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  // Load user's actual data from blockchain transactions
  useEffect(() => {
    const loadUserData = async () => {
      if (!walletInfo?.address) return;
      
      try {
        console.log('📊 Loading user data for reports...');
        const orderCount = await smartContractService.getOrderCount();
        
        if (orderCount > 0) {
          const orderPromises = [];
          for (let i = 1; i <= orderCount; i++) {
            orderPromises.push(smartContractService.getOrder(i));
          }
          
          const allOrders = await Promise.all(orderPromises);
          
          // Filter orders for current user
          const currentWalletAddress = walletInfo?.address?.toLowerCase();
          const userOrders = allOrders.filter(order => 
            order.buyer.toLowerCase() === currentWalletAddress || 
            order.seller.toLowerCase() === currentWalletAddress
          );
          
          console.log(`📦 Found ${userOrders.length} orders for current user`);
          
          // Convert orders to transactions
          const { vendors: roleVendors } = getVendorsForRole(role || 'Distributor', vendors);
          const transactions = userOrders.map((order, index) => ({
            id: `T-${String(index + 1).padStart(3, '0')}`,
            partName: order.partName,
            type: 'supply',
            quantity: order.quantity,
            date: new Date(order.timestamp * 1000).toISOString().split('T')[0],
            from: roleVendors[0]?.name || 'Vendor',
            to: role || 'Distributor',
            role: role || 'Distributor',
            status: order.completed ? 'completed' : 'pending',
            blockchainOrderId: order.orderId,
            blockchainTxHash: order.txHash,
          }));
          
          // Generate parts from transactions (aggregate by partName)
          const partsMap = new Map();
          transactions.forEach(tx => {
            const existing = partsMap.get(tx.partName);
            if (existing) {
              existing.quantity += tx.quantity;
            } else {
              partsMap.set(tx.partName, {
                id: `P-${String(partsMap.size + 1).padStart(3, '0')}`,
                name: tx.partName,
                quantity: tx.quantity,
                reorderPoint: 10,
                maxStock: tx.quantity * 2,
                type: 'finished'
              });
            }
          });
          
          const parts = Array.from(partsMap.values());
          
          console.log(`📋 Generated ${parts.length} parts and ${transactions.length} transactions from blockchain orders`);
          setUserParts(parts);
          setUserTransactions(transactions);
        } else {
          console.log('📭 No blockchain orders found');
          setUserParts([]);
          setUserTransactions([]);
        }
      } catch (error) {
        console.error('❌ Error loading user data for reports:', error);
        setUserParts([]);
        setUserTransactions([]);
      }
    };

    loadUserData();
  }, [walletInfo, role, vendors]);

  if (!role) {
    return <p>Loading reports...</p>;
  }

  const specifics = roleSpecifics[role] || roleSpecifics.Supplier;

  const totalValue = userParts.reduce((sum, part) => sum + part.quantity * 50, 0); // Assuming avg price of $50
  const outOfStock = userParts.filter(p => p.quantity === 0).length;
  const slowMoving = userParts.filter(p => userTransactions.filter(t => t.partName === p.name).length < 2).length;

  // Export functions
  const exportStockReport = () => {
    const stockData = userParts.map(part => ({
      partname: part.name,
      quantity: part.quantity,
      reorderpoint: part.reorderPoint,
      maxstock: part.maxStock,
      type: part.type,
      value: part.quantity * 50, // Estimated value
      status: part.quantity === 0 ? 'Out of Stock' : part.quantity <= part.reorderPoint ? 'Low Stock' : 'In Stock'
    }));

    exportToCSV(stockData, `${role}_Stock_Report`, [
      'Part Name', 'Quantity', 'Reorder Point', 'Max Stock', 'Type', 'Value', 'Status'
    ]);

    toast({
      title: 'Stock Report Exported',
      description: `Stock report for ${role} has been downloaded as CSV.`,
    });
  };

  const exportTransactionReport = () => {
    const transactionData = userTransactions.map(tx => ({
      partname: tx.partName,
      type: tx.type,
      quantity: tx.quantity,
      date: tx.date,
      from: tx.from,
      to: tx.to,
      status: tx.status || 'completed',
      invoicenumber: tx.invoiceNumber || 'N/A',
      blockchaintx: tx.blockchainTxHash || 'N/A'
    }));

    exportToCSV(transactionData, `${role}_Transaction_Report`, [
      'Part Name', 'Type', 'Quantity', 'Date', 'From', 'To', 'Status', 'Invoice Number', 'Blockchain TX'
    ]);

    toast({
      title: 'Transaction Report Exported',
      description: `Transaction report for ${role} has been downloaded as CSV.`,
    });
  };

  const exportForecastReport = () => {
    const forecastData = computeReplenishmentPlan(userParts, userTransactions, {
      lookbackDays: 90,
      vendorLeadTimeDays: 14,
      safetyDays: 7
    }).map(forecast => ({
      partname: forecast.partName,
      currentquantity: forecast.currentQuantity,
      reorderpoint: forecast.reorderPoint,
      averagedailydemand: forecast.averageDailyDemand,
      averagedailysupply: forecast.averageDailySupply,
      netdailyconsumption: forecast.netDailyConsumption,
      daysuntilreorder: forecast.daysUntilReorderThreshold || 'N/A',
      neededbydate: forecast.neededByDate || 'N/A',
      recommendedorderqty: forecast.recommendedOrderQty,
      status: forecast.recommendedOrderQty > 0 ? 'Order Needed' : 'Sufficient Stock'
    }));

    exportToCSV(forecastData, `${role}_Forecast_Report`, [
      'Part Name', 'Current Quantity', 'Reorder Point', 'Average Daily Demand', 
      'Average Daily Supply', 'Net Daily Consumption', 'Days Until Reorder', 
      'Needed By Date', 'Recommended Order Qty', 'Status'
    ]);

    toast({
      title: 'Forecast Report Exported',
      description: `Stock forecast report for ${role} has been downloaded as CSV.`,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">{specifics.title}</h1>
          <p className="text-muted-foreground">
            {specifics.description}
          </p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button onClick={exportStockReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Stock Report
          </Button>
          <Button onClick={exportTransactionReport} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Transaction Report
          </Button>
          <Button onClick={exportForecastReport} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Forecast Report
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
          <Card>
              <CardHeader>
                  <CardTitle>{specifics.cards.valueTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{specifics.cards.valueDesc}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>{specifics.cards.oosTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">{outOfStock}</p>
                  <p className="text-xs text-muted-foreground">{specifics.cards.oosDesc}</p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>{specifics.cards.slowTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">{slowMoving}</p>
                  <p className="text-xs text-muted-foreground">{specifics.cards.slowDesc}</p>
              </CardContent>
          </Card>
      </div>
      <StockHistoryChart parts={userParts} transactions={userTransactions} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionVolumeChart transactions={userTransactions} />
        <InventoryTurnoverChart parts={userParts} transactions={userTransactions} />
      </div>
    </div>
  );
};

const AdminReports = () => {
    const { role, isAdmin, unifiedDataService } = useAppState();
    const { toast } = useToast();
    const [systemData, setSystemData] = useState<{
      parts: any[];
      transactions: any[];
      shipments: any[];
    }>({ parts: [], transactions: [], shipments: [] });

    // Fetch system-wide data for admin reports
    useEffect(() => {
      if (isAdmin && unifiedDataService) {
        const fetchSystemData = async () => {
          try {
            const systemData = await unifiedDataService.getSystemData();
            setSystemData({
              parts: systemData.parts,
              transactions: systemData.transactions,
              shipments: systemData.shipments
            });
            console.log('🎯 Admin Reports loaded system data:', {
              parts: systemData.parts.length,
              transactions: systemData.transactions.length,
              shipments: systemData.shipments.length
            });
          } catch (error) {
            console.error('Error fetching system data for reports:', error);
          }
        };
        fetchSystemData();
      }
    }, [isAdmin, unifiedDataService]);

    const { parts, transactions, shipments } = systemData;
    const { parts: roleParts, transactions: roleTransactions } = getDataForRole(role, parts, transactions, shipments, isAdmin);

    // Admin export functions
    const exportSystemReport = () => {
      const systemData = [{
        totalparts: parts.length,
        totalquantity: parts.reduce((sum, p) => sum + p.quantity, 0),
        totaltransactions: transactions.length,
        totalshipments: shipments.length,
        outofstockparts: parts.filter(p => p.quantity === 0).length,
        pendingtransactions: transactions.filter(tx => tx.status === 'pending').length,
        approvedtransactions: transactions.filter(tx => tx.status === 'approved').length,
        blockchaintransactions: transactions.filter(tx => tx.blockchainTxHash).length,
        reportgeneratedby: 'Admin',
        reportdate: new Date().toISOString().split('T')[0]
      }];

      exportToCSV(systemData, 'System_Wide_Report', [
        'Total Parts', 'Total Quantity', 'Total Transactions', 'Total Shipments',
        'Out Of Stock Parts', 'Pending Transactions', 'Approved Transactions',
        'Blockchain Transactions', 'Report Generated By', 'Report Date'
      ]);

      toast({
        title: 'System Report Exported',
        description: 'System-wide report has been downloaded as CSV.',
      });
    };

    const exportEntityReport = () => {
      const roles: Array<'Manufacturer' | 'Supplier' | 'Distributor'> = ['Manufacturer', 'Supplier', 'Distributor'];
      const entityData = roles.map(entityRole => {
        const { parts: entityParts, transactions: entityTransactions } = getDataForRole(entityRole, parts, transactions, shipments, false);
        return {
          entity: entityRole,
          parts: entityParts.length,
          totalquantity: entityParts.reduce((sum, p) => sum + p.quantity, 0),
          transactions: entityTransactions.length,
          supplytransactions: entityTransactions.filter(tx => tx.type === 'supply').length,
          demandtransactions: entityTransactions.filter(tx => tx.type === 'demand').length,
          pendingtransactions: entityTransactions.filter(tx => tx.status === 'pending').length,
          outofstockparts: entityParts.filter(p => p.quantity === 0).length
        };
      });

      exportToCSV(entityData, 'Entity_Report', [
        'Entity', 'Parts', 'Total Quantity', 'Transactions', 'Supply Transactions',
        'Demand Transactions', 'Pending Transactions', 'Out Of Stock Parts'
      ]);

      toast({
        title: 'Entity Report Exported',
        description: 'Entity breakdown report has been downloaded as CSV.',
      });
    };

    const exportComplianceReport = () => {
      const complianceData = transactions.map(tx => ({
        transactionid: tx.id,
        partname: tx.partName,
        type: tx.type,
        quantity: tx.quantity,
        date: tx.date,
        from: tx.from,
        to: tx.to,
        role: tx.role,
        status: tx.status || 'completed',
        fromwallet: tx.fromWallet || 'N/A',
        towallet: tx.toWallet || 'N/A',
        invoicenumber: tx.invoiceNumber || 'N/A',
        blockchainorderid: tx.blockchainOrderId || 'N/A',
        blockchaintxhash: tx.blockchainTxHash || 'N/A',
        etherscanurl: tx.etherscanUrl || 'N/A',
        approvedby: tx.approvedBy || 'N/A',
        approvedat: tx.approvedAt || 'N/A',
        compliant: tx.blockchainTxHash ? 'Yes' : 'No'
      }));

      exportToCSV(complianceData, 'Admin_Compliance_Report', [
        'Transaction ID', 'Part Name', 'Type', 'Quantity', 'Date', 'From', 'To', 'Role',
        'Status', 'From Wallet', 'To Wallet', 'Invoice Number', 'Blockchain Order ID',
        'Blockchain TX Hash', 'Etherscan URL', 'Approved By', 'Approved At', 'Compliant'
      ]);

      toast({
        title: 'Compliance Report Exported',
        description: 'System-wide compliance report has been downloaded as CSV.',
      });
    };

    return (
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-headline">System-Wide Analytics</h1>
              <p className="text-muted-foreground">
                Generate reports on the network's performance. Use the role switcher in the header to filter by entity.
              </p>
            </div>
          </div>
          
          {/* Admin Export Buttons */}
          <div className="flex gap-2">
            <Button onClick={exportSystemReport} variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              System Report
            </Button>
            <Button onClick={exportEntityReport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Entity Report
            </Button>
            <Button onClick={exportComplianceReport} variant="outline" size="sm">
              <Shield className="h-4 w-4 mr-2" />
              Compliance Report
            </Button>
          </div>
        </div>
        <StockHistoryChart parts={roleParts} transactions={roleTransactions} />
        <div className="grid gap-6 lg:grid-cols-2">
          <TransactionVolumeChart transactions={roleTransactions} />
          <InventoryTurnoverChart parts={roleParts} transactions={roleTransactions} />
        </div>
      </div>
    );
  };


export default function ReportsPage() {
  const { isAdmin } = useAppState();

  return (
    <AppLayout>
        <div className="flex flex-col gap-8">
            {isAdmin ? <AdminReports /> : <ClientReports />}
        </div>
    </AppLayout>
  );
}
