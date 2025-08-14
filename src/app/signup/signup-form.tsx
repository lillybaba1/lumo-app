
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createUser } from '@/services/authService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';


export default function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await createUser(email, password, name);
    
    if (result.success) {
      toast({
        title: 'Account Created',
        description: "Welcome to Lumo! Please log in to continue.",
      });

       try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (res.ok) {
            window.location.assign('/'); // Hard redirect
        } else {
             const errorData = await res.json();
             toast({
                title: 'Login Failed After Signup',
                description: errorData.error || 'Could not create session.',
                variant: 'destructive',
            });
             router.push('/login');
        }
    } catch (error: any) {
        toast({
           title: 'Login Failed After Signup',
           description: 'Please try logging in manually.',
           variant: 'destructive',
       });
       router.push('/login');
    }
    } else {
      toast({
        title: 'Signup Failed',
        description: result.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
       <div className="absolute top-4 left-4">
            <Button variant="outline" asChild>
                <Link href="/">Back to Shop</Link>
            </Button>
        </div>
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSignup}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
            <CardDescription>Join the Lumo family today!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Jane Doe" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@lumo.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
             <p className="text-xs text-muted-foreground">
              Already have an account? <Link href="/login" className="underline">Log in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
