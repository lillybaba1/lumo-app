
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AdminSidebar from "@/components/admin-sidebar";
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || role !== 'admin') {
        router.replace('/login');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, role, router]);

  if (loading || !isAuthorized) {
    return (
        <div className="flex min-h-screen bg-muted/40">
            <aside className="w-64 flex-shrink-0 border-r bg-card text-card-foreground flex flex-col p-4">
                 <div className="p-4 border-b flex items-center gap-2">
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="flex-grow px-2 py-4 space-y-2">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
                 <div className="p-4 border-t mt-auto">
                    <Skeleton className="h-10 w-full" />
                </div>
            </aside>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
