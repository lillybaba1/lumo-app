
import AdminSidebar from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/auth-admin";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require admin authentication - will redirect to login if not authenticated/admin
  const adminUser = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-muted/40">
       <AdminSidebar user={adminUser} />
       <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
       </main>
    </div>
  );
}
