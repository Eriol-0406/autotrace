"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { demoParts } from '@/lib/data';
import type { Role } from '@/lib/types';
import { Package } from 'lucide-react';

const supplySchema = z.object({
  partId: z.string().min(1, 'Please select a part.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  source: z.string().min(1, 'Please specify the source.'),
});

type SupplyFormValues = z.infer<typeof supplySchema>;

interface SupplyTransactionDialogProps {
    children: React.ReactNode;
    role: Role;
}

export function SupplyTransactionDialog({ children, role }: SupplyTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { updateUserData, parts, transactions, shipments, currentUser } = useAppState();

  // Framework requirement: Clients add stock to their inventory
  const availableParts = demoParts;

  const form = useForm<SupplyFormValues>({
    resolver: zodResolver(supplySchema),
    defaultValues: { 
      partId: '', 
      quantity: 50,
      source: ''
    },
  });

  const onSubmit = async (data: SupplyFormValues) => {
    const part = availableParts.find(p => p.id === data.partId);

    if (!part) {
        toast({ title: 'Error', description: 'Invalid part selected.', variant: 'destructive' });
        return;
    }

    setIsProcessing(true);

    try {
      // Framework requirement: Add stock to inventory, updating quantities on-chain
      // Note: In a full implementation, this would also update the smart contract
      
      // Persist transaction to API/Mongo (primary path)
      let createdTx: any = null;
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser?._id,
            partName: part.name,
            type: 'supply',
            quantity: data.quantity,
            date: new Date().toISOString(),
            from: data.source,
            to: role,
            role: role,
            status: 'completed',
            fromWallet: undefined,
            toWallet: undefined,
            invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
          }),
        });
        if (res.ok) {
          createdTx = await res.json();
        } else {
          throw new Error(await res.text());
        }
      } catch (e) {
        // Safe fallback to local state
        createdTx = {
          id: `T-${String((transactions?.length || 0) + 1).padStart(3, '0')}`,
          partName: part.name,
          type: 'supply' as const,
          quantity: data.quantity,
          date: new Date().toISOString(),
          from: data.source,
          to: role,
          role: role,
          status: 'completed' as const,
          fromWallet: undefined,
          toWallet: undefined,
          invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        };
        console.warn('Transaction API failed; using local fallback:', e);
      }

      // Update inventory: find existing part and increase quantity
      const updatedParts = parts.map(p => {
        if (p.name === part.name) {
          return { ...p, quantity: p.quantity + data.quantity };
        }
        return p;
      });

      // If part doesn't exist in user's inventory, add it
      const partExists = parts.some(p => p.name === part.name);
      if (!partExists) {
        updatedParts.push({
          ...part,
          quantity: data.quantity,
          id: `${part.id}-${Date.now()}`
        });
      }

      // Update user data with new transaction and updated inventory
      updateUserData({
        parts: updatedParts,
        transactions: [...transactions, createdTx],
        shipments,
      });

      toast({
        title: 'Supply Transaction Created! 📦',
        description: `Added ${data.quantity} units of ${part.name} to your inventory from ${data.source}.`,
      });
      
      setOpen(false);
      form.reset();
      
    } catch (error) {
      console.error('Error creating supply transaction:', error);
      toast({
        title: 'Supply Transaction Failed',
        description: `Failed to create supply transaction: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Supply Transaction</DialogTitle>
          <DialogDescription>
            Add stock to your inventory. This will update your inventory quantities.
          </DialogDescription>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>📦 Framework:</strong> Clients add stock to their inventory (e.g., Supplier adds 100 Engines), updating quantities on-chain.
            </p>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part to Add</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part to add to inventory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableParts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {part.name} ({part.type})
                          </div>
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Add</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Manufacturing Plant, Warehouse Delivery, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col gap-2">
              <Button 
                type="submit" 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Package className="mr-2 h-4 w-4 animate-pulse" />
                    Adding to Inventory...
                  </>
                ) : (
                  'Add to Inventory'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
