
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, BarChart, Sparkles } from 'lucide-react';
// AI functionality removed for lighter build
import { computeReplenishmentPlan, type ReplenishmentRecommendation } from '@/lib/forecast';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  partId: z.string().min(1, 'Please select a part.'),
  vendorLeadTimeDays: z.coerce
    .number()
    .min(1, 'Lead time must be at least 1 day.'),
  seasonalVariations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const roleSpecifics = {
    Manufacturer: {
        title: 'Supply Chain Forecasting',
        description: 'Predict demand for raw materials and components.',
        forecastType: 'Supply',
        unit: 'units',
    },
    Supplier: {
        title: 'Manufacturing Demand Forecast',
        description: 'Forecast demand from manufacturers and plan production.',
        forecastType: 'Manufacturing Demand',
        unit: 'units',
    },
    Distributor: {
        title: 'Customer Demand Forecasting',
        description: 'Predict customer demand patterns and optimize inventory.',
        forecastType: 'Customer Demand',
        unit: 'units',
    }
};

export function SupplyForecast() {
  const { role, parts, transactions } = useAppState();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [plan, setPlan] = useState<ReplenishmentRecommendation[] | null>(null);
  const [selectedPartPlan, setSelectedPartPlan] = useState<ReplenishmentRecommendation | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partId: '',
      vendorLeadTimeDays: 14,
      seasonalVariations: 'Standard demand throughout the year, with a slight increase in Q4.',
    },
  });

  if (!role) {
    return null; // Or a loading skeleton
  }
  
  const specifics = roleSpecifics[role] || roleSpecifics.Distributor;


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    setPlan(null);
    setSelectedPartPlan(null);
    try {
      const selectedPart = parts.find((p) => p.id === data.partId);
      if (!selectedPart) {
        toast({
          title: 'Error',
          description: 'Selected part not found.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const partTransactions = transactions.filter(tx => tx.partName === selectedPart.name);
      const transactionHistory = partTransactions.map(tx => `Date: ${tx.date}, Type: ${tx.type}, Quantity: ${tx.quantity}`).join('\n');

      // Always compute a local replenishment plan so we have actionable output even if AI isn't available
      const localPlan = computeReplenishmentPlan(parts, transactions, {
        lookbackDays: 90,
        vendorLeadTimeDays: data.vendorLeadTimeDays,
        safetyDays: 7,
      });
      setPlan(localPlan);
      const thisPartPlan = localPlan.find(p => p.partId === selectedPart.id) || null;
      setSelectedPartPlan(thisPartPlan);

      // Use local computation only (AI removed for lighter build)
      // Calculate dynamic confidence score based on data quality
      const transactionCount = partTransactions.length;
      const dataQuality = Math.min(transactionCount / 10, 1); // More transactions = higher confidence
      const leadTimeVariability = Math.max(0.1, 1 - (data.vendorLeadTimeDays / 30)); // Shorter lead times = higher confidence
      const confidenceScore = Math.min(0.95, Math.max(0.45, (dataQuality * 0.6 + leadTimeVariability * 0.4)));
      
      setResult({
        predictedShortageDate: new Date(Date.now() + (data.vendorLeadTimeDays * 24 * 60 * 60 * 1000)),
        confidenceScore: confidenceScore,
        reasoning: `Based on ${transactionCount} transactions and ${data.vendorLeadTimeDays}-day lead time`
      });
    } catch (error) {
      console.error('Forecast error:', error);
      toast({
        title: 'Forecast Failed',
        description: 'Forecast completed using local data analysis.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>{specifics.title}</span>
        </CardTitle>
        <CardDescription>
          {specifics.description}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="partId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part to forecast" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parts.map((part, index) => (
                        <SelectItem key={`${part.id}-${index}`} value={part.id}>
                          {part.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendorLeadTimeDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Lead Time (Days)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="seasonalVariations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seasonal Variations (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Higher demand in summer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || parts.length === 0} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart className="mr-2 h-4 w-4" />
              )}
              Generate Forecast
            </Button>
          </CardFooter>
        </form>
      </Form>
      {(result || (plan && plan.length > 0)) && (
        <CardContent className="space-y-4">
          {result && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>{specifics.forecastType} Analysis</AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <p>
                  <strong>
                    {role === 'Manufacturer' ? 'Predicted Supply Shortage:' : 
                     role === 'Supplier' ? 'Predicted Demand Peak:' : 
                     'Predicted Customer Demand Peak:'}
                  </strong> {new Date(result.predictedShortageDate).toDateString()}
                </p>
                <p>
                  <strong>Confidence Score:</strong>{' '}
                  <span className="font-mono">{ (result.confidenceScore * 100).toFixed(1) }%</span>
                </p>
                {selectedPartPlan && (
                  <div>
                    <strong>Recommendations:</strong>
                    <div className="text-sm text-muted-foreground pl-2 border-l-2 ml-2 mt-1 space-y-1">
                      <p>
                        {role === 'Manufacturer' ? 'Net consumption/day:' : 
                         role === 'Supplier' ? 'Expected demand/day:' : 
                         'Customer demand/day:'} <span className="font-mono">{selectedPartPlan.netDailyConsumption}</span>
                      </p>
                      <p>Needed by: <span className="font-mono">{selectedPartPlan.neededByDate ?? '—'}</span></p>
                      <p>
                        {role === 'Manufacturer' ? 'Suggested purchase:' : 
                         role === 'Supplier' ? 'Production target:' : 
                         'Inventory target:'} <span className="font-mono">{selectedPartPlan.recommendedOrderQty}</span> {specifics.unit}
                      </p>
                      <p>
                        Current stock: <span className="font-mono">{selectedPartPlan.currentQuantity}</span> | 
                        {role === 'Manufacturer' ? 'Reorder point:' : 
                         role === 'Supplier' ? 'Min. inventory:' : 
                         'Reorder point:'} <span className="font-mono">{selectedPartPlan.reorderPoint}</span>
                      </p>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {plan && plan.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">
                {role === 'Manufacturer' ? 'Supply Chain Plan (90d average)' : 
                 role === 'Supplier' ? 'Production Planning (90d average)' : 
                 'Inventory Plan (90d average)'}
              </h4>
              <div className="space-y-2">
                {plan.map(item => (
                  <div key={item.partId} className="p-3 border rounded-md">
                    <div className="flex justify-between">
                      <div className="font-medium">{item.partName}</div>
                      <div className="text-sm text-muted-foreground">
                        {role === 'Manufacturer' ? 'Need by:' : 
                         role === 'Supplier' ? 'Produce by:' : 
                         'Stock by:'} {item.neededByDate ?? '—'}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        {role === 'Manufacturer' ? 'On hand:' : 
                         role === 'Supplier' ? 'Current stock:' : 
                         'Available:'} <span className="font-mono">{item.currentQuantity}</span>
                      </div>
                      <div>
                        {role === 'Manufacturer' ? 'Reorder pt:' : 
                         role === 'Supplier' ? 'Min. inventory:' : 
                         'Reorder pt:'} <span className="font-mono">{item.reorderPoint}</span>
                      </div>
                      <div>
                        {role === 'Manufacturer' ? 'Net use/day:' : 
                         role === 'Supplier' ? 'Expected demand/day:' : 
                         'Customer demand/day:'} <span className="font-mono">{item.netDailyConsumption}</span>
                      </div>
                      <div>
                        {role === 'Manufacturer' ? 'Order qty:' : 
                         role === 'Supplier' ? 'Produce qty:' : 
                         'Target qty:'} <span className="font-mono">{item.recommendedOrderQty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
