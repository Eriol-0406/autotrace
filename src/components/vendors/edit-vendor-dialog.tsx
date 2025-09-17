"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/lib/database';
import { Edit, Loader2, Save } from 'lucide-react';
import type { Vendor } from '@/lib/types';

interface EditVendorDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorUpdated: () => void;
}

export function EditVendorDialog({ vendor, open, onOpenChange, onVendorUpdated }: EditVendorDialogProps) {
  const { updateVendor, currentUser } = useAppState();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contactEmail: '',
    phone: '',
    address: '',
    walletAddress: '',
    relationshipType: 'vendor' as 'vendor' | 'customer',
    rating: 5.0,
  });

  // Initialize form data when vendor changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        category: vendor.category || '',
        contactEmail: vendor.contactEmail || '',
        phone: (vendor as any).phone || '',
        address: (vendor as any).address || '',
        walletAddress: vendor.walletAddress || '',
        relationshipType: vendor.relationshipType || 'vendor',
        rating: vendor.rating || 5.0,
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create updated vendor object
      const updatedVendor: Vendor = {
        ...vendor,
        name: formData.name,
        category: formData.category,
        contactEmail: formData.contactEmail,
        relationshipType: formData.relationshipType,
        walletAddress: formData.walletAddress,
        rating: formData.rating,
      };

      // Update in local state
      updateVendor(updatedVendor);

      // Update in database
      try {
        if (currentUser?._id || currentUser?.email) {
          await databaseService.updateVendor({
            ...updatedVendor,
            _id: (vendor as any)._id || vendor.id,
            phone: formData.phone,
            address: formData.address,
            userId: currentUser._id || currentUser.email,
          });
        }
      } catch (dbError) {
        console.warn('Database update failed:', dbError);
        toast({
          title: 'Database Update Warning',
          description: 'Vendor updated locally but database sync failed.',
          variant: 'destructive',
        });
      }

      toast({
        title: 'Vendor Updated Successfully',
        description: `${formData.name} has been updated.`,
      });

      onVendorUpdated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: 'Error Updating Vendor',
        description: 'Failed to update vendor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Vendor - {vendor?.name}
          </DialogTitle>
          <DialogDescription>
            Update vendor information and relationship details.
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
                  <Label htmlFor="edit-name">Business Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Auto Parts Supply Co."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category *</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    placeholder="Automotive Parts"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-contactEmail">Contact Email *</Label>
                  <Input
                    id="edit-contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    required
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Business St, City, State 12345"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-relationshipType">Relationship Type *</Label>
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
                <div>
                  <Label htmlFor="edit-rating">Rating (1-5)</Label>
                  <Input
                    id="edit-rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 5.0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-walletAddress">Wallet Address</Label>
                <Input
                  id="edit-walletAddress"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name || !formData.category || !formData.contactEmail}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Vendor
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
