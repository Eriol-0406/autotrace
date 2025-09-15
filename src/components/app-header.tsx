
"use client";

import { useAppState } from '@/context/enhanced-app-state-provider';
import { useRouter } from 'next/navigation';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Users, Wallet, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import type { Role } from '@/lib/types';

export function AppHeader() {
  const { role, setLoggedIn, setRole, setWalletConnected, setWalletInfo, walletInfo, isAdmin, setIsAdmin } = useAppState();
  const router = useRouter();
  const { refreshWalletInfo } = useWallet();

  const handleLogout = () => {
    setLoggedIn(false);
    setRole(null);
    setWalletConnected(false);
    setWalletInfo(null);
    setIsAdmin(false);
    router.push('/login');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-lg font-semibold md:text-xl font-headline">AutoTrace</h1>
      <div className="ml-auto flex items-center gap-4">
        {/* Wallet Status Indicator */}
        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border">
            <Wallet className="h-4 w-4" />
            {walletInfo && walletInfo.isConnected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-mono">{formatAddress(walletInfo.address)}</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Not Connected</span>
              </>
            )}
          </div>
        )}
        
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">System Administrator</span>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://placehold.co/40x40.png?text=${role ? role.charAt(0) : 'U'}`} alt={role || 'User'} data-ai-hint="person avatar" />
                <AvatarFallback>{role ? role.charAt(0) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{isAdmin ? "Admin User" : role}</p>
              <p className="text-xs text-muted-foreground truncate">My Account</p>
              {!isAdmin && walletInfo && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="h-3 w-3" />
                    <span className="font-mono">{formatAddress(walletInfo.address)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Balance: {parseFloat(walletInfo.balance).toFixed(4)} ETH</span>
                    <button className="underline hover:no-underline" onClick={() => refreshWalletInfo()}>Refresh</button>
                  </div>
                </div>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
