import { Part, Transaction, Vendor, Shipment } from '@/lib/types';
import IDGenerator from './id-generator';

export interface DatabaseUser {
  _id: string;
  email: string;
  name: string;
  passwordHash?: string;
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
  private getBaseUrl() {
    // If we're running on the server (API routes), use absolute URL
    if (typeof window === 'undefined') {
      return process.env.NODE_ENV === 'production' 
        ? 'https://your-domain.com/api' 
        : 'http://localhost:9002/api';
    }
    // If we're running on the client, use relative URL
    return '/api';
  }
  // Auth
  async signup(name: string, email: string, password: string, role: DatabaseUser['role'] | null) {
    const res = await fetch(`${this.getBaseUrl()}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async login(email: string, password: string) {
    const res = await fetch(`${this.getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // User operations
  async getUserByEmail(email: string, includePassword: boolean = false): Promise<DatabaseUser | null> {
    try {
      // If we're on the server (API routes), call MongoDB directly to avoid circular fetch calls
      if (typeof window === 'undefined') {
        const { connectDB } = await import('./mongodb');
        const User = (await import('./models/User')).default;
        await connectDB();
        
        const selectFields = includePassword ? '+passwordHash' : '-passwordHash';
        const user = await User.findOne({ email }).select(selectFields);
        return user ? {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          passwordHash: user.passwordHash,
          role: user.role,
          isAdmin: user.isAdmin,
          walletAddress: user.walletAddress,
          walletConnected: user.walletConnected,
          blockchainRegistered: user.blockchainRegistered,
          entityName: user.entityName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } : null;
      }
      
      // If we're on the client, make HTTP call
      const url = `${this.getBaseUrl()}/users?email=${encodeURIComponent(email)}${includePassword ? '&includePassword=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(userData: Omit<DatabaseUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseUser | null> {
    try {
      // If we're on the server (API routes), call MongoDB directly to avoid circular fetch calls
      if (typeof window === 'undefined') {
        const { connectDB } = await import('./mongodb');
        const User = (await import('./models/User')).default;
        await connectDB();
        
        const user = new User(userData);
        await user.save();
        
        return {
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          passwordHash: user.passwordHash,
          role: user.role,
          isAdmin: user.isAdmin,
          walletAddress: user.walletAddress,
          walletConnected: user.walletConnected,
          blockchainRegistered: user.blockchainRegistered,
          entityName: user.entityName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      }
      
      // If we're on the client, make HTTP call
      const response = await fetch(`${this.getBaseUrl()}/users`, {
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
      const response = await fetch(`${this.getBaseUrl()}/users`, {
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
      const response = await fetch(`${this.getBaseUrl()}/parts?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching parts:', error);
      return [];
    }
  }

  async createPart(partData: Part & { userId: string }): Promise<Part | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/parts`, {
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
      const response = await fetch(`${this.getBaseUrl()}/parts`, {
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
      const response = await fetch(`${this.getBaseUrl()}/parts?id=${encodeURIComponent(partId)}`, {
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
      const response = await fetch(`${this.getBaseUrl()}/transactions?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async createTransaction(transactionData: Transaction & { userId: string }): Promise<Transaction | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transactions`, {
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
      const response = await fetch(`${this.getBaseUrl()}/transactions`, {
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
      const response = await fetch(`${this.getBaseUrl()}/vendors`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  }

  async createVendor(vendorData: Vendor & { userId: string }): Promise<Vendor | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/vendors`, {
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
      const response = await fetch(`${this.getBaseUrl()}/vendors`, {
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
      const response = await fetch(`${this.getBaseUrl()}/vendors?vendorId=${encodeURIComponent(vendorId)}&userId=${encodeURIComponent(userId)}`);
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
      const response = await fetch(`${this.getBaseUrl()}/vendors?id=${encodeURIComponent(vendorId)}`, {
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
      const response = await fetch(`${this.getBaseUrl()}/parts?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all parts:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transactions?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }

  async getAllShipments(): Promise<Shipment[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/shipments?all=true`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all shipments:', error);
      return [];
    }
  }

  async getUsers(): Promise<DatabaseUser[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/users?all=true`);
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
      const response = await fetch(`${this.getBaseUrl()}/shipments?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching shipments:', error);
      return [];
    }
  }

  async createShipment(shipmentData: Shipment & { userId: string }): Promise<Shipment | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/shipments`, {
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
      const response = await fetch(`${this.getBaseUrl()}/shipments`, {
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
