
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Boxes, FileText, Handshake, LayoutDashboard, Truck, Link as LinkIcon, Shield, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppState } from '@/context/enhanced-app-state-provider';

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
  >
    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10a1 1 0 0 1 1 1v11" />
    <path d="M14 9h7c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1h-7" />
    <path d="M14 9l-4.5 4.5" />
    <path d="M9.5 13.5L6 17" />
  </svg>
);

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/blockchain', label: 'Blockchain', icon: LinkIcon },
  { href: '/vendors', label: 'Vendors', icon: Handshake },
  { href: '/tracking', label: 'Tracking', icon: Truck },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAppState();

  const isActive = (href: string) => {
    return pathname === href;
  };

  // Admin menu items
  const adminMenuItems = [
    { href: '/admin/transactions', label: 'Transaction Approval', icon: Shield },
    { href: '/admin/entities', label: 'Entity Management', icon: Building },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r">
      <SidebarHeader className="flex items-center gap-2 p-4">
        <Logo />
        <span className="text-lg font-semibold font-headline">AutoTrace</span>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="mt-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                  className={cn("text-base py-3 px-4", isActive(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                >
                  <Link href={item.href} prefetch={false}>
                    <item.icon className="h-6 w-6" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {/* Admin Section */}
          {isAdmin && (
            <>
              <SidebarSeparator className="my-4" />
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Admin
                </span>
              </div>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className={cn("text-base py-3 px-4", isActive(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
                  >
                    <Link href={item.href} prefetch={false}>
                      <item.icon className="h-6 w-6" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
