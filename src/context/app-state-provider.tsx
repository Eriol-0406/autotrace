
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Role, Part, Transaction, Shipment, Vendor } from '@/lib/types';
import { demoParts, demoTransactions, demoShipments, allVendors, getDataForRole } from '@/lib/data';
import type { WalletInfo } from '@/lib/web3-wallet';
import { web3WalletService } from '@/lib/web3-wallet';

interface AppStateContextType {
  loggedIn: boolean;
  setLoggedIn: (loggedIn: boolean) => void;
  isAuthenticated: boolean;
  role: Role | null;
  setRole: (role: Role | null) => void;
  walletConnected: boolean;
  setWalletConnected: (connected: boolean) => void;
  walletInfo: WalletInfo | null;
  setWalletInfo: (walletInfo: WalletInfo | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;

  parts: Part[];
  transactions: Transaction[];
  shipments: Shipment[];
  vendors: Vendor[];
  updateUserData: (data: { parts?: Part[], transactions?: Transaction[], shipments?: Shipment[] }) => void;
  addVendor: (vendor: Vendor) => void;
  removeVendor: (vendorId: string) => void;
  updateVendorRating: (vendorId: string, rating: number) => void;
  clearUserData: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  // Auth state
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
    localStorage.removeItem('userAppData');
  };

  const persistFullState = (state: { parts: Part[], transactions: Transaction[], shipments: Shipment[], vendors: Vendor[] }) => {
    setParts(state.parts);
    setTransactions(state.transactions);
    setShipments(state.shipments);
    setVendors(state.vendors);

    // Only persist data for non-admin users
    if (!isAdmin) {
      localStorage.setItem('userAppData', JSON.stringify(state));
    }
  };

  const addVendor = (vendor: Vendor) => {
    const updatedVendors = [vendor, ...vendors];
    persistFullState({ parts, transactions, shipments, vendors: updatedVendors });
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
    const newState = {
        parts: data.parts ?? parts,
        transactions: data.transactions ?? transactions,
        shipments: data.shipments ?? shipments,
        vendors: vendors,
    };
    persistFullState(newState);
  };


  useEffect(() => {
    // Persist auth state to localStorage to handle page reloads
    try {
      const storedState = localStorage.getItem('appState');
      if (storedState) {
        const { loggedIn, role, walletConnected, walletInfo, isAdmin } = JSON.parse(storedState);
        setLoggedIn(loggedIn || false);
        setRole(role || null);
        setWalletConnected(walletConnected || false);
        setWalletInfo(walletInfo || null);
        setIsAdmin(isAdmin || false);
      }
    } catch (error) {
        console.error("Could not parse app state from localStorage", error)
    }
  }, []);

  // On mount, if a wallet is already authorized in the browser, refresh live info
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const info = await web3WalletService.reconnectIfAuthorized();
        if (!cancelled && info) {
          setWalletInfo(info);
          setWalletConnected(true);
        }
      } catch (error) {
        // no-op; stay with whatever is in storage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // When auth state changes, load the appropriate data
    const authState = { loggedIn, role, walletConnected, walletInfo, isAdmin };
    localStorage.setItem('appState', JSON.stringify(authState));
    
    // Admin always sees the full demo data set
    if (isAdmin) {
        setParts(demoParts);
        setTransactions(demoTransactions);
        setShipments(demoShipments);
        setVendors(allVendors);
    } else if (loggedIn) {
        // Regular users get data from local storage
        try {
            const storedData = localStorage.getItem('userAppData');
            if(storedData) {
                const { parts, transactions, shipments, vendors } = JSON.parse(storedData);
                setParts(parts || []);
                setTransactions(transactions || []);
                setShipments(shipments || []);
                // Ensure vendors are always available, even for existing users
                setVendors(vendors && vendors.length > 0 ? vendors : allVendors.filter(v => v.relationshipType === 'vendor'));
            } else {
                // New user: seed with role-specific demo data so features like forecasting have choices
                const seeded = getDataForRole(role || 'Distributor', '', undefined, false);
                setParts(seeded.parts);
                setTransactions(seeded.transactions);
                setShipments(seeded.shipments);
                // New users should see the list of available vendors to order from.
                setVendors(allVendors.filter(v => v.relationshipType === 'vendor'));
            }
        } catch (error) {
            console.error("Could not parse user app data from localStorage", error);
            clearUserData();
        }
    } else {
        // Logged out, clear all data
        clearUserData();
    }
  }, [loggedIn, role, walletConnected, walletInfo, isAdmin]);

  // Auto-refresh wallet info every 10 seconds when connected
  useEffect(() => {
    if (!walletConnected) return;
    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const info = await web3WalletService.getWalletInfo();
        if (!cancelled && info) {
          setWalletInfo(info);
        }
      } catch {
        // ignore transient errors
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [walletConnected, setWalletInfo]);

  return (
    <AppStateContext.Provider value={{ 
        loggedIn, setLoggedIn, 
        isAuthenticated: loggedIn,
        role, setRole, 
        walletConnected, setWalletConnected,
        walletInfo, setWalletInfo,
        isAdmin, setIsAdmin,
        parts,
        transactions,
        shipments,
        vendors,
        updateUserData,
        addVendor,
        removeVendor,
        updateVendorRating,
        clearUserData,
    }}>
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
