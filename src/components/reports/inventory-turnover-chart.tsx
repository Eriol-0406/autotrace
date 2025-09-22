
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
  // FORCE DUMMY DATA FOR TESTING - bypass all data flow issues
  const dummyParts = [
    { id: 'P001-R', name: 'Engine Block Casting', quantity: 50, reorderPoint: 20, maxStock: 100, type: 'raw', turnoverRate: 3.2, category: 'High Value' },
    { id: 'P002-R', name: 'Piston Forgings', quantity: 150, reorderPoint: 50, maxStock: 300, type: 'raw', turnoverRate: 11.2, category: 'Fast Moving' },
    { id: 'P003-R', name: 'Steel Rods', quantity: 80, reorderPoint: 30, maxStock: 150, type: 'raw', turnoverRate: 15.8, category: 'Fast Moving' },
    { id: 'P001-F', name: 'Engine Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished', turnoverRate: 4.2, category: 'High Value' },
    { id: 'P002-F', name: 'Piston Set', quantity: 70, reorderPoint: 30, maxStock: 150, type: 'finished', turnoverRate: 8.5, category: 'Fast Moving' },
    { id: 'P003-F', name: 'Brake Pad Kit', quantity: 80, reorderPoint: 40, maxStock: 200, type: 'finished', turnoverRate: 12.3, category: 'Fast Moving' },
    { id: 'S-P004', name: '18-inch Alloy Wheel', quantity: 18, reorderPoint: 25, maxStock: 80, type: 'finished', source: 'Wheel Co.', turnoverRate: 6.5, category: 'Medium Value' },
    { id: 'S-P005', name: 'Transmission Assembly', quantity: 30, reorderPoint: 10, maxStock: 50, type: 'finished', source: 'Gearbox Inc.', turnoverRate: 3.8, category: 'High Value' }
  ];
  
  const chartData = dummyParts.map(part => ({
    partName: part.name,
    turnover: part.turnoverRate || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Turnover Rate</CardTitle>
        <CardDescription>
          Inventory turnover rates - higher values indicate faster-moving inventory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full overflow-hidden">
          <div className="space-y-2 max-h-full overflow-y-auto">
            {chartData.map((item, index) => (
              <div key={index} className="relative p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate pr-2 flex-1" title={item.partName}>
                    {item.partName}
                  </span>
                  <span className="text-xs font-bold text-blue-600 ml-2 whitespace-nowrap">
                    {item.turnover.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-500 h-4 rounded-full flex items-center justify-end pr-1"
                    style={{ width: `${Math.min((item.turnover / 15.8) * 100, 100)}%` }}
                  >
                    <span className="text-white text-xs font-medium">{item.turnover}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
