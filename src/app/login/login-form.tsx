
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
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, FirebaseError } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';


export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Session creation failed: ${res.status}`);
      }
      
      // Hard redirect to ensure RSC reads the new cookie
      window.location.assign('/admin/dashboard');

    } catch (error: any) {
       console.error("Login failed:", error);
       let description = 'An unknown error occurred. Please try again.';
       if (error instanceof FirebaseError) {
         if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           description = 'Invalid email or password. Please try again.';
         }
       }
       toast({
           title: 'Login Failed',
           description,
           variant: 'destructive',
       });
    } finally {
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
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Login to Lumo</CardTitle>
            <CardDescription>Welcome back! Please log in to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              {loading ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
             <p className="text-xs text-muted-foreground">
              Don't have an account? <Link href="/signup" className="underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
