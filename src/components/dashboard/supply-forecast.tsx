
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
import { forecastSupply, type ForecastSupplyOutput } from '@/ai/flows/forecast-supply';
import { useAppState } from '@/context/app-state-provider';
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
        title: 'Demand Forecasting',
        description: 'Predict demand for finished goods.',
    },
    Supplier: {
        title: 'Lead Time Risk',
        description: 'Forecast potential delays from manufacturers.',
    },
    Distributor: {
        title: 'Customer Demand Trends',
        description: 'Predict future customer demand for parts.',
    }
};

export function SupplyForecast() {
  const { role, parts, transactions } = useAppState();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ForecastSupplyOutput | null>(null);
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

      const forecastResult = await forecastSupply({
        partName: selectedPart.name,
        transactionHistory: transactionHistory || 'No recent transactions.',
        seasonalVariations: data.seasonalVariations || 'None specified.',
        vendorLeadTimeDays: data.vendorLeadTimeDays,
      });
      setResult(forecastResult);
    } catch (error) {
      console.error('Forecast error:', error);
      toast({
        title: 'Forecast Failed',
        description: 'Could not generate supply forecast. Please try again.',
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part to forecast" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
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
      {result && (
        <CardContent>
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Forecast Result</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
               <p>
                <strong>Predicted Shortage Date:</strong> {new Date(result.predictedShortageDate).toDateString()}
              </p>
              <p>
                <strong>Confidence Score:</strong>{' '}
                <span className="font-mono">{ (result.confidenceScore * 100).toFixed(1) }%</span>
              </p>
              <div>
                <strong>Recommendations:</strong>
                <p className="text-sm text-muted-foreground pl-2 border-l-2 ml-2 mt-1">
                  {result.recommendations}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
}
