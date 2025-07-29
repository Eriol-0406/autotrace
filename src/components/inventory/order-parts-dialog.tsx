
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
import { getVendorsForRole, placeOrder, demoParts } from '@/lib/data';
import type { Role, Vendor, Part } from '@/lib/types';
import { useAppState } from '@/context/app-state-provider';

const orderSchema = z.object({
  vendorId: z.string().min(1, 'Please select a vendor.'),
  partId: z.string().min(1, 'Please select a part.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderPartsDialogProps {
    children: React.ReactNode;
    role: Role;
}

const roleOrderContext: Record<Role, { vendorRole: 'vendor' | 'customer'; orderablePartsRole: Role }> = {
    Manufacturer: { vendorRole: 'vendor', orderablePartsRole: 'Supplier' }, // Manuf. orders raw materials from suppliers
    Supplier: { vendorRole: 'vendor', orderablePartsRole: 'Manufacturer' }, // Supplier orders finished goods from manuf.
    Distributor: { vendorRole: 'vendor', orderablePartsRole: 'Supplier' }, // Distributor orders stock from suppliers
};

export function OrderPartsDialog({ children, role }: OrderPartsDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { parts, transactions, shipments, vendors, updateUserData } = useAppState();

  const { vendors: availableVendors } = getVendorsForRole(role, vendors);
  
  // Determine which parts are orderable based on the current role's vendors
  // For this demo, we'll assume they can order any "finished" good from the demo data
  // In a real app, this would be determined by the selected vendor's actual catalog
  const orderableParts = demoParts.filter(p => p.type === 'finished' || p.type === 'raw');


  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { vendorId: '', partId: '', quantity: 100 },
  });

  const onSubmit = (data: OrderFormValues) => {
    const vendor = availableVendors.find(v => v.id === data.vendorId);
    // Find part from demo data as that's our "master catalog"
    const partToOrder = demoParts.find(p => p.id === data.partId);

    if (!vendor || !partToOrder) {
        toast({ title: 'Error', description: 'Invalid vendor or part selected.', variant: 'destructive' });
        return;
    }
    
    // Simulate placing the order
    const result = placeOrder({
        fromRole: role,
        toVendor: vendor,
        part: partToOrder,
        quantity: data.quantity
    }, { parts, transactions, shipments });

    if(result.success) {
      updateUserData(result.updatedData);
      toast({
        title: 'Order Placed!',
        description: `Your order for ${data.quantity} units of ${partToOrder.name} from ${vendor.name} has been placed. Track it on the tracking page.`,
      });
    }
    
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Parts</DialogTitle>
          <DialogDescription>
            Place a new order with one of your vendors.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.category})
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
              name="partId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part to order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {orderableParts.map((part) => (
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                Place Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
