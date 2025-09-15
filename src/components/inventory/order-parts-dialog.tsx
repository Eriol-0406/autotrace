
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
import { getVendorsForRole, placeOrder, demoParts, allVendors } from '@/lib/data';
import { useEffect } from 'react';
import type { Role, Vendor, Part } from '@/lib/types';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { smartContractService } from '@/lib/smart-contract';
import { web3WalletService } from '@/lib/web3-wallet';
import { ExternalLink, Loader2 } from 'lucide-react';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [blockchainTx, setBlockchainTx] = useState<{txHash: string; etherscanUrl: string} | null>(null);
  const { toast } = useToast();
  const { parts, transactions, shipments, vendors, updateUserData, walletConnected } = useAppState();

  const { vendors: availableVendors } = getVendorsForRole(role, vendors);
  const displayedVendors = (availableVendors.length > 0 ? availableVendors : allVendors.filter(v => v.relationshipType === 'vendor'));
  
  // Determine which parts are orderable based on the current role's vendors
  // For this demo, we'll assume they can order any "finished" good from the demo data
  // In a real app, this would be determined by the selected vendor's actual catalog
  const orderableParts = demoParts.filter(p => p.type === 'finished' || p.type === 'raw');


  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { vendorId: '', partId: '', quantity: 100 },
  });

  const onSubmit = async (data: OrderFormValues) => {
    const vendor = displayedVendors.find(v => v.id === data.vendorId);
    // Find part from demo data as that's our "master catalog"
    const partToOrder = demoParts.find(p => p.id === data.partId);

    if (!vendor || !partToOrder) {
        toast({ title: 'Error', description: 'Invalid vendor or part selected.', variant: 'destructive' });
        return;
    }

    // Check if wallet is connected
    if (!walletConnected) {
        toast({ 
          title: 'Wallet Not Connected', 
          description: 'Please connect your Web3 wallet to place blockchain orders.', 
          variant: 'destructive' 
        });
        return;
    }

    setIsProcessing(true);
    setBlockchainTx(null);

    try {
      // Fallback: If vendors array is empty, use availableVendors instead
      const vendorsToUse = vendors.length > 0 ? vendors : displayedVendors;
      
      // Get vendor's wallet address
      const vendorWalletAddress = await smartContractService.getVendorWalletAddress(vendor.id, vendorsToUse);
      
      if (vendorWalletAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Vendor wallet address not found');
      }

      // Create blockchain order
      const blockchainResult = await smartContractService.createOrder(
        vendorWalletAddress,
        partToOrder.name,
        data.quantity
      );

      setBlockchainTx({
        txHash: blockchainResult.txHash,
        etherscanUrl: blockchainResult.etherscanUrl
      });

      // Also create the local order for tracking
      const result = placeOrder({
        fromRole: role,
        toVendor: vendor,
        part: partToOrder,
        quantity: data.quantity,
        blockchainOrderId: blockchainResult.orderId,
        blockchainTxHash: blockchainResult.txHash
      }, { parts, transactions, shipments });

      if(result.success) {
        updateUserData(result.updatedData);
        toast({
          title: 'Blockchain Order Created! 🎉',
          description: (
            <div className="space-y-2">
              <p>Your order for {data.quantity} units of {partToOrder.name} from {vendor.name} has been recorded on the blockchain.</p>
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
        // Close dialog after success
        setOpen(false);
      }
      
    } catch (error) {
      console.error('Error creating blockchain order:', error);
      toast({
        title: 'Blockchain Order Failed',
        description: `Failed to create blockchain order: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear previous tx and reset form when the dialog opens
  useEffect(() => {
    if (open) {
      setBlockchainTx(null);
      form.reset({ vendorId: '', partId: '', quantity: 100 });
    }
  }, [open]);

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
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            <strong>🔗 Real Blockchain:</strong> Connected to Sepolia testnet. Orders will be created with real transaction hashes.
          </p>
        </div>
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
                      {displayedVendors.map((vendor) => (
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
            <DialogFooter className="flex flex-col gap-2">
              {blockchainTx && (
                <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Blockchain Transaction Created</p>
                      <p className="text-xs text-green-600">Order recorded on blockchain</p>
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
                    Creating Blockchain Order...
                  </>
                ) : (
                  'Place Blockchain Order'
                )}
              </Button>
              {!walletConnected && (
                <p className="text-xs text-muted-foreground text-center">
                  Connect your Web3 wallet to place blockchain orders
                </p>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
