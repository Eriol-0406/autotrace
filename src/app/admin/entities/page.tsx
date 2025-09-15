"use client";

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { Shield, Users, Wallet, Search, Plus, CheckCircle, XCircle, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { smartContractService } from '@/lib/smart-contract';
import { databaseService } from '@/lib/database';
import type { Role } from '@/lib/types';

interface BlockchainEntity {
  walletAddress: string;
  name: string;
  entityType: Role;
  isActive: boolean;
  registeredAt: number;
  isRegistered: boolean;
}

export default function AdminEntitiesPage() {
  const { isAdmin, vendors } = useAppState();
  const { toast } = useToast();
  const [entities, setEntities] = useState<BlockchainEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadEntities();
    }
  }, [isAdmin]);

  const loadEntities = async () => {
    setLoading(true);
    try {
      // In a real implementation, you'd have a way to query all registered entities
      // For now, we'll create a demo list based on known vendors and some mock blockchain entities
      const mockEntities: BlockchainEntity[] = [
        {
          walletAddress: '0x742d35cc6cf7b8b5b5f5d8b5f5d8b5f5d8b5f5d8',
          name: 'Auto Parts Supply Co.',
          entityType: 'Supplier',
          isActive: true,
          registeredAt: Date.now() - 86400000 * 30, // 30 days ago
          isRegistered: true,
        },
        {
          walletAddress: '0x123d35cc6cf7b8b5b5f5d8b5f5d8b5f5d8b5f5d8',
          name: 'Regional Distribution Hub',
          entityType: 'Distributor',
          isActive: true,
          registeredAt: Date.now() - 86400000 * 15, // 15 days ago
          isRegistered: true,
        },
        {
          walletAddress: '0x456d35cc6cf7b8b5b5f5d8b5f5d8b5f5d8b5f5d8',
          name: 'Global Manufacturing Corp',
          entityType: 'Manufacturer',
          isActive: false,
          registeredAt: Date.now() - 86400000 * 60, // 60 days ago
          isRegistered: true,
        },
        // Add entities from vendors that might be blockchain registered
        ...vendors
          .filter(v => v.walletAddress && v.walletAddress !== '0x0000000000000000000000000000000000000000')
          .slice(0, 3)
          .map(v => ({
            walletAddress: v.walletAddress,
            name: v.name,
            entityType: ((v.roles && v.roles.length > 0) ? v.roles[0] : 'Supplier') as Role,
            isActive: true,
            registeredAt: Date.now() - Math.random() * 86400000 * 30,
            isRegistered: true,
          }))
      ];

      setEntities(mockEntities);
    } catch (error) {
      console.error('Error loading entities:', error);
      toast({
        title: 'Error Loading Entities',
        description: 'Failed to load blockchain entities. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEntityStatus = async (entity: BlockchainEntity) => {
    try {
      // In a real implementation, you'd call a smart contract function to activate/deactivate
      const updatedEntities = entities.map(e => 
        e.walletAddress === entity.walletAddress 
          ? { ...e, isActive: !e.isActive }
          : e
      );
      
      setEntities(updatedEntities);
      
      toast({
        title: `Entity ${entity.isActive ? 'Deactivated' : 'Activated'}`,
        description: `${entity.name} has been ${entity.isActive ? 'deactivated' : 'activated'}.`,
      });
    } catch (error) {
      console.error('Error toggling entity status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update entity status.',
        variant: 'destructive',
      });
    }
  };

  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntities = entities.length;
  const activeEntities = entities.filter(e => e.isActive).length;
  const inactiveEntities = totalEntities - activeEntities;
  const entityTypes = {
    Manufacturer: entities.filter(e => e.entityType === 'Manufacturer').length,
    Supplier: entities.filter(e => e.entityType === 'Supplier').length,
    Distributor: entities.filter(e => e.entityType === 'Distributor').length,
  };

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
              <p className="text-muted-foreground">
                You need administrator privileges to access entity management.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Building className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Entity Management</h1>
            <p className="text-muted-foreground">
              Manage business entities registered on the blockchain network.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEntities}</div>
              <p className="text-xs text-muted-foreground">
                Registered on blockchain
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeEntities}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveEntities}</div>
              <p className="text-xs text-muted-foreground">
                Currently inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Manufacturers:</span>
                  <span className="font-medium">{entityTypes.Manufacturer}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Suppliers:</span>
                  <span className="font-medium">{entityTypes.Supplier}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Distributors:</span>
                  <span className="font-medium">{entityTypes.Distributor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Entities</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading entities...</p>
              </div>
            ) : filteredEntities.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Entities Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No entities match your search criteria.' : 'No entities are registered on the blockchain yet.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Wallet Address</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntities.map((entity) => (
                    <TableRow key={entity.walletAddress}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {entity.entityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3 w-3" />
                          {entity.walletAddress.slice(0, 6)}...{entity.walletAddress.slice(-4)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(entity.registeredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entity.isActive ? 'default' : 'secondary'}>
                          {entity.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={entity.isActive ? "destructive" : "default"}
                          onClick={() => handleToggleEntityStatus(entity)}
                        >
                          {entity.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
