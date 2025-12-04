import BusinessSidebar from "@/components/business-sidebar";
import { createClient } from "@/lib/supabase/server";
import { getBusinessAccountByOwner } from "@/services/businessAccountService";

export const dynamic = 'force-dynamic';

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // For all business routes, check if user is fully approved
  // Only show sidebar for fully approved users
  
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // If no user, just render the content - pages will handle auth state
    if (!authUser) {
      return (
        <div className="min-h-screen bg-muted/40">
          {children}
        </div>
      );
    }

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Get business account
    const businessAccount = await getBusinessAccountByOwner(authUser.id);

    // If no business account or not fully approved, show minimal layout WITHOUT sidebar
    // This ensures pending users only see the pending content
    const isFullyApproved = businessAccount && 
      ((businessAccount.accountApproved && businessAccount.boutiqueApproved) || 
       businessAccount.status === 'ACTIVE');

    if (!isFullyApproved) {
      // Minimal layout for unapproved users - NO sidebar
      return (
        <div className="min-h-screen bg-muted/40">
          {children}
        </div>
      );
    }

    // Full layout with sidebar for approved users only
    return (
      <div className="flex min-h-screen bg-muted/40">
        <BusinessSidebar
          user={{
            userId: userData?.id || authUser.id,
            email: userData?.email || authUser.email || '',
            name: userData?.name || '',
            role: userData?.role || 'BUSINESS_ACCOUNT'
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
    // Re-throw NEXT_REDIRECT errors
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('Business layout error:', error);
    
    // On any error, just render the content
    return (
      <div className="min-h-screen bg-muted/40">
        {children}
      </div>
    );
  }
}
