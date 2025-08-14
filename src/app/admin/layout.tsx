
import AdminSidebar from "@/components/admin-sidebar";
import type { AuthenticatedUser } from '@/hooks/use-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Re-enable authentication check once login is fixed.
  // const user = await getCurrentUser();

  // if (!user) {
  //   redirect('/login');
  // }
  
  // if (user.role !== 'admin') {
  //   redirect('/');
  // }
  
  // Fake user for sidebar display
  const user: AuthenticatedUser = {
    uid: 'temp-admin-id',
    email: 'admin@lumo.com',
    role: 'admin',
    name: 'Admin',
    auth_time: 0,
    exp: 0,
    iat: 0,
    firebase: {identities: {}, sign_in_provider: ''},
  };


  return (
    <div className="flex min-h-screen bg-muted/40">
       <AdminSidebar user={user} />
       <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
       </main>
    </div>
  );
}
