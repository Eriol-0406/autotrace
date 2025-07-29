
"use client";

import { useAppState } from '@/context/app-state-provider';
import { AppLayout } from '@/components/app-layout';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default function DashboardPage() {
  const { isAdmin, role } = useAppState();

  if (!role) {
    return (
        <AppLayout>
            <div className="flex items-center justify-center h-full">
                <p>Loading data...</p>
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
        <div className="flex flex-col gap-8">
            {isAdmin ? <AdminDashboard /> : <ClientDashboard />}
        </div>
    </AppLayout>
  );
}
