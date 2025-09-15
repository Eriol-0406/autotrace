"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { useToast } from '@/hooks/use-toast';
import { smartContractService } from '@/lib/smart-contract';
import { databaseService } from '@/lib/database';
import { Plus, Wallet, Shield, Loader2 } from 'lucide-react';
import type { Role, Vendor } from '@/lib/types';

interface AddVendorDialogProps {
  children?: React.ReactNode;
}

export function AddVendorDialog({ children }: AddVendorDialogProps) {
  const { addVendor, role, walletInfo, isAdmin } = useAppState();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contactEmail: '',
    phone: '',
    address: '',
    walletAddress: '',
    relationshipType: 'vendor' as 'vendor' | 'customer',
    roles: [] as Role[],
    registerOnBlockchain: false,
    entityName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate vendor ID
      const vendorId = `V${String(Date.now()).slice(-6)}`;
      
      let finalWalletAddress = formData.walletAddress;
      
      // If registering on blockchain, use smart contract
      if (formData.registerOnBlockchain && formData.entityName.trim()) {
        try {
          // Register the vendor on blockchain (this would typically be done by the vendor themselves)
          const result = await smartContractService.registerWallet(
            formData.entityName.trim(), 
            formData.roles[0] || 'Supplier'
          );
          
          // For demo purposes, generate a wallet address if not provided
          if (!finalWalletAddress) {
            finalWalletAddress = '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
          }

          toast({
            title: 'Blockchain Registration Successful',
            description: `Vendor "${formData.name}" has been registered on the blockchain.`,
          });
        } catch (blockchainError) {
          console.warn('Blockchain registration failed:', blockchainError);
          toast({
            title: 'Blockchain Registration Warning',
            description: 'Vendor added but blockchain registration failed. They can register later.',
            variant: 'destructive',
          });
        }
      }

      // Create vendor object
      const newVendor: Vendor = {
        id: vendorId,
        name: formData.name,
        category: formData.category,
        onboardingDate: new Date().toISOString().split('T')[0],
        contactEmail: formData.contactEmail,
        relationshipType: formData.relationshipType,
        roles: formData.roles.length > 0 ? formData.roles : [role || 'Supplier'],
        walletAddress: finalWalletAddress || '0x0000000000000000000000000000000000000000',
        rating: 5.0,
        fulfillmentRate: 100,
        suppliedParts: [],
      };

      // Add to local state
      addVendor(newVendor);

      // Save to database if user is logged in
      try {
        await databaseService.createVendor({
          ...newVendor,
          phone: formData.phone,
          address: formData.address,
        });
      } catch (dbError) {
        console.warn('Database save failed:', dbError);
      }

      toast({
        title: 'Vendor Added Successfully',
        description: `${formData.name} has been added to your vendor list.`,
      });

      // Reset form and close dialog
      setFormData({
        name: '',
        category: '',
        contactEmail: '',
        phone: '',
        address: '',
        walletAddress: '',
        relationshipType: 'vendor',
        roles: [],
        registerOnBlockchain: false,
        entityName: '',
      });
      setOpen(false);

    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Error Adding Vendor',
        description: 'Failed to add vendor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (roleToToggle: Role, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleToToggle]
        : prev.roles.filter(r => r !== roleToToggle)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor or customer to your network. Optionally register them on the blockchain for enhanced compliance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Auto Parts Supply Co."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    placeholder="Automotive Parts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    required
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business St, City, State 12345"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="relationshipType">Relationship Type *</Label>
                <Select 
                  value={formData.relationshipType} 
                  onValueChange={(value: 'vendor' | 'customer') => 
                    setFormData(prev => ({ ...prev, relationshipType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor">Vendor (They supply to us)</SelectItem>
                    <SelectItem value="customer">Customer (We supply to them)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Business Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Select all roles that apply to this business:</Label>
                <div className="flex flex-col space-y-2">
                  {(['Manufacturer', 'Supplier', 'Distributor'] as Role[]).map((roleOption) => (
                    <div key={roleOption} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${roleOption}`}
                        checked={formData.roles.includes(roleOption)}
                        onCheckedChange={(checked) => handleRoleChange(roleOption, checked as boolean)}
                      />
                      <Label htmlFor={`role-${roleOption}`} className="text-sm font-normal">
                        {roleOption}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Blockchain Integration (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registerOnBlockchain"
                  checked={formData.registerOnBlockchain}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, registerOnBlockchain: checked as boolean }))
                  }
                />
                <Label htmlFor="registerOnBlockchain" className="text-sm font-medium">
                  Register this vendor on the blockchain
                </Label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Blockchain registration enables enhanced compliance tracking and immutable transaction records.
              </p>

              {formData.registerOnBlockchain && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="entityName">Entity Name for Blockchain *</Label>
                    <Input
                      id="entityName"
                      value={formData.entityName}
                      onChange={(e) => setFormData(prev => ({ ...prev, entityName: e.target.value }))}
                      placeholder="Official business name for blockchain registration"
                      required={formData.registerOnBlockchain}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This name will be permanently stored on the blockchain and cannot be changed.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="walletAddress">Wallet Address (Optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="walletAddress"
                        value={formData.walletAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                        placeholder="0x... (leave empty to generate automatically)"
                        className="font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      If not provided, a wallet address will be generated for demo purposes.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name || !formData.category || !formData.contactEmail}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Vendor...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
