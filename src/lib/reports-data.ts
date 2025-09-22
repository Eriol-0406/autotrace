import { 
  recentTransactions, 
  transactionVolumeData, 
  inventoryTurnoverData, 
  performanceMetrics,
  getRecentTransactionsByRole,
  getTransactionVolumeByRole,
  getInventoryTurnoverByRole,
  getPartsByRole 
} from './dummy-data';
import type { Role } from './types';

// Reports Data Service
export class ReportsDataService {
  
  // Get recent transactions for dashboard
  static getRecentTransactions(role?: Role, limit: number = 10) {
    const transactions = role ? getRecentTransactionsByRole(role) : recentTransactions;
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // Get transaction volume data
  static getTransactionVolume(role?: Role, period: 'monthly' | 'weekly' | 'daily' = 'monthly') {
    if (role) {
      const roleData = getTransactionVolumeByRole(role);
      return {
        data: roleData,
        total: roleData.reduce((sum, item) => sum + item.volume, 0),
        average: roleData.reduce((sum, item) => sum + item.volume, 0) / roleData.length,
      };
    }

    switch (period) {
      case 'monthly':
        return {
          data: transactionVolumeData.monthlyVolume,
          total: transactionVolumeData.monthlyVolume.reduce((sum, month) => sum + month.total, 0),
          average: transactionVolumeData.monthlyVolume.reduce((sum, month) => sum + month.total, 0) / transactionVolumeData.monthlyVolume.length,
        };
      case 'weekly':
        return {
          data: transactionVolumeData.weeklyVolume,
          total: transactionVolumeData.weeklyVolume.reduce((sum, week) => sum + week.volume, 0),
          average: transactionVolumeData.weeklyVolume.reduce((sum, week) => sum + week.volume, 0) / transactionVolumeData.weeklyVolume.length,
        };
      case 'daily':
        return {
          data: transactionVolumeData.dailyVolume,
          total: transactionVolumeData.dailyVolume.reduce((sum, day) => sum + day.volume, 0),
          average: transactionVolumeData.dailyVolume.reduce((sum, day) => sum + day.volume, 0) / transactionVolumeData.dailyVolume.length,
        };
    }
  }

  // Get inventory turnover data
  static getInventoryTurnover(role?: Role) {
    if (role) {
      const roleData = getInventoryTurnoverByRole(role);
      return {
        data: roleData,
        current: inventoryTurnoverData.overallTurnover[role]?.rate || 0,
        industry: inventoryTurnoverData.overallTurnover[role]?.industry || 0,
        status: inventoryTurnoverData.overallTurnover[role]?.status || 'Average',
      };
    }

    return {
      data: inventoryTurnoverData.monthlyTurnover,
      overall: inventoryTurnoverData.overallTurnover,
      partSpecific: inventoryTurnoverData.partTurnover,
    };
  }

  // Get performance metrics
  static getPerformanceMetrics() {
    return performanceMetrics;
  }

  // Get parts with turnover rates
  static getPartsWithTurnover(role?: Role) {
    return getPartsByRole(role || 'Distributor');
  }

  // Get transaction summary
  static getTransactionSummary(role?: Role, days: number = 30) {
    const transactions = role ? getRecentTransactionsByRole(role) : recentTransactions;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentTxs = transactions.filter(tx => new Date(tx.date) >= cutoffDate);
    
    return {
      totalTransactions: recentTxs.length,
      totalValue: recentTxs.reduce((sum, tx) => sum + (tx.value || 0), 0),
      averageValue: recentTxs.reduce((sum, tx) => sum + (tx.value || 0), 0) / recentTxs.length || 0,
      completedTransactions: recentTxs.filter(tx => tx.status === 'completed').length,
      pendingTransactions: recentTxs.filter(tx => tx.status === 'pending').length,
      supplyTransactions: recentTxs.filter(tx => tx.type === 'supply').length,
      demandTransactions: recentTxs.filter(tx => tx.type === 'demand').length,
    };
  }

  // Get top performing parts
  static getTopPerformingParts(role?: Role, limit: number = 5) {
    const parts = getPartsByRole(role || 'Distributor');
    return parts
      .filter(part => part.turnoverRate)
      .sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0))
      .slice(0, limit);
  }

  // Get low performing parts (slow turnover)
  static getLowPerformingParts(role?: Role, limit: number = 5) {
    const parts = getPartsByRole(role || 'Distributor');
    return parts
      .filter(part => part.turnoverRate && part.turnoverRate < 5)
      .sort((a, b) => (a.turnoverRate || 0) - (b.turnoverRate || 0))
      .slice(0, limit);
  }

  // Get inventory health metrics
  static getInventoryHealth(role?: Role) {
    const parts = getPartsByRole(role || 'Distributor');
    
    const totalValue = parts.reduce((sum, part) => sum + (part.quantity * 100), 0); // Assuming $100 average value
    const reorderItems = parts.filter(part => part.quantity <= part.reorderPoint);
    const overstockItems = parts.filter(part => part.quantity >= part.maxStock * 0.9);
    const averageTurnover = parts.reduce((sum, part) => sum + (part.turnoverRate || 0), 0) / parts.length;
    
    return {
      totalInventoryValue: totalValue,
      totalParts: parts.length,
      reorderItems: reorderItems.length,
      overstockItems: overstockItems.length,
      averageTurnover: averageTurnover,
      healthScore: Math.max(0, Math.min(100, 100 - (reorderItems.length * 10) + (averageTurnover * 5))),
    };
  }

  // Get vendor performance
  static getVendorPerformance() {
    return [
      { vendor: 'Global Metals Inc.', rating: 4.8, fulfillment: 98, orders: 45, avgDeliveryTime: 2.1 },
      { vendor: 'Apex Automotive Manufacturing', rating: 4.9, fulfillment: 99, orders: 38, avgDeliveryTime: 1.8 },
      { vendor: 'Auto Parts Supply Co.', rating: 4.2, fulfillment: 88, orders: 52, avgDeliveryTime: 3.2 },
      { vendor: 'Precision Pistons Ltd.', rating: 4.5, fulfillment: 92, orders: 29, avgDeliveryTime: 2.5 },
      { vendor: 'Wheel Co.', rating: 4.3, fulfillment: 90, orders: 31, avgDeliveryTime: 2.8 },
    ];
  }

  // Get growth trends
  static getGrowthTrends() {
    return {
      revenue: {
        monthly: [320000, 340000, 360000, 380000, 400000, 420000],
        quarterly: [980000, 1040000, 1120000, 1180000],
        yearly: [3200000, 3800000, 4200000, 4800000],
      },
      transactions: {
        monthly: [180, 195, 210, 225, 240, 255],
        quarterly: [585, 630, 675, 720],
        yearly: [2100, 2400, 2700, 3000],
      },
      customers: {
        monthly: [45, 48, 52, 55, 58, 62],
        quarterly: [145, 156, 167, 178],
        yearly: [520, 580, 640, 720],
      },
    };
  }
}

// Export convenience functions
export const getReportsData = (type: 'recent-transactions' | 'transaction-volume' | 'inventory-turnover' | 'performance' | 'summary', role?: Role) => {
  switch (type) {
    case 'recent-transactions':
      return ReportsDataService.getRecentTransactions(role);
    case 'transaction-volume':
      return ReportsDataService.getTransactionVolume(role);
    case 'inventory-turnover':
      return ReportsDataService.getInventoryTurnover(role);
    case 'performance':
      return ReportsDataService.getPerformanceMetrics();
    case 'summary':
      return ReportsDataService.getTransactionSummary(role);
    default:
      return null;
  }
};
