
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
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
import type { Part, Transaction } from '@/lib/types';
import { useAppState } from '@/context/app-state-provider';

const chartConfig = {
  turnover: {
    label: "Turnover Rate",
    color: "hsl(var(--chart-2))",
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
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="partName"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '10px' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip
                cursor={true}
                content={<ChartTooltipContent formatter={(value, name) => `${value}`} />}
              />
              <Bar
                dataKey="turnover"
                fill="var(--color-turnover)"
                radius={4}
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
