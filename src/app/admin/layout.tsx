
import AdminSidebar from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/auth-admin";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
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
  } catch (error: any) {
    console.error('Admin layout error:', error);

    // If requireAdmin throws an error, it will redirect
    // This is just a safety net
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error.message || 'Unable to verify admin access'}</p>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }
}
