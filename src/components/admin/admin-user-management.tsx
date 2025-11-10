"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/lib/database';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Shield, 
  UserCheck, 
  UserX,
  Eye,
  EyeOff
} from 'lucide-react';
import type { DatabaseUser } from '@/lib/database';

const RoleBadge = ({ role, isAdmin }: { role: string | null, isAdmin: boolean }) => {
  if (isAdmin) {
    return <Badge variant="default" className="bg-red-500">Admin</Badge>;
  }
  
  const roleColors = {
    'Manufacturer': 'bg-blue-500',
    'Supplier': 'bg-green-500', 
    'Distributor': 'bg-orange-500',
  };
  
  const color = roleColors[role as keyof typeof roleColors] || 'bg-gray-500';
  
  return (
    <Badge variant="secondary" className={color}>
      {role || 'No Role'}
    </Badge>
  );
};

const UserForm = ({ 
  user, 
  onSave, 
  onCancel, 
  isEditing 
}: { 
  user?: DatabaseUser; 
  onSave: (userData: any) => void; 
  onCancel: () => void;
  isEditing: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || '',
    entityName: user?.entityName || '',
    walletAddress: user?.walletAddress || '',
    isAdmin: user?.isAdmin || false,
    walletConnected: user?.walletConnected || false,
    blockchainRegistered: user?.blockchainRegistered || false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">{isEditing ? 'New Password (leave blank to keep current)' : 'Password'}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!isEditing}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Role</SelectItem>
              <SelectItem value="Manufacturer">Manufacturer</SelectItem>
              <SelectItem value="Supplier">Supplier</SelectItem>
              <SelectItem value="Distributor">Distributor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="entityName">Entity Name</Label>
          <Input
            id="entityName"
            value={formData.entityName}
            onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="walletAddress">Wallet Address</Label>
        <Input
          id="walletAddress"
          value={formData.walletAddress}
          onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
          placeholder="0x..."
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isAdmin"
            checked={formData.isAdmin}
            onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="isAdmin">Admin User</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="walletConnected"
            checked={formData.walletConnected}
            onChange={(e) => setFormData({ ...formData, walletConnected: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="walletConnected">Wallet Connected</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="blockchainRegistered"
            checked={formData.blockchainRegistered}
            onChange={(e) => setFormData({ ...formData, blockchainRegistered: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="blockchainRegistered">Blockchain Registered</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

export function AdminUserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DatabaseUser | null>(null);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?all=true');
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
        setIsCreateDialogOpen(false);
        loadUsers();
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
        setEditingUser(null);
        loadUsers();
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        loadUsers();
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.entityName && user.entityName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || 
      (roleFilter === 'admin' && user.isAdmin) ||
      (roleFilter === 'no-role' && !user.role) ||
      user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.isAdmin).length,
    withRole: users.filter(u => u.role).length,
    walletConnected: users.filter(u => u.walletConnected).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-headline">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, roles, and permissions. Create, update, and delete user accounts.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">Administrator accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withRole}</div>
            <p className="text-xs text-muted-foreground">Users with assigned roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Connected</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.walletConnected}</div>
            <p className="text-xs text-muted-foreground">Users with connected wallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <UserForm
                  onSave={handleCreateUser}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isEditing={false}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or entity..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="Manufacturer">Manufacturers</SelectItem>
                <SelectItem value="Supplier">Suppliers</SelectItem>
                <SelectItem value="Distributor">Distributors</SelectItem>
                <SelectItem value="no-role">No Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} isAdmin={user.isAdmin} />
                  </TableCell>
                  <TableCell>
                    {user.entityName || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {user.walletAddress ? (
                      <div className="text-xs font-mono">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.walletConnected && (
                        <Badge variant="outline" className="text-xs">Connected</Badge>
                      )}
                      {user.blockchainRegistered && (
                        <Badge variant="outline" className="text-xs">Registered</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                No users match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSave={handleUpdateUser}
              onCancel={() => setEditingUser(null)}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

