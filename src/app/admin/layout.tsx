
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/hooks/use-auth';
import AdminSidebar from "@/components/admin-sidebar";
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

async function AdminCheck() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return (
    <>
      <AdminSidebar user={user} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {/* @ts-ignore */}
        <Suspense fallback={<AdminContentSkeleton />}>{children}</Suspense>
      </main>
    </>
  );
}


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }


  return (
    <div className="flex min-h-screen bg-muted/40">
       <AdminSidebar user={user} />
       <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
       </main>
    </div>
  );
}

function AdminContentSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-9 w-48" />
            </div>
            <div className="grid grid-cols-1 gap-6">
                 <Skeleton className="h-64 w-full" />
                 <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
}
