
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/hooks/use-auth';
import AdminSidebar from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'admin') {
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
