
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Transaction } from '@/lib/types';
import { useAppState } from '@/context/app-state-provider';

const chartConfig = {
  supply: {
    label: "Supply",
    color: "hsl(var(--chart-1))",
  },
  demand: {
    label: "Demand",
    color: "hsl(var(--chart-2))",
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
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Legend />
              <Bar
                dataKey="supply"
                stackId="a"
                fill="var(--color-supply)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="demand"
                stackId="a"
                fill="var(--color-demand)"
                radius={[4, 4, 0, 0]}
              />
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
