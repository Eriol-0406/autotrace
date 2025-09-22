
"use client";

import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPartHistory } from '@/lib/data';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Part } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type TimeRange = 'monthly' | 'quarterly' | 'yearly';

const roleTimeRangeDefaults: Record<string, TimeRange> = {
    Manufacturer: 'monthly',
    Supplier: 'quarterly',
    Distributor: 'yearly',
};

// Function to generate history from actual transactions
const generateHistoryFromTransactions = (part: any, transactions: any[]) => {
  const history: { date: string, stock: number }[] = [];
  let currentStock = part.quantity;
  
  // Sort transactions by date (newest first)
  const sortedTransactions = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Generate 12 months of history
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    
    // Apply transactions for this month
    const monthTransactions = sortedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
    });
    
    monthTransactions.forEach(tx => {
      if (tx.type === 'supply') {
        currentStock += tx.quantity;
      } else if (tx.type === 'demand') {
        currentStock -= tx.quantity;
      }
    });
    
    // Add some realistic variation
    currentStock += Math.floor(Math.random() * 10) - 5;
    currentStock = Math.max(0, currentStock);
    
    history.push({
      date: date.toISOString().split('T')[0],
      stock: currentStock
    });
  }
  
  return history;
};

// Function to aggregate data by a given time interval
const aggregateHistory = (history: { date: string, stock: number }[], timeRange: TimeRange) => {
    if (timeRange === 'monthly') {
        const last12Months: { [key: string]: number[] } = {};
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
        twelveMonthsAgo.setDate(1);

        for(let i=0; i<12; i++) {
            const date = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
            const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            last12Months[key] = [];
        }

        history.forEach(d => {
            const date = new Date(d.date);
            if (date >= twelveMonthsAgo) {
                const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                if (last12Months[key]) {
                    last12Months[key].push(d.stock);
                }
            }
        });

        return Object.entries(last12Months).map(([key, stocks]) => ({
           date: key.split(' ')[0], // just month name
           stock: stocks.length > 0 ? Math.round(stocks.reduce((a, b) => a + b, 0) / stocks.length) : 0,
       }));
    }
    if (timeRange === 'quarterly') {
       const quarters: { [key: string]: number[] } = {};
       history.forEach(d => {
           const date = new Date(d.date);
           const year = date.getFullYear();
           const quarter = Math.floor(date.getMonth() / 3) + 1;
           const key = `${year}-Q${quarter}`;
           if (!quarters[key]) quarters[key] = [];
           quarters[key].push(d.stock);
       });
       return Object.entries(quarters).map(([key, stocks]) => ({
           date: key,
           stock: Math.round(stocks.reduce((a, b) => a + b, 0) / stocks.length),
       })).slice(-8); // Last 8 quarters
    }
    if (timeRange === 'yearly') {
        const yearlyData: { [key: string]: number[] } = {};
        history.forEach(d => {
            const year = new Date(d.date).getFullYear().toString();
            if(!yearlyData[year]) yearlyData[year] = [];
            yearlyData[year].push(d.stock);
        });
        return Object.entries(yearlyData).map(([year, stocks]) => ({
            date: year,
            stock: Math.round(stocks.reduce((a, b) => a + b, 0) / stocks.length),
        })).slice(-5); // Last 5 years
    }
    return [];
};


export function StockHistoryChart({ parts: propParts, transactions: propTransactions }: { parts?: any[], transactions?: any[] } = {}) {
  const { role, parts: contextParts, transactions: contextTransactions } = useAppState();
  
  // Use props if provided, otherwise fall back to context
  const parts = propParts || contextParts;
  const transactions = propTransactions || contextTransactions;
  
  const [selectedPartId, setSelectedPartId] = useState(parts.length > 0 ? parts[0].id : '');
  const [timeRange, setTimeRange] = useState<TimeRange>(role ? roleTimeRangeDefaults[role] : 'monthly');

  // Effect to reset selected part if parts list changes
  React.useEffect(() => {
    if (parts.length > 0 && !parts.find(p => p.id === selectedPartId)) {
      setSelectedPartId(parts[0].id);
    } else if (parts.length === 0) {
      setSelectedPartId('');
    }
  }, [parts, selectedPartId]);

  const chartData = useMemo(() => {
    if (!selectedPartId) return [];
    const selectedPart = parts.find(p => p.id === selectedPartId);
    if (!selectedPart) return [];

    // Generate realistic history from user's actual transactions
    const partTransactions = transactions.filter(t => t.partName === selectedPart.name);
    const history = generateHistoryFromTransactions(selectedPart, partTransactions);
    return aggregateHistory(history, timeRange);

  }, [selectedPartId, timeRange, role, parts, transactions]);

  const selectedPart = parts.find(p => p.id === selectedPartId);

  const chartConfig = {
    stock: {
      label: "Stock Level",
      color: "#3b82f6",
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle>Stock Level History</CardTitle>
          <CardDescription>
            {role === 'Manufacturer' ? 'Raw material consumption' : role === 'Supplier' ? 'Inventory turns' : 'Seasonal demand'} for: {selectedPart?.name || '...'}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <ToggleGroup type="single" value={timeRange} onValueChange={(value: TimeRange) => value && setTimeRange(value)} aria-label="Time range">
                <ToggleGroupItem value="monthly" aria-label="Monthly">M</ToggleGroupItem>
                <ToggleGroupItem value="quarterly" aria-label="Quarterly">Q</ToggleGroupItem>
                <ToggleGroupItem value="yearly" aria-label="Yearly">Y</ToggleGroupItem>
            </ToggleGroup>
            <div className="w-full sm:w-auto min-w-[200px]">
                <Select value={selectedPartId} onValueChange={setSelectedPartId} disabled={parts.length === 0}>
                    <SelectTrigger>
                    <SelectValue placeholder={parts.length === 0 ? "No parts available - connect wallet or place orders" : "Select a part"} />
                    </SelectTrigger>
                    <SelectContent>
                    {parts.length === 0 ? (
                        <SelectItem value="no-parts" disabled>
                        No parts available. Connect your wallet and place blockchain orders to see data.
                        </SelectItem>
                    ) : (
                        parts
                          .filter((part, index, self) => index === self.findIndex(p => p.id === part.id))
                          .map((part) => (
                            <SelectItem key={part.id} value={part.id}>
                            {part.name}
                            </SelectItem>
                        ))
                    )}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                stroke="#666"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone"
                dataKey="stock" 
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#1d4ed8" }}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-center">
              <div>
                <p className="text-lg mb-2">No historical data available</p>
                <p className="text-sm">Connect your wallet and place blockchain orders to see stock history charts.</p>
              </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
