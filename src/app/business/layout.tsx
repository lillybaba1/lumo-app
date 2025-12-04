import { headers } from 'next/headers';
import BusinessSidebar from "@/components/business-sidebar";
import { createClient } from "@/lib/supabase/server";
import { getBusinessAccountByOwner } from "@/services/businessAccountService";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

// Routes that show minimal layout (no sidebar) - for pending/setup states
const MINIMAL_LAYOUT_ROUTES = [
  '/business/pending',
  '/business/setup-boutique', 
  '/business/pending-boutique-review',
  '/business/boutique', // Allow boutique customization during setup
];

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  
  // Get the current path from the URL
  const referer = headersList.get('referer') || '';
  const currentPath = pathname || new URL(referer || 'http://localhost/business').pathname;

  try {
    // Get authentication
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (!authUser || authError) {
      // If on pending page, allow rendering to avoid redirect loops
      // The page itself will handle the "no user" state by showing a UI
      if (currentPath === '/business/pending') {
        return <>{children}</>;
      }
      redirect('/login?redirect=' + currentPath);
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userData) {
      redirect('/login?redirect=/business/dashboard');
    }

    // Get business account
    const businessAccount = await getBusinessAccountByOwner(authUser.id);

    if (!businessAccount) {
      redirect('/signup?type=business');
    }

    // Check if this is a minimal layout route (pending states)
    const isMinimalRoute = MINIMAL_LAYOUT_ROUTES.some(route => currentPath.startsWith(route));

    // For minimal layout routes, just show the content without sidebar
    if (isMinimalRoute) {
      return (
        <div className="min-h-screen bg-muted/40">
          {children}
        </div>
      );
    }

    // For full dashboard routes, enforce approval status
    const isFullyApproved = (businessAccount.accountApproved && businessAccount.boutiqueApproved) || 
                            businessAccount.status === 'ACTIVE';

    if (!isFullyApproved) {
      // Redirect based on current state
      if (!businessAccount.accountApproved) {
        redirect('/business/pending');
      } else if (!businessAccount.boutiqueSubmitted) {
        redirect('/business/setup-boutique');
      } else if (!businessAccount.boutiqueApproved) {
        redirect('/business/pending-boutique-review');
      }
    }

    // Full layout with sidebar for approved users
    return (
      <div className="flex min-h-screen bg-muted/40">
        <BusinessSidebar
          user={{
            userId: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role
          }}
          businessAccount={businessAccount}
        />
        <main className="flex-1 w-full lg:w-auto min-w-0">
          <div className="pt-14 lg:pt-0 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    );
  } catch (error: any) {
    // Re-throw NEXT_REDIRECT errors - these are intentional redirects from Next.js
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('Business layout error:', error);

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">{error.message || 'Unable to verify business access'}</p>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }
}
