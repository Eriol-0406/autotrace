
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loggedIn, role, walletConnected, isAdmin } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!loggedIn) {
      router.replace('/login');
      return;
    }
    
    // Admin can bypass onboarding
    if (isAdmin) return;

    if (!role) {
      router.replace('/onboarding/role');
    } else if (!walletConnected) {
      router.replace('/onboarding/wallet');
    }
  }, [loggedIn, role, walletConnected, isAdmin, router]);

  // For regular users, show loading while redirecting
  if (!isAdmin && (!loggedIn || !role || !walletConnected)) {
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
