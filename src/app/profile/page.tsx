"use client";

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/context/enhanced-app-state-provider';

export default function ProfilePage() {
  const { currentUser, role } = useAppState();

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-medium">{currentUser?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-medium">{currentUser?.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="text-lg font-medium">{role || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
