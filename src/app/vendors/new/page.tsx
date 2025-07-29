
"use client"

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppState } from '@/context/app-state-provider';
import type { Vendor } from '@/lib/types';

const newVendorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  contactEmail: z.string().email("Invalid email address"),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  category: z.string().min(1, "Category is required"),
  relationshipType: z.enum(['vendor', 'customer']),
  role: z.enum(['Manufacturer', 'Supplier', 'Distributor']),
});

type NewVendorFormValues = z.infer<typeof newVendorSchema>;

export default function NewVendorPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { addVendor } = useAppState();

    const form = useForm<NewVendorFormValues>({
        resolver: zodResolver(newVendorSchema),
        defaultValues: {
            name: "",
            contactEmail: "",
            walletAddress: "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            category: "",
            relationshipType: "vendor",
            role: "Supplier",
        }
    });

    const onSubmit = (data: NewVendorFormValues) => {
        const newVendor: Vendor = {
            id: `V${Date.now()}`,
            onboardingDate: new Date().toISOString().split('T')[0],
            fulfillmentRate: 100, // Default for new vendor
            rating: 0, // Default for new vendor
            roles: [data.role],
            suppliedParts: [], // Starts with no parts
            ...data,
        };

        addVendor(newVendor);

        toast({
            title: "Vendor Created!",
            description: `${data.name} has been added to the vendor network.`,
        });

        router.push('/vendors');
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/vendors"><ArrowLeft /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-headline">Add New Vendor</h1>
                        <p className="text-muted-foreground">Register a new entity to the supply chain network.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Vendor Information</CardTitle>
                        <CardDescription>Fill out the details for the new vendor.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entity Name</FormLabel>
                                            <FormControl>
                                            <Input placeholder="e.g., Apex Automotive" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="contactEmail"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Email</FormLabel>
                                            <FormControl>
                                            <Input placeholder="e.g., contact@apex.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="walletAddress"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Wallet Address</FormLabel>
                                        <FormControl>
                                        <Input placeholder="0x..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Engine Components" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="relationshipType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Relationship</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="vendor">Vendor</SelectItem>
                                                        <SelectItem value="customer">Customer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primary Role</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                                                        <SelectItem value="Supplier">Supplier</SelectItem>
                                                        <SelectItem value="Distributor">Distributor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit">
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Vendor
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
