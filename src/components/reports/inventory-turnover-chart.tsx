
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Part, Transaction } from '@/lib/types';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  turnover: {
    label: "Turnover Rate",
    color: "#10b981",
  },
};

interface InventoryTurnoverChartProps {
    parts: Part[];
    transactions: Transaction[];
}

export function InventoryTurnoverChart({ parts, transactions }: InventoryTurnoverChartProps) {
  const chartData = parts.map(part => {
    const demand = transactions
      .filter(t => t.partName === part.name && t.type === 'demand')
      .reduce((sum, t) => sum + t.quantity, 0);
    const avgInventory = (part.maxStock + part.quantity) / 2;
    const turnover = avgInventory > 0 ? demand / avgInventory : 0;
    return {
      partName: part.name,
      turnover: parseFloat(turnover.toFixed(2)),
    };
  }).slice(0, 10); // Limit to 10 parts to avoid clutter

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Turnover Rate</CardTitle>
        <CardDescription>
          How many times inventory is sold or used in a time period.
        </CardDescription>
      </CardHeader>
      <CardContent>
       {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                stroke="#666"
              />
              <YAxis 
                type="category"
                dataKey="partName" 
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={120}
                stroke="#666"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="turnover" 
                fill="#10b981"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No turnover data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
