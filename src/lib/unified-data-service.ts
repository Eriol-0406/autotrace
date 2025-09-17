import { databaseService } from './database';
import type { Part, Transaction, Shipment, Vendor, Role } from './types';
import { getDataForRole } from './data';

/**
 * Unified Data Service - Centralized data management for client-admin integration
 * This service replaces localStorage dependency and provides unified data access
 */
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private dataCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Real-time sync mechanism
  private dataChangeListeners = new Set<() => void>();

  private constructor() {}

  public static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  /**
   * Get user-specific data from database instead of localStorage
   */
  async getUserData(userId: string): Promise<{
    parts: Part[];
    transactions: Transaction[];
    shipments: Shipment[];
    vendors: Vendor[];
  }> {
    const cacheKey = `user_data_${userId}`;
    
    // FORCE CLEAR CACHE TO ENSURE FRESH DATA
    this.dataCache.delete(cacheKey);
    console.log('🔄 Cleared cache for user data to force fresh demo data');

    try {
      // INTEGRATED APPROACH: Use database with proper filtering
      console.log('🎯 Fetching integrated user data from database');
      
      // Get user's role from localStorage
      const authState = localStorage.getItem('authState');
      let role = 'Distributor';
      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          role = parsed.role || 'Distributor';
        } catch (e) {
          console.log('Could not parse auth state, using default role');
        }
      }

      // Fetch user-specific data from database
      const [parts, transactions, shipments, vendors] = await Promise.all([
        databaseService.getParts(userId),
        databaseService.getTransactions(userId),
        databaseService.getShipments(userId),
        databaseService.getVendors()
      ]);

      const userData = {
        parts: parts || [],
        transactions: transactions || [],
        shipments: shipments || [],
        vendors: vendors || []
      };

      console.log('📊 Fetched integrated user data:', { 
        partsCount: userData.parts.length, 
        transactionsCount: userData.transactions.length,
        shipmentsCount: userData.shipments.length,
        vendorsCount: userData.vendors.length 
      });

      // Cache the result
      this.setCache(cacheKey, userData);
      
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Return empty data on error
      return { parts: [], transactions: [], shipments: [], vendors: [] };
    }
  }

  /**
   * Get system-wide data for admin users
   */
  async getSystemData(): Promise<{
    parts: Part[];
    transactions: Transaction[];
    shipments: Shipment[];
    vendors: Vendor[];
    users: any[];
  }> {
    const cacheKey = 'system_data';
    
    // FORCE CLEAR CACHE TO ENSURE FRESH DATA
    this.dataCache.delete(cacheKey);
    console.log('🔄 Cleared cache for system data to force fresh demo data');

    try {
      // INTEGRATED APPROACH: Fetch all system data from database
      console.log('🎯 Fetching integrated system data from database');
      
      // Fetch all data from database (admin sees everything)
      const [parts, transactions, shipments, vendors, users] = await Promise.all([
        databaseService.getAllParts(),
        databaseService.getAllTransactions(),
        databaseService.getAllShipments(),
        databaseService.getVendors(),
        databaseService.getUsers()
      ]);

      const systemData = { 
        parts: parts || [],
        transactions: transactions || [],
        shipments: shipments || [],
        vendors: vendors || [],
        users: users || []
      };

      console.log('📊 Fetched integrated system data:', { 
        partsCount: systemData.parts.length, 
        transactionsCount: systemData.transactions.length,
        shipmentsCount: systemData.shipments.length,
        vendorsCount: systemData.vendors.length,
        usersCount: systemData.users.length
      });
      
      // Cache the result
      this.setCache(cacheKey, systemData);
      
      return systemData;
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Return empty data on error
      return { parts: [], transactions: [], shipments: [], vendors: [], users: [] };
    }
  }

  /**
   * Update user data in database
   */
  async updateUserData(userId: string, data: {
    parts?: Part[];
    transactions?: Transaction[];
    shipments?: Shipment[];
  }): Promise<boolean> {
    try {
      // Update each data type in database
      if (data.parts) {
        await this.updateUserParts(userId, data.parts);
      }
      if (data.transactions) {
        await this.updateUserTransactions(userId, data.transactions);
      }
      if (data.shipments) {
        await this.updateUserShipments(userId, data.shipments);
      }

      // Invalidate cache
      this.invalidateUserCache(userId);
      
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }

  /**
   * Add new data to database
   */
  async addData(type: 'part' | 'transaction' | 'shipment' | 'vendor', data: any): Promise<boolean> {
    try {
      switch (type) {
        case 'part':
          await databaseService.createPart(data);
          break;
        case 'transaction':
          await databaseService.createTransaction(data);
          break;
        case 'shipment':
          await databaseService.createShipment(data);
          break;
        case 'vendor':
          await databaseService.createVendor(data);
          break;
      }

      // Invalidate relevant caches
      this.invalidateAllCaches();
      
      return true;
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      return false;
    }
  }

  /**
   * Update existing data in database
   */
  async updateData(type: 'part' | 'transaction' | 'shipment' | 'vendor', id: string, data: any): Promise<boolean> {
    try {
      switch (type) {
        case 'part':
          await databaseService.updatePart({ ...data, _id: id, userId: data.userId || '' });
          break;
        case 'transaction':
          await databaseService.updateTransaction({ ...data, _id: id, userId: data.userId || '' });
          break;
        case 'shipment':
          await databaseService.updateShipment({ ...data, _id: id, userId: data.userId || '' });
          break;
        case 'vendor':
          await databaseService.updateVendor({ ...data, _id: id, userId: data.userId || '' });
          break;
      }

      // Invalidate relevant caches
      this.invalidateAllCaches();
      
      return true;
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      return false;
    }
  }

  /**
   * Delete data from database
   */
  async deleteData(type: 'part' | 'transaction' | 'shipment' | 'vendor', id: string): Promise<boolean> {
    try {
      switch (type) {
        case 'part':
          await databaseService.deletePart(id);
          break;
        case 'transaction':
          // TODO: Implement deleteTransaction in database service
          console.warn('deleteTransaction not implemented yet');
          break;
        case 'shipment':
          // TODO: Implement deleteShipment in database service
          console.warn('deleteShipment not implemented yet');
          break;
        case 'vendor':
          await databaseService.deleteVendor(id);
          break;
      }

      // Invalidate relevant caches
      this.invalidateAllCaches();
      
      return true;
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      return false;
    }
  }

  // Private helper methods
  private async getUserParts(userId: string): Promise<Part[]> {
    try {
      const response = await fetch(`/api/parts?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch parts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user parts:', error);
      return [];
    }
  }

  private async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`/api/transactions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  private async getUserShipments(userId: string): Promise<Shipment[]> {
    try {
      const response = await fetch(`/api/shipments?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user shipments:', error);
      return [];
    }
  }

  private async getAllParts(): Promise<Part[]> {
    try {
      // For admin, we need to get all parts from all users
      // This would require a new API endpoint or modification of existing ones
      const response = await fetch('/api/parts?all=true');
      if (!response.ok) throw new Error('Failed to fetch all parts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching all parts:', error);
      return [];
    }
  }

  private async getAllTransactions(): Promise<Transaction[]> {
    try {
      // For admin, we need to get all transactions from all users
      const response = await fetch('/api/transactions?all=true');
      if (!response.ok) throw new Error('Failed to fetch all transactions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }

  private async getAllShipments(): Promise<Shipment[]> {
    try {
      // For admin, we need to get all shipments from all users
      const response = await fetch('/api/shipments?all=true');
      if (!response.ok) throw new Error('Failed to fetch all shipments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching all shipments:', error);
      return [];
    }
  }

  private async getAllVendors(): Promise<Vendor[]> {
    try {
      const response = await fetch('/api/vendors');
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return await response.json();
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }

  private async getAllUsers(): Promise<any[]> {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  private async updateUserParts(userId: string, parts: Part[]): Promise<void> {
    // This would require batch update API endpoints
    // For now, we'll update individually
    for (const part of parts) {
      const partWithId = part as any;
      if (partWithId._id) {
        await databaseService.updatePart({ ...part, _id: partWithId._id, userId });
      } else {
        await databaseService.createPart({ ...part, userId });
      }
    }
  }

  private async updateUserTransactions(userId: string, transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      const transactionWithId = transaction as any;
      if (transactionWithId._id) {
        await databaseService.updateTransaction({ ...transaction, _id: transactionWithId._id, userId });
      } else {
        await databaseService.createTransaction({ ...transaction, userId });
      }
    }
  }

  private async updateUserShipments(userId: string, shipments: Shipment[]): Promise<void> {
    for (const shipment of shipments) {
      const shipmentWithId = shipment as any;
      if (shipmentWithId._id) {
        await databaseService.updateShipment({ ...shipment, _id: shipmentWithId._id, userId });
      } else {
        await databaseService.createShipment({ ...shipment, userId });
      }
    }
  }

  // Cache management
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  private setCache(key: string, data: any): void {
    this.dataCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private invalidateUserCache(userId: string): void {
    const keysToDelete = Array.from(this.dataCache.keys()).filter(key => 
      key.includes(`user_data_${userId}`) || key === 'system_data'
    );
    keysToDelete.forEach(key => {
      this.dataCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  private invalidateAllCaches(): void {
    this.dataCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Real-time sync methods
   */
  subscribeToDataChanges(callback: () => void): () => void {
    this.dataChangeListeners.add(callback);
    return () => this.dataChangeListeners.delete(callback);
  }

  notifyDataChanged(): void {
    console.log('🔄 Notifying data change to', this.dataChangeListeners.size, 'listeners');
    this.dataChangeListeners.forEach(callback => callback());
  }

  /**
   * Force refresh data for all users
   */
  async refreshAllData(): Promise<void> {
    console.log('🔄 Forcing refresh of all cached data');
    this.invalidateAllCaches();
    this.notifyDataChanged();
  }
}

// Export singleton instance
export const unifiedDataService = UnifiedDataService.getInstance();
