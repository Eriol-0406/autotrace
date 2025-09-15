
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAppState } from '@/context/enhanced-app-state-provider';
import { databaseService } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { ForgotPasswordDialog } from '@/components/auth/forgot-password-dialog';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Logo = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-primary"
    >
      <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10a1 1 0 0 1 1 1v11" />
      <path d="M14 9h7c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1h-7" />
      <path d="M14 9l-4.5 4.5" />
      <path d="M9.5 13.5L6 17" />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { setLoggedIn, setRole, setIsAdmin, clearUserData, setCurrentUser } = useAppState();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      console.log('🔍 Login attempt for:', data.email);
      
      // Check if user exists in database
      let user = await databaseService.getUserByEmail(data.email);
      console.log('👤 User found:', user ? 'Yes' : 'No');
      
      // Check if this is the admin email
      const isAdminEmail = data.email.toLowerCase() === 'admin@example.com';
      console.log('👑 Is admin email:', isAdminEmail);
      
      if (!user) {
        console.log('📝 Creating new user...');
        // Create new user
        const userData = {
          email: data.email,
          name: isAdminEmail ? 'System Administrator' : data.email.split('@')[0],
          role: isAdminEmail ? 'Distributor' : null, // Admin gets a default role, others need to select
          isAdmin: isAdminEmail,
          walletConnected: false,
          blockchainRegistered: false,
          entityName: null,
        };
        console.log('📝 User data to create:', userData);
        
        user = await databaseService.createUser(userData);
        console.log('✅ User created:', user ? 'Success' : 'Failed');
      } else if (isAdminEmail && !user.isAdmin) {
        console.log('🔧 Updating existing user to admin...');
        // Update existing user to admin if they login with admin email
        user = await databaseService.updateUser(user._id, {
          isAdmin: true,
          name: 'System Administrator'
        });
        console.log('✅ User updated:', user ? 'Success' : 'Failed');
      }

      if (user) {
        setCurrentUser(user);
        setLoggedIn(true);
        setRole(user.role);
        setIsAdmin(user.isAdmin);
        
        if (!user.role && !user.isAdmin) {
          // New user needs to select role (but not admin)
          toast({
            title: "Welcome!",
            description: "Please select your business role to continue.",
          });
          router.push('/onboarding/role');
        } else {
          // Existing user with role OR admin user
          const welcomeMessage = user.isAdmin 
            ? "Welcome back, Administrator!" 
            : `Welcome back, ${user.name}!`;
          
          toast({
            title: "Login successful",
            description: welcomeMessage,
          });
          router.push('/dashboard');
        }
      } else {
        console.error('❌ User is null after create/update operations');
        throw new Error('Failed to create or retrieve user');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    
    try {
      // Decode JWT token to get user info
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const googleUser = JSON.parse(jsonPayload);
      
      // Check if user exists in database
      let user = await databaseService.getUserByEmail(googleUser.email);
      
      if (!user) {
        // Create new user from Google data without role - they'll need to select it
        user = await databaseService.createUser({
          email: googleUser.email,
          name: googleUser.name,
          role: null, // No role assigned yet - user needs to select
          isAdmin: false,
          walletConnected: false,
        });
      }

      if (user) {
        setCurrentUser(user);
        setLoggedIn(true);
        setRole(user.role);
        setIsAdmin(user.isAdmin);
        
        toast({
          title: "Login successful",
          description: `Welcome, ${user.name}!`,
        });
        
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Login failed",
        description: "Google authentication failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Legacy login for demo purposes
  const onSubmitLegacy = (data: LoginFormValues) => {
    // In a real app, you'd authenticate against a backend.
    // Here, we'll simulate a successful login.
    if (data.email === 'admin@example.com' && data.password === 'password') {
        console.log('Admin login successful');
        clearUserData();
        setLoggedIn(true);
        setIsAdmin(true);
        setRole('Manufacturer'); // Default role for admin
        router.push('/');
    } else if (data.email.endsWith('@example.com') && data.password === 'password') {
        console.log('Login successful with:', data);
        clearUserData(); // Clear any previous demo data
        setLoggedIn(true);
        setIsAdmin(false); // Ensure admin is false for regular users
        // The user will be redirected by AppLayout to onboarding if role/wallet is not set
        router.push('/onboarding/role');
    } else {
        toast({
            title: 'Login Failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
        });
    }
  };

  const handleGoogleSuccessLegacy = (credentialResponse: CredentialResponse) => {
    console.log('Google Sign-In Success', credentialResponse);
    // In a real app, you would send the credentialResponse.credential to your backend for verification
    // and to get a session token. For this prototype, we'll simulate a successful sign-in.
    clearUserData();
    setLoggedIn(true);
    setIsAdmin(false);
    // Redirect to onboarding for role and wallet selection after Google sign-in
    router.push('/onboarding/role');
    toast({
        title: 'Signed in with Google!',
        description: 'Please complete the onboarding steps.',
    });
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In Error');
    toast({
      title: 'Sign-In Failed',
      description: 'Could not sign in with Google. Please try again.',
      variant: 'destructive',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center gap-2 mb-4 z-10">
          <Logo />
          <h1 className="text-2xl font-bold font-headline">AutoTrace</h1>
      </div>
      <Card className="w-full max-w-sm z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login. Use <b>admin@example.com</b> and <b>password</b> to access all roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                        <ForgotPasswordDialog />
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input type={showPassword ? "text" : "password"} {...field} />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </Form>
          <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
          </div>
          <div className="flex justify-center w-full">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                size="large"
                shape="rectangular"
                width="320"
                logo_alignment="left"
            />
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
