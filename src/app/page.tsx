
"use client";

import { redirect } from 'next/navigation';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { useEffect } from 'react';

export default function Home() {
    const { isAuthenticated, isInitialized } = useAppState();

    useEffect(() => {
        // Wait for auth state to be initialized before redirecting
        if (isInitialized) {
            if (!isAuthenticated) {
                redirect('/login');
            } else {
                redirect('/dashboard');
            }
        }
    }, [isAuthenticated, isInitialized]);

    // Show loading state while initializing
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return null;
}
