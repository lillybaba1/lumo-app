"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
       <div className="absolute top-4 left-4">
            <Button variant="outline" asChild>
                <Link href="/">Back to Shop</Link>
            </Button>
        </div>
      <Card className="w-full max-w-sm">
        <form>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Lumo Admin</CardTitle>
            <CardDescription>Redirecting to dashboard...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@lumo.com" defaultValue="admin@lumo.com" required disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" defaultValue="password" required disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled>
              Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
