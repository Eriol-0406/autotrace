
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const chartConfig = {
  supply: {
    label: "Supply",
    color: "#3b82f6",
  },
  demand: {
    label: "Demand",
    color: "#f97316",
  },
};

interface TransactionVolumeChartProps {
    transactions: Transaction[];
}

export function TransactionVolumeChart({ transactions }: TransactionVolumeChartProps) {
  // Aggregate transactions by month for the current year
  const monthlyDataTemplate: Record<string, { month: string; supply: number; demand: number }> = {
    'Jan': { month: 'Jan', supply: 0, demand: 0 },
    'Feb': { month: 'Feb', supply: 0, demand: 0 },
    'Mar': { month: 'Mar', supply: 0, demand: 0 },
    'Apr': { month: 'Apr', supply: 0, demand: 0 },
    'May': { month: 'May', supply: 0, demand: 0 },
    'Jun': { month: 'Jun', supply: 0, demand: 0 },
    'Jul': { month: 'Jul', supply: 0, demand: 0 },
    'Aug': { month: 'Aug', supply: 0, demand: 0 },
    'Sep': { month: 'Sep', supply: 0, demand: 0 },
    'Oct': { month: 'Oct', supply: 0, demand: 0 },
    'Nov': { month: 'Nov', supply: 0, demand: 0 },
    'Dec': { month: 'Dec', supply: 0, demand: 0 },
  };

  const currentYear = new Date().getFullYear();

  const monthlyData = transactions.reduce((acc, tx) => {
    const txDate = new Date(tx.date);
    if (txDate.getFullYear() === currentYear) {
      const month = txDate.toLocaleString('default', { month: 'short' });
      if (acc[month]) {
        if (tx.type === 'supply') {
          acc[month].supply += tx.quantity;
        } else {
          acc[month].demand += tx.quantity;
        }
      }
    }
    return acc;
  }, monthlyDataTemplate);

  const chartData = Object.values(monthlyData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Volume</CardTitle>
        <CardDescription>
          Monthly supply vs. demand volume for {currentYear}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
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
              <Bar 
                dataKey="supply" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="demand" 
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No transaction data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
