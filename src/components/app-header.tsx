
"use client";

import { useAppState } from '@/context/app-state-provider';
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Users } from 'lucide-react';
import type { Role } from '@/lib/types';

export function AppHeader() {
  const { role, setLoggedIn, setRole, setWalletConnected, isAdmin, setIsAdmin } = useAppState();
  const router = useRouter();

  const handleLogout = () => {
    setLoggedIn(false);
    setRole(null);
    setWalletConnected(false);
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-lg font-semibold md:text-xl font-headline">AutoTrace</h1>
      <div className="ml-auto flex items-center gap-4">
        {isAdmin && (
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{role}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={role || ''} onValueChange={(value) => setRole(value as Role)}>
                <DropdownMenuRadioItem value="Manufacturer">Manufacturer</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Supplier">Supplier</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Distributor">Distributor</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
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
