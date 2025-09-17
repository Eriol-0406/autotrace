import { Part, Transaction, Vendor, Shipment } from '@/lib/types';
import IDGenerator from './id-generator';

export interface DatabaseUser {
  _id: string;
  email: string;
  name: string;
  role: 'Manufacturer' | 'Supplier' | 'Distributor' | null;
  isAdmin: boolean;
  walletAddress?: string;
  walletConnected: boolean;
  blockchainRegistered?: boolean;
  entityName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

class DatabaseService {
  private baseUrl = '/api';

  // User operations
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users?email=${encodeURIComponent(email)}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(userData: Omit<DatabaseUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error creating user: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error; // Re-throw to be handled by the calling code
    }
  }

  async updateUser(emailOrId: string, updateData: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // Check if it's an email (contains @) or an ID
          ...(emailOrId.includes('@') ? { email: emailOrId } : { _id: emailOrId }),
          ...updateData 
        }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Error updating user: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Parts operations
  async getParts(userId: string): Promise<Part[]> {
    try {
      const response = await fetch(`${this.baseUrl}/parts?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching parts:', error);
      return [];
    }
  }

  async createPart(partData: Part & { userId: string }): Promise<Part | null> {
    try {
      const response = await fetch(`${this.baseUrl}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating part:', error);
      return null;
    }
  }

  async updatePart(partData: Part & { _id: string; userId: string }): Promise<Part | null> {
    try {
      const response = await fetch(`${this.baseUrl}/parts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error updating part:', error);
      return null;
    }
  }

  async deletePart(partId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/parts?id=${encodeURIComponent(partId)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting part:', error);
      return false;
    }
  }

  // Transactions operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async createTransaction(transactionData: Transaction & { userId: string }): Promise<Transaction | null> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  async updateTransaction(transactionData: Transaction & { _id: string; userId: string }): Promise<Transaction | null> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  }

  // Vendors operations
  async getVendors(): Promise<Vendor[]> {
    try {
      // Vendors are system-wide, not user-specific (as per framework specification)
      const response = await fetch(`${this.baseUrl}/vendors`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }

  async createVendor(vendorData: Vendor & { userId: string }): Promise<Vendor | null> {
    try {
      const response = await fetch(`${this.baseUrl}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating vendor:', error);
      return null;
    }
  }

  async updateVendor(vendorData: Vendor & { _id: string; userId: string }): Promise<Vendor | null> {
    try {
      const response = await fetch(`${this.baseUrl}/vendors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error updating vendor:', error);
      return null;
    }
  }

  async getVendorById(vendorId: string, userId: string): Promise<Vendor | null> {
    try {
      const response = await fetch(`${this.baseUrl}/vendors?vendorId=${encodeURIComponent(vendorId)}&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return null;
      const vendors = await response.json();
      return vendors.find((v: Vendor) => v.id === vendorId) || null;
    } catch (error) {
      console.error('Error getting vendor by id:', error);
      return null;
    }
  }

  async deleteVendor(vendorId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/vendors?id=${encodeURIComponent(vendorId)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      return false;
    }
  }

  // Admin methods for system-wide data
  async getAllParts(): Promise<Part[]> {
    try {
      const response = await fetch(`${this.baseUrl}/parts?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all parts:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }

  async getAllShipments(): Promise<Shipment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all shipments:', error);
      return [];
    }
  }

  async getUsers(): Promise<DatabaseUser[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  // Shipments operations
  async getShipments(userId: string): Promise<Shipment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching shipments:', error);
      return [];
    }
  }

  async createShipment(shipmentData: Shipment & { userId: string }): Promise<Shipment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating shipment:', error);
      return null;
    }
  }

  async updateShipment(shipmentData: Shipment & { _id: string; userId: string }): Promise<Shipment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/shipments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error updating shipment:', error);
      return null;
    }
  }
}

export const databaseService = new DatabaseService();
