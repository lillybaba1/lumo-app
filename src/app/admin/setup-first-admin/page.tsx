"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldOff, ShieldCheck, Terminal, Users } from 'lucide-react';
import Link from 'next/link';

export default function FirstAdminSetupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldOff className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="font-headline text-2xl text-red-600 dark:text-red-400">
            Setup Disabled
          </CardTitle>
          <CardDescription className="text-base">
            This endpoint has been disabled for security reasons.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm text-red-900 dark:text-red-100">
            <p className="font-semibold mb-2">⛔ Security Notice</p>
            <p>
              The first-time admin setup page has been permanently disabled to prevent
              unauthorized admin account creation. Admin accounts can only be created
              through secure, authorized channels.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              How to Create Admin Accounts
            </h3>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-muted">
                <Terminal className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Server Script (Recommended)</p>
                  <code className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded mt-1 block">
                    node scripts/promote-to-admin.mjs your-email@example.com
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires server/filesystem access
                  </p>
                </div>
              </div>

              <div className="flex gap-3 p-3 rounded-lg bg-muted">
                <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Admin Panel</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Existing admins can promote users through the admin dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild variant="default">
              <Link href="/admin/login">Go to Admin Login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Return to Store</Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact your system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
