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
import { allVendors, demoParts } from '@/lib/data';
import type { Role, Vendor } from '@/lib/types';
import { ExternalLink, Loader2 } from 'lucide-react';

const demandSchema = z.object({
  recipientEntity: z.string().min(1, 'Please select a recipient entity.'),
  recipientWallet: z.string().min(42, 'Please enter a valid wallet address.').max(42, 'Invalid wallet address.'),
  partId: z.string().min(1, 'Please select a part.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
});

type DemandFormValues = z.infer<typeof demandSchema>;

interface DemandTransactionDialogProps {
    children: React.ReactNode;
    role: Role;
}

export function DemandTransactionDialog({ children, role }: DemandTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blockchainTx, setBlockchainTx] = useState<{txHash: string; etherscanUrl: string} | null>(null);
  const { toast } = useToast();
  const { walletConnected, updateUserData, parts, transactions, shipments } = useAppState();

  // Framework requirement: Clients request parts from another business
  const availableEntities = allVendors.filter(v => v.relationshipType === 'vendor');
  const availableParts = demoParts.filter(p => p.type === 'finished' || p.type === 'raw');

  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandSchema),
    defaultValues: { 
      recipientEntity: '', 
      recipientWallet: '',
      partId: '', 
      quantity: 20 
    },
  });

  // Auto-fill wallet when entity is selected
  const handleEntityChange = (entityId: string) => {
    const entity = availableEntities.find(e => e.id === entityId);
    if (entity && entity.walletAddress) {
      form.setValue('recipientWallet', entity.walletAddress);
    }
  };

  const onSubmit = async (data: DemandFormValues) => {
    const entity = availableEntities.find(e => e.id === data.recipientEntity);
    const part = availableParts.find(p => p.id === data.partId);

    if (!entity || !part) {
        toast({ title: 'Error', description: 'Invalid entity or part selected.', variant: 'destructive' });
        return;
    }

    if (!walletConnected) {
        toast({ 
          title: 'Wallet Not Connected', 
          description: 'Please connect your Web3 wallet to create demand transactions.', 
          variant: 'destructive' 
        });
        return;
    }

    setIsProcessing(true);
    setBlockchainTx(null);

    try {
      // Framework requirement: Create blockchain demand transaction
      const blockchainResult = await smartContractService.createOrder(
        data.recipientWallet,
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
        to: entity.name,
        role: role,
        status: 'pending' as const,
        fromWallet: undefined, // Will be filled by current user's wallet
        toWallet: data.recipientWallet,
        invoiceNumber: `INV-2024-${Date.now().toString().slice(-6)}`,
        blockchainOrderId: blockchainResult.orderId,
        blockchainTxHash: blockchainResult.txHash,
        etherscanUrl: blockchainResult.etherscanUrl
      };

      // Update user data with new transaction ONLY after blockchain success
      updateUserData({
        parts,
        transactions: [...transactions, newTransaction],
        shipments
      });

      // Show success toast ONLY after blockchain success
      toast({
        title: 'Demand Transaction Created! 🎉',
        description: (
          <div className="space-y-2">
            <p>Demand for {data.quantity} units of {part.name} from {entity.name} has been recorded on the blockchain.</p>
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
      
      // Close dialog ONLY after blockchain success
      setOpen(false);
      
    } catch (error) {
      console.error('Error creating demand transaction:', error);
      
      // Check if user rejected the transaction
      if (error && typeof error === 'object' && 'code' in error) {
        if ((error as any).code === 'ACTION_REJECTED' || (error as any).code === 4001) {
          toast({
            title: 'Transaction Cancelled',
            description: 'You cancelled the blockchain transaction. No demand transaction was created.',
            variant: 'default',
          });
          return; // Don't show as destructive error
        }
      }
      
      // Handle other errors
      toast({
        title: 'Demand Transaction Failed',
        description: `Failed to create demand transaction: ${error instanceof Error ? error.message : String(error)}`,
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
          <DialogTitle>Create Demand Transaction</DialogTitle>
          <DialogDescription>
            Request parts from another business entity. Specify the recipient entity and wallet address.
          </DialogDescription>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>📋 Framework:</strong> Clients request parts from another business (e.g., Distributor demands 20 Tires from Supplier B)
            </p>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientEntity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Entity</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    handleEntityChange(value);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient entity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableEntities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name} ({entity.category})
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
              name="recipientWallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Wallet Address</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part to Request</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a part to request" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableParts.map((part) => (
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
                      <p className="text-xs text-green-600">Demand transaction recorded on blockchain</p>
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
                    Creating Demand Transaction...
                  </>
                ) : (
                  'Create Demand Transaction'
                )}
              </Button>
              {!walletConnected && (
                <p className="text-xs text-muted-foreground text-center">
                  Connect your Web3 wallet to create demand transactions
                </p>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
