
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';

export function AppLayout({ children, allowUnauthenticated = false }: { children: React.ReactNode, allowUnauthenticated?: boolean }) {
  const { loggedIn, role, walletConnected, isAdmin } = useAppState();
  const router = useRouter();

  useEffect(() => {
    // Skip auth checks if explicitly allowed
    if (allowUnauthenticated) return;
    
    if (!loggedIn) {
      router.replace('/login');
      return;
    }
    
    // Admin can bypass onboarding
    if (isAdmin) return;

    // Only redirect to role selection if user has no role
    if (!role) {
      router.replace('/onboarding/role');
    }
    // Wallet connection is optional - users can skip it and still use the system
    // else if (!walletConnected) {
    //   router.replace('/onboarding/wallet');
    // }
  }, [loggedIn, role, walletConnected, isAdmin, router, allowUnauthenticated]);

  // For regular users, show loading while redirecting (unless unauthenticated access is allowed)
  if (!allowUnauthenticated && !isAdmin && (!loggedIn || !role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Render for admin or fully onboarded user
  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AppSidebar />
        <div className="flex flex-col">
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
