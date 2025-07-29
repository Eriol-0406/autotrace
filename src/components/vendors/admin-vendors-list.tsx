
"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppState } from '@/context/app-state-provider';
import type { Vendor } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, FileSearch, UserPlus, MoreVertical, Star, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


const VendorPerformanceTable = ({ vendors, onRemove }: { vendors: Vendor[], onRemove: (vendorId: string) => void }) => {
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
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>All Network Vendors</CardTitle>
                        <CardDescription>Monitor performance and manage all registered entities.</CardDescription>
                    </div>
                     <Button asChild>
                        <Link href="/vendors/new">
                            <UserPlus className="mr-2 h-4 w-4" /> Add Vendor
                        </Link>
                    </Button>
                </div>
                <div className="relative mt-4">
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
                <ScrollArea className="h-[500px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Relationship</TableHead>
                                <TableHead>Primary Role</TableHead>
                                <TableHead>Fulfillment Rate</TableHead>
                                <TableHead>Avg. Rating</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVendors.map((vendor) => (
                            <TableRow key={vendor.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://placehold.co/40x40.png?text=${vendor.name.charAt(0)}`} data-ai-hint="logo" />
                                            <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{vendor.name}</p>
                                            <p className="text-sm text-muted-foreground font-mono">{vendor.walletAddress}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">{vendor.relationshipType}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{vendor.roles[0]}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={vendor.fulfillmentRate >= 95 ? 'default' : 'secondary'} className={vendor.fulfillmentRate >= 95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                        {vendor.fulfillmentRate}%
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span>{vendor.rating.toFixed(1)}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => alert('Auditing transactions for ' + vendor.name)}>
                                                    <FileSearch className="mr-2 h-4 w-4" /> Audit Trail
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                        <UserMinus className="mr-2 h-4 w-4" /> Remove Vendor
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently remove {vendor.name} from the network.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onRemove(vendor.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Remove
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};

export function AdminVendorsList() {
    const { vendors, removeVendor } = useAppState();
    const { toast } = useToast();

    const handleRemoveVendor = (vendorId: string) => {
        const vendorToRemove = vendors.find(v => v.id === vendorId);
        if (vendorToRemove) {
            removeVendor(vendorId);
            toast({
                title: 'Vendor Removed',
                description: `${vendorToRemove.name} has been removed from the network.`
            });
        }
    };

    return (
        <div className="grid gap-6">
            <VendorPerformanceTable vendors={vendors} onRemove={handleRemoveVendor} />
        </div>
    );
}
