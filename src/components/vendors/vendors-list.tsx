"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { getVendorsForRole, allVendors } from '@/lib/data';
import type { Vendor, Role, Part } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Star, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { VendorOrderDialog } from './vendor-order-dialog';

const VendorPartsTooltip = ({ parts }: { parts: Part[] }) => {
    if (!parts || parts.length === 0) {
        return <span>No specific parts listed.</span>;
    }
    
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <span className="underline decoration-dashed">{parts.length} part(s)</span>
                </TooltipTrigger>
                <TooltipContent>
                    <ul className="list-disc pl-4 space-y-1">
                        {parts.map(p => <li key={p.id}>{p.name}</li>)}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const VendorRating = ({ initialRating, onRate }: { initialRating: number, onRate: (rating: number) => void }) => {
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSetRating = (newRating: number) => {
        setRating(newRating);
        onRate(newRating);
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-5 h-5 cursor-pointer transition-colors ${
                        (hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    onClick={() => handleSetRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                />
            ))}
        </div>
    );
}

const VendorTable = ({ vendors, isVendorSection = true }: { vendors: Vendor[], isVendorSection?: boolean }) => {
    const { updateVendorRating, role, loggedIn } = useAppState();
    const { toast } = useToast();
    
    // Use effective role for unauthenticated users
    const effectiveRole = role || 'Distributor';
    
    const handleRateVendor = (vendorId: string, name: string, newRating: number) => {
        updateVendorRating(vendorId, newRating);
        toast({ title: "Rating Submitted", description: `You rated ${name} ${newRating} stars.`});
    };

    return (
        <ScrollArea className="h-[500px]">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Supplied Parts</TableHead>
                    <TableHead className="hidden sm:table-cell">Your Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={`https://placehold.co/40x40.png?text=${vendor.name.charAt(0)}`} data-ai-hint="logo" />
                                <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{vendor.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {vendor.walletAddress?.slice(0, 8)}...{vendor.walletAddress?.slice(-6)}
                                </p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{vendor.category}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <VendorPartsTooltip parts={vendor.suppliedParts || []} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        {loggedIn ? (
                            <VendorRating initialRating={vendor.rating} onRate={(newRating) => handleRateVendor(vendor.id, vendor.name, newRating)} />
                        ) : (
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                            vendor.rating >= star
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">({vendor.rating})</span>
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            {loggedIn ? (
                                <>
                                    {/* Framework requirement: Only show "Order from Vendor" for actual vendors (suppliers), not customers */}
                                    {isVendorSection ? (
                                        <VendorOrderDialog vendor={vendor} role={effectiveRole}>
                                            <Button variant="outline" size="sm">
                                                <ShoppingCart className="mr-1 h-3 w-3" />
                                                Order from Vendor
                                            </Button>
                                        </VendorOrderDialog>
                                    ) : (
                                        <span className="text-xs text-muted-foreground px-3 py-2">
                                            • Customer •
                                        </span>
                                    )}
                                </>
                            ) : (
                                <>
                                    {isVendorSection ? (
                                        <Button variant="outline" size="sm" disabled>
                                            <span className="text-xs">Login to Order</span>
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground px-3 py-2">
                                            • Customer •
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
        </ScrollArea>
    );
}

const VendorListSection = ({ vendors, title, isVendorSection = true }: { vendors: Vendor[], title: string, isVendorSection?: boolean }) => {
    const [search, setSearch] = useState('');

    const filteredVendors = useMemo(() =>
        vendors.filter(
        (vendor) =>
            vendor.name.toLowerCase().includes(search.toLowerCase()) ||
            vendor.category.toLowerCase().includes(search.toLowerCase())
        ),
    [vendors, search]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or category..."
                        className="pl-8 sm:w-1/3"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {filteredVendors.length > 0 ? (
                    <VendorTable vendors={filteredVendors} isVendorSection={isVendorSection} />
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>No vendors found for this criteria.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export function VendorsList() {
    const { role, vendors, loggedIn } = useAppState();
    
    // Debug logging
    console.log('VendorsList Debug:', { role, vendorsCount: vendors?.length, vendors, loggedIn });
    
    // FORCE SHOW VENDORS - Use demo data directly if no vendors loaded
    const forceVendors = vendors && vendors.length > 0 ? vendors : allVendors;

    // Use 'Distributor' as default role for unauthenticated users to show vendors
    const effectiveRole = role || 'Distributor';
    const { vendors: roleVendors, customers } = getVendorsForRole(effectiveRole, forceVendors);
    
    // EMERGENCY FIX: Always show something! Use forceVendors as fallback
    const displayVendors = roleVendors.length > 0 ? roleVendors : forceVendors.filter(v => v.relationshipType === 'vendor');
    const displayCustomers = customers.length > 0 ? customers : forceVendors.filter(v => v.relationshipType === 'customer');

    const roleSpecifics: Record<Role, {
        vendorsTitle: string;
        customersTitle: string;
    }> = {
        Manufacturer: {
            vendorsTitle: "Raw Material Suppliers",
            customersTitle: "Distributors & Partners",
        },
        Supplier: {
            vendorsTitle: "Manufacturers", 
            customersTitle: "Distributors",
        },
        Distributor: {
            vendorsTitle: "Suppliers",
            customersTitle: "End Customers (e.g., Repair Shops)",
        }
    };
    const specifics = roleSpecifics[effectiveRole] || roleSpecifics.Supplier;

    return (
        <div className="space-y-8">
            {displayVendors.length > 0 && <VendorListSection vendors={displayVendors} title={specifics.vendorsTitle} isVendorSection={true} />}
            {displayCustomers.length > 0 && <VendorListSection vendors={displayCustomers} title={specifics.customersTitle} isVendorSection={false} />}
            
            {/* EMERGENCY FALLBACK: Show all vendors if nothing else shows */}
            {displayVendors.length === 0 && displayCustomers.length === 0 && (
                <VendorListSection vendors={forceVendors} title="All Available Vendors" />
            )}
        </div>
    );
}