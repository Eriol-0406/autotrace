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
import { smartContractService } from '@/lib/smart-contract';
import { demoParts } from '@/lib/data';
import type { Role, Vendor } from '@/lib/types';
import { ExternalLink, Loader2, ShoppingCart } from 'lucide-react';

const orderSchema = z.object({
  partId: z.string().min(1, 'Please select a part.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface VendorOrderDialogProps {
    children: React.ReactNode;
    vendor: Vendor;
    role: Role;
}

export function VendorOrderDialog({ children, vendor, role }: VendorOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blockchainTx, setBlockchainTx] = useState<{txHash: string; etherscanUrl: string} | null>(null);
  const { toast } = useToast();
  const { walletConnected, updateUserData, parts, transactions, shipments } = useAppState();

  // Framework requirement: Create orders to vendors for parts
  const availableParts = vendor.suppliedParts && vendor.suppliedParts.length > 0 
    ? vendor.suppliedParts 
    : demoParts.filter(p => p.type === 'finished' || p.type === 'raw');

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { 
      partId: '', 
      quantity: 50
    },
  });

  const onSubmit = async (data: OrderFormValues) => {
    const part = availableParts.find(p => p.id === data.partId);

    if (!part) {
        toast({ title: 'Error', description: 'Invalid part selected.', variant: 'destructive' });
        return;
    }

    if (!walletConnected) {
        toast({ 
          title: 'Wallet Not Connected', 
          description: 'Please connect your Web3 wallet to place orders.', 
          variant: 'destructive' 
        });
        return;
    }

    setIsProcessing(true);
    setBlockchainTx(null);

    try {
      // Framework requirement: Create orders to vendors, recorded as transactions
      const blockchainResult = await smartContractService.createOrder(
        vendor.walletAddress || '0x0000000000000000000000000000000000000000',
        part.name,
        data.quantity
      );

      // ✅ Only proceed if blockchain transaction succeeded
      setBlockchainTx({
        txHash: blockchainResult.txHash,
        etherscanUrl: blockchainResult.etherscanUrl
      });

      // Create local transaction record ONLY after blockchain success
      const newTransaction = {
        id: `T-${String(Math.floor(Math.random() * 900) + 100)}`,
        partName: part.name,
        type: 'demand' as const,
        quantity: data.quantity,
        date: new Date().toISOString().split('T')[0],
        from: role,
        to: vendor.name,
        role: role,
        status: 'pending' as const,
        fromWallet: undefined, // Will be filled by current user's wallet
        toWallet: vendor.walletAddress,
        invoiceNumber: `INV-2024-${Date.now().toString().slice(-6)}`,
        blockchainOrderId: blockchainResult.orderId,
        blockchainTxHash: blockchainResult.txHash,
        etherscanUrl: blockchainResult.etherscanUrl
      };

      // Update user data ONLY after blockchain success
      updateUserData({
        parts,
        transactions: [...transactions, newTransaction],
        shipments
      });

      // Show success toast ONLY after blockchain success
      toast({
        title: 'Vendor Order Created! 🛒',
        description: (
          <div className="space-y-2">
            <p>Order for {data.quantity} units of {part.name} from {vendor.name} has been recorded on the blockchain.</p>
            <div className="flex items-center gap-2">
              <span className="text-sm">Transaction Hash:</span>
              <a 
                href={blockchainResult.etherscanUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
              >
                {blockchainResult.txHash.slice(0, 10)}...{blockchainResult.txHash.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ),
      });
      
      setOpen(false);
      form.reset();
      
    } catch (error) {
      console.error('Error creating vendor order:', error);
      
      // Check if user rejected the transaction
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === 'ACTION_REJECTED' || (error as any).code === 4001) {
          toast({
            title: 'Transaction Cancelled',
            description: 'You cancelled the blockchain transaction. No vendor order was created.',
            variant: 'default',
          });
          return; // Don't show as destructive error
        }
      }
      
      // Handle other errors
      toast({
        title: 'Vendor Order Failed',
        description: `Failed to create vendor order: ${error instanceof Error ? error.message : String(error)}`,
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
          <DialogTitle>Order from {vendor.name}</DialogTitle>
          <DialogDescription>
            Create an order for parts from this vendor. The order will be recorded as a transaction.
          </DialogDescription>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>🛒 Framework:</strong> Create orders to vendors for parts (e.g., "Order 50 Batteries from Supplier A"), recorded as transactions.
            </p>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{vendor.name}</p>
                <p className="text-xs text-muted-foreground">{vendor.category}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Wallet:</p>
                <p className="text-xs font-mono">{vendor.walletAddress?.slice(0, 8)}...{vendor.walletAddress?.slice(-6)}</p>
              </div>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part to Order</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part to order from this vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableParts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            {part.name}
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
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col gap-2">
              {blockchainTx && (
                <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Blockchain Order Created</p>
                      <p className="text-xs text-green-600">Vendor order recorded on blockchain</p>
                    </div>
                    <a 
                      href={blockchainTx.etherscanUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      View on Etherscan
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              <Button 
                type="submit" 
                disabled={isProcessing || !walletConnected}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
              {!walletConnected && (
                <p className="text-xs text-muted-foreground text-center">
                  Connect your Web3 wallet to place vendor orders
                </p>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
