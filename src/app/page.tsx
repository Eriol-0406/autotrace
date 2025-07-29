
"use client";

import { AppLayout } from '@/components/app-layout';
import { Boxes, Package, AlertCircle, ArrowDownUp, Factory, Building, Truck } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { StockAlerts } from '@/components/dashboard/stock-alerts';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { SupplyForecast } from '@/components/dashboard/supply-forecast';
import { getDataForRole } from '@/lib/data';
import { useAppState } from '@/context/app-state-provider';
import DashboardPage from './dashboard/page';

export default function Home() {
    return <DashboardPage />;
}
