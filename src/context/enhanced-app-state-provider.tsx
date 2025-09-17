"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Role, Part, Transaction, Shipment, Vendor } from '@/lib/types';
import { allVendors } from '@/lib/data';
import type { WalletInfo } from '@/lib/web3-wallet';
import { web3WalletService } from '@/lib/web3-wallet';
import { databaseService, type DatabaseUser } from '@/lib/database';
import { unifiedDataService } from '@/lib/unified-data-service';
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
  updateVendor: (vendor: Vendor) => void;
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
    localStorage.removeItem('authState'); // Keep auth state for session persistence
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

  // Real-time sync subscription
  useEffect(() => {
    const unsubscribe = unifiedDataService.subscribeToDataChanges(() => {
      console.log('🔄 Data changed, refreshing...');
      if (isAdmin) {
        // Reload admin system data
        const loadAdminData = async () => {
          try {
            const systemData = await unifiedDataService.getSystemData();
            setParts(systemData.parts);
            setTransactions(systemData.transactions);
            setShipments(systemData.shipments);
            setVendors(systemData.vendors);
            console.log('✅ Admin data refreshed via real-time sync');
          } catch (error) {
            console.error('❌ Error refreshing admin data:', error);
          }
        };
        loadAdminData();
      } else if (loggedIn && currentUser) {
        // Reload user data
        loadFromDatabase();
      }
    });

    return unsubscribe;
  }, [isAdmin, loggedIn, currentUser]);

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
      // Use unified data service to update user data
      await unifiedDataService.updateUserData(currentUser._id, {
        parts,
        transactions,
        shipments
      });

      console.log('✅ Data synced to database via unified data service');
    } catch (error) {
      console.error('❌ Error syncing to database via unified data service:', error);
    }
  };

  const loadFromDatabase = async () => {
    if (!currentUser) return;
    
    try {
      // Use unified data service to get user-specific data
      const userData = await unifiedDataService.getUserData(currentUser._id);
      
      setParts(userData.parts);
      setTransactions(userData.transactions);
      setShipments(userData.shipments);
      setVendors(userData.vendors);

      console.log('✅ Data loaded from unified data service');
    } catch (error) {
      console.error('❌ Error loading from unified data service:', error);
      // No fallback - rely on unified data service only
      setParts([]);
      setTransactions([]);
      setShipments([]);
      setVendors([]);
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

    // Sync to database instead of localStorage
    if (currentUser && !isAdmin) {
      syncToDatabase();
    }
  };

  const addVendor = async (vendor: Vendor) => {
    // Refresh vendors from database after adding (since vendors are system-wide)
    await loadVendorsFromDatabase();
  };

  const updateVendor = async (updatedVendor: Vendor) => {
    const updatedVendors = vendors.map(v => 
      v.id === updatedVendor.id ? updatedVendor : v
    );
    setVendors(updatedVendors);
    // Also refresh from database to ensure consistency
    setTimeout(async () => await loadVendorsFromDatabase(), 100);
  };

  const removeVendor = async (vendorId: string) => {
    const updatedVendors = vendors.filter(v => v.id !== vendorId);
    setVendors(updatedVendors);
    // Refresh from database after removal
    setTimeout(async () => await loadVendorsFromDatabase(), 100);
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
        // Check if user prefers manual wallet selection every time
        const forceManualSelection = localStorage.getItem('forceManualWalletSelection') === 'true';
        
        const walletInfo = await web3WalletService.reconnectIfAuthorized(forceManualSelection);
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
    
    const loadData = async () => {
      // Admin always sees the full system data set
      if (isAdmin) {
        try {
          // Use unified data service to get system-wide data
          const systemData = await unifiedDataService.getSystemData();
          
          setParts(systemData.parts);
          setTransactions(systemData.transactions);
          setShipments(systemData.shipments);
          setVendors(systemData.vendors);
          
          console.log('✅ Admin data loaded from unified data service');
        } catch (error) {
          console.error('❌ Error loading admin data from unified service:', error);
          // No fallback - rely on unified data service only
          setParts([]);
          setTransactions([]);
          setShipments([]);
          setVendors([]);
        }
      } else if (loggedIn && currentUser) {
          // Load from database using unified data service
          await loadFromDatabase();
      } else {
          // Logged out, clear user-specific data but keep vendors for browsing
          console.log('👤 Not logged in - clearing user data but keeping vendors for browsing');
          setParts([]);
          setTransactions([]);
          setShipments([]);
          // Load vendors so users can browse them even when not logged in
          await loadVendorsFromDatabase();
      }
    };

    loadData();
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
    updateVendor,
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
