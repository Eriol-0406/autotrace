"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Role, Part, Transaction, Shipment, Vendor } from '@/lib/types';
import { demoParts, demoTransactions, demoShipments, allVendors, getDataForRole } from '@/lib/data';
import type { WalletInfo } from '@/lib/web3-wallet';
import { web3WalletService } from '@/lib/web3-wallet';
import { databaseService, type DatabaseUser } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

interface AppStateContextType {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  isAuthenticated: boolean;
  isInitialized: boolean;
  role: Role | null;
  setRole: (role: Role | null) => void;
  walletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;
  walletInfo: WalletInfo | null;
  setWalletInfo: (walletInfo: WalletInfo | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  currentUser: DatabaseUser | null;
  setCurrentUser: (user: DatabaseUser | null) => void;

  parts: Part[];
  transactions: Transaction[];
  shipments: Shipment[];
  vendors: Vendor[];
  updateUserData: (data: { parts?: Part[], transactions?: Transaction[], shipments?: Shipment[] }) => void;
  addVendor: (vendor: Vendor) => void;
  removeVendor: (vendorId: string) => void;
  updateVendorRating: (vendorId: string, rating: number) => void;
  clearUserData: () => void;
  syncToDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const EnhancedAppStateProvider = ({ children }: { children: ReactNode }) => {
  // Auth state
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<DatabaseUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // User-specific data state
  const [parts, setParts] = useState<Part[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const clearUserData = () => {
    setParts([]);
    setTransactions([]);
    setShipments([]);
    setVendors([]);
    setCurrentUser(null);
    setLoggedIn(false);
    setRole(null);
    setIsAdmin(false);
    // Clear wallet connection state
    setWalletConnected(false);
    setWalletInfo(null);
    // Disconnect wallet service
    web3WalletService.disconnect();
    localStorage.removeItem('userAppData');
    localStorage.removeItem('authState');
    console.log('🧹 User data cleared and wallet disconnected');
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuthState = async () => {
      try {
        const savedAuthState = localStorage.getItem('authState');
        if (savedAuthState) {
          const { loggedIn: savedLoggedIn, role: savedRole, isAdmin: savedIsAdmin, currentUser: savedUser } = JSON.parse(savedAuthState);
          
          if (savedLoggedIn && savedUser) {
            setLoggedIn(savedLoggedIn);
            setRole(savedRole);
            setIsAdmin(savedIsAdmin);
            setCurrentUser(savedUser);
            console.log('🔄 Restored auth state from localStorage:', { loggedIn: savedLoggedIn, role: savedRole, isAdmin: savedIsAdmin });
          }
        }
      } catch (error) {
        console.error('Error restoring auth state:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuthState();
  }, []);

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      const authState = {
        loggedIn,
        role,
        isAdmin,
        currentUser
      };
      localStorage.setItem('authState', JSON.stringify(authState));
      console.log('💾 Saved auth state to localStorage:', { loggedIn, role, isAdmin });
    }
  }, [loggedIn, role, isAdmin, currentUser, isInitialized]);

  const loadVendorsFromDatabase = async () => {
    try {
      const dbVendors = await databaseService.getVendors();
      if (dbVendors && dbVendors.length > 0) {
        setVendors(dbVendors);
        return dbVendors;
      } else {
        // Fallback to demo data if no vendors in database
        setVendors(allVendors);
        return allVendors;
      }
    } catch (error) {
      console.error('Error loading vendors from database:', error);
      // Fallback to demo data
      setVendors(allVendors);
      return allVendors;
    }
  };

  const syncToDatabase = async () => {
    if (!currentUser) return;
    
    try {
      // Sync parts
      for (const part of parts) {
        if (part._id) {
          await databaseService.updatePart({ ...part, userId: currentUser._id, _id: part._id });
        } else {
          await databaseService.createPart({ ...part, userId: currentUser._id });
        }
      }

      // Sync transactions
      for (const transaction of transactions) {
        if (transaction._id) {
          await databaseService.updateTransaction({ ...transaction, userId: currentUser._id, _id: transaction._id });
        } else {
          await databaseService.createTransaction({ ...transaction, userId: currentUser._id });
        }
      }

      // Sync vendors - check if vendor already exists by id to prevent duplicates
      for (const vendor of vendors) {
        if (vendor._id) {
          // Update existing vendor with MongoDB _id
          await databaseService.updateVendor({ ...vendor, userId: currentUser._id, _id: vendor._id });
        } else {
          // Check if vendor already exists by id field
          const existingVendor = await databaseService.getVendorById(vendor.id, currentUser._id);
          if (existingVendor) {
            // Update existing vendor
            await databaseService.updateVendor({ ...vendor, userId: currentUser._id, _id: existingVendor._id });
          } else {
            // Create new vendor
            await databaseService.createVendor({ ...vendor, userId: currentUser._id });
          }
        }
      }

      // Sync shipments
      for (const shipment of shipments) {
        if (shipment._id) {
          await databaseService.updateShipment({ ...shipment, userId: currentUser._id, _id: shipment._id });
        } else {
          await databaseService.createShipment({ ...shipment, userId: currentUser._id });
        }
      }

      console.log('✅ Data synced to database');
    } catch (error) {
      console.error('❌ Error syncing to database:', error);
    }
  };

  const loadFromDatabase = async () => {
    if (!currentUser) return;
    
    try {
      const [dbParts, dbTransactions, dbShipments] = await Promise.all([
        databaseService.getParts(currentUser._id),
        databaseService.getTransactions(currentUser._id),
        databaseService.getShipments(currentUser._id)
      ]);

      // Ensure unique parts by ID
      const uniqueParts = dbParts.filter((part, index, self) => 
        index === self.findIndex(p => p.id === part.id)
      );
      
      // Ensure unique shipments by ID
      const uniqueShipments = dbShipments.filter((shipment, index, self) => 
        index === self.findIndex(s => s.id === shipment.id)
      );
      
      setParts(uniqueParts);
      setTransactions(dbTransactions);
      // Load vendors from database (system-wide, not user-specific)
      await loadVendorsFromDatabase();
      setShipments(uniqueShipments);

      console.log('✅ Data loaded from database');
    } catch (error) {
      console.error('❌ Error loading from database:', error);
    }
  };

  const persistFullState = (state: { parts: Part[], transactions: Transaction[], shipments: Shipment[], vendors: Vendor[] }) => {
    // Ensure unique parts by ID
    const uniqueParts = state.parts.filter((part, index, self) => 
      index === self.findIndex(p => p.id === part.id)
    );
    
    // Ensure unique shipments by ID
    const uniqueShipments = state.shipments.filter((shipment, index, self) => 
      index === self.findIndex(s => s.id === shipment.id)
    );
    
    setParts(uniqueParts);
    setTransactions(state.transactions);
    setShipments(uniqueShipments);
    setVendors(state.vendors);

    // Only persist data for non-admin users
    if (!isAdmin) {
      localStorage.setItem('userAppData', JSON.stringify(state));
    }
  };

  const addVendor = (vendor: Vendor) => {
    // Refresh vendors from database after adding (since vendors are system-wide)
    loadVendorsFromDatabase();
  };

  const removeVendor = (vendorId: string) => {
    const updatedVendors = vendors.filter(v => v.id !== vendorId);
    persistFullState({ parts, transactions, shipments, vendors: updatedVendors });
  };

  const updateVendorRating = (vendorId: string, rating: number) => {
    const updatedVendors = vendors.map(v => v.id === vendorId ? { ...v, rating } : v);
    persistFullState({ parts, transactions, shipments, vendors: updatedVendors });
  }

  const updateUserData = (data: { parts?: Part[], transactions?: Transaction[], shipments?: Shipment[] }) => {
    const updatedState = {
      parts: data.parts || parts,
      transactions: data.transactions || transactions,
      shipments: data.shipments || shipments,
      vendors: vendors
    };
    persistFullState(updatedState);
  };

  // Initialize wallet connection
  useEffect(() => {
    let cancelled = false;
    
    const initWallet = async () => {
      try {
        const walletInfo = await web3WalletService.reconnectIfAuthorized();
        if (!cancelled) {
          setWalletConnected(!!walletInfo);
          setWalletInfo(walletInfo);
        }
      } catch (error) {
        console.error('Wallet initialization error:', error);
      }
    };

    initWallet();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // When auth state changes, load the appropriate data
    const authState = { loggedIn, role, walletConnected, walletInfo, isAdmin, currentUser };
    localStorage.setItem('appState', JSON.stringify(authState));
    
    // Admin always sees the full demo data set
    if (isAdmin) {
        // Ensure unique parts by ID
        const uniqueDemoParts = demoParts.filter((part, index, self) => 
          index === self.findIndex(p => p.id === part.id)
        );
        
        // Ensure unique shipments by ID
        const uniqueDemoShipments = demoShipments.filter((shipment, index, self) => 
          index === self.findIndex(s => s.id === shipment.id)
        );
        
        setParts(uniqueDemoParts);
        setTransactions(demoTransactions);
        setShipments(uniqueDemoShipments);
        // Load vendors from database for all users (admin and client)
        loadVendorsFromDatabase();
    } else if (loggedIn && currentUser) {
        // Load from database first, fallback to localStorage
        loadFromDatabase().then(() => {
          // If no data in database, try localStorage
          if (parts.length === 0) {
            try {
                const storedData = localStorage.getItem('userAppData');
                if(storedData) {
                    const { parts: storedParts, transactions: storedTransactions, shipments: storedShipments, vendors: storedVendors } = JSON.parse(storedData);
                    
                    // Ensure unique parts by ID
                    const uniqueStoredParts = (storedParts || []).filter((part: Part, index: number, self: Part[]) => 
                      index === self.findIndex(p => p.id === part.id)
                    );
                    
                    // Ensure unique shipments by ID
                    const uniqueStoredShipments = (storedShipments || []).filter((shipment: Shipment, index: number, self: Shipment[]) => 
                      index === self.findIndex(s => s.id === shipment.id)
                    );
                    
                    setParts(uniqueStoredParts);
                    setTransactions(storedTransactions || []);
                    setShipments(uniqueStoredShipments);
                    if (storedVendors && storedVendors.length > 0) {
                      setVendors(storedVendors);
                    } else {
                      // Load from database if no stored vendors
                      loadVendorsFromDatabase();
                    }
                } else {
                    // New user: seed with role-specific demo data with unique IDs
                    const seeded = getDataForRole(role, demoParts, demoTransactions, demoShipments, currentUser?._id);
                    
                    // Ensure unique parts by ID
                    const uniqueSeededParts = seeded.parts.filter((part, index, self) => 
                      index === self.findIndex(p => p.id === part.id)
                    );
                    
                    // Ensure unique shipments by ID
                    const uniqueSeededShipments = seeded.shipments.filter((shipment, index, self) => 
                      index === self.findIndex(s => s.id === shipment.id)
                    );
                    
                    setParts(uniqueSeededParts);
                    setTransactions(seeded.transactions);
                    setShipments(uniqueSeededShipments);
                    // Load vendors from database for new users too
                    loadVendorsFromDatabase();
                }
            } catch (error) {
                console.error("Could not parse user app data from localStorage", error);
                clearUserData();
            }
          }
        });
    } else {
        // Logged out, clear all data
        clearUserData();
    }
  }, [loggedIn, role, walletConnected, walletInfo, isAdmin, currentUser]);

  // Auto-sync to database when data changes (debounced)
  useEffect(() => {
    if (!loggedIn || !currentUser) return;
    
    const timeoutId = setTimeout(() => {
      syncToDatabase();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [parts, transactions, vendors, shipments, loggedIn, currentUser]);

  const value: AppStateContextType = {
    loggedIn,
    setLoggedIn,
    isAuthenticated: loggedIn,
    isInitialized,
    role,
    setRole,
    walletConnected,
    setWalletConnected,
    walletInfo,
    setWalletInfo,
    isAdmin,
    setIsAdmin,
    currentUser,
    setCurrentUser,
    parts,
    transactions,
    shipments,
    vendors,
    updateUserData,
    addVendor,
    removeVendor,
    updateVendorRating,
    clearUserData,
    syncToDatabase,
    loadFromDatabase,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
