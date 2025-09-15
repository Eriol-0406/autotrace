
"use client";
import { AppLayout } from '@/components/app-layout';
import { InventoryTurnoverChart } from '@/components/reports/inventory-turnover-chart';
import { StockHistoryChart } from '@/components/reports/stock-history-chart';
import { TransactionVolumeChart } from '@/components/reports/transaction-volume-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { getDataForRole } from '@/lib/data';
import { Shield, Download, FileText, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roleSpecifics = {
  Manufacturer: {
    title: 'Production Analytics',
    description: 'Analyze material consumption and production output.',
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
    title: 'Warehouse Analytics',
    description: 'Visualize inventory data and transaction history.',
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
    title: 'Sales & Stock Analytics',
    description: 'Analyze sales trends and fulfillment efficiency.',
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
  const { role, parts, transactions, currentUser } = useAppState();
  const { toast } = useToast();

  if (!role) {
    return <p>Loading reports...</p>;
  }

  const specifics = roleSpecifics[role] || roleSpecifics.Supplier;

  const totalValue = parts.reduce((sum, part) => sum + part.quantity * 50, 0); // Assuming avg price of $50
  const outOfStock = parts.filter(p => p.quantity === 0).length;
  const slowMoving = parts.filter(p => transactions.filter(t => t.partName === p.name).length < 2).length;

  // Export functions
  const exportStockReport = () => {
    const stockData = parts.map(part => ({
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
    const transactionData = transactions.map(tx => ({
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

  const exportComplianceReport = () => {
    const complianceData = transactions
      .filter(tx => tx.blockchainTxHash) // Only blockchain transactions
      .map(tx => ({
        transactionid: tx.id,
        partname: tx.partName,
        type: tx.type,
        quantity: tx.quantity,
        date: tx.date,
        from: tx.from,
        to: tx.to,
        fromwallet: tx.fromWallet || 'N/A',
        towallet: tx.toWallet || 'N/A',
        blockchainorderid: tx.blockchainOrderId || 'N/A',
        blockchaintxhash: tx.blockchainTxHash,
        etherscanurl: tx.etherscanUrl || 'N/A',
        status: tx.status || 'completed',
        approvedby: tx.approvedBy || 'N/A',
        approvedat: tx.approvedAt || 'N/A'
      }));

    exportToCSV(complianceData, `${role}_Compliance_Report`, [
      'Transaction ID', 'Part Name', 'Type', 'Quantity', 'Date', 'From', 'To', 
      'From Wallet', 'To Wallet', 'Blockchain Order ID', 'Blockchain TX Hash', 
      'Etherscan URL', 'Status', 'Approved By', 'Approved At'
    ]);

    toast({
      title: 'Compliance Report Exported',
      description: `Blockchain compliance report for ${role} has been downloaded as CSV.`,
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
            Transactions
          </Button>
          <Button onClick={exportComplianceReport} variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Compliance
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
      <StockHistoryChart />
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionVolumeChart transactions={transactions} />
        <InventoryTurnoverChart parts={parts} transactions={transactions} />
      </div>
    </div>
  );
};

const AdminReports = () => {
    const { role, parts, transactions, shipments, isAdmin } = useAppState();
    const { parts: roleParts, transactions: roleTransactions } = getDataForRole(role, parts, transactions, shipments, isAdmin);
    const { toast } = useToast();

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
        <StockHistoryChart />
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
