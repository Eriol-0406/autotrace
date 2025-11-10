"use client";

import { AppLayout } from '@/components/app-layout';
import { AdminUserManagement } from '@/components/admin/admin-user-management';
import { useAppState } from '@/context/enhanced-app-state-provider';

export default function AdminUsersPage() {
  const { isAdmin } = useAppState();

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access this page.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AdminUserManagement />
    </AppLayout>
  );
}

