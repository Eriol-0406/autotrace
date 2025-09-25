
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { databaseService } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import type { Role } from '@/lib/types';
import { Building, Factory, Truck } from 'lucide-react';

const roles: { name: Role; icon: React.ReactNode; description: string }[] = [
  { name: 'Manufacturer', icon: <Factory className="w-8 h-8" />, description: 'You produce parts and assemble final products.' },
  { name: 'Supplier', icon: <Building className="w-8 h-8" />, description: 'You provide raw materials or components.' },
  { name: 'Distributor', icon: <Truck className="w-8 h-8" />, description: 'You manage logistics and deliver parts.' },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const { role, setRole, currentUser } = useAppState();
  const { toast } = useToast();

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
  };

  const handleContinue = async () => {
    if (role && currentUser) {
      try {
        // Save the selected role to the database
        await databaseService.updateUser(currentUser._id, {
          role: role
        });
        
        toast({
          title: "Role Selected!",
          description: `You've been assigned the ${role} role.`,
        });
        
        router.push('/onboarding/wallet');
      } catch (error) {
        console.error('Error saving role:', error);
        toast({
          title: "Error",
          description: "Failed to save role. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Select Your Role</CardTitle>
          <CardDescription>Choose the role that best describes your function in the supply chain.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r.name}
              onClick={() => handleRoleSelect(r.name)}
              className={`p-6 border rounded-lg text-center transition-all flex flex-col items-center gap-4 ${
                role === r.name ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
              }`}
            >
              {r.icon}
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-sm text-muted-foreground">{r.description}</p>
            </button>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} disabled={!role} className="w-full">
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
