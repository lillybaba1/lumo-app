import BusinessSidebar from "@/components/business-sidebar";
import { requireBusiness } from "@/lib/auth-business";

export const dynamic = 'force-dynamic';

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Require business authentication - will redirect to login if not authenticated/business
    const { user, businessAccount } = await requireBusiness();

    return (
      <div className="flex min-h-screen bg-muted/40">
        <BusinessSidebar
          user={{
            userId: user.uid,
            email: user.email,
            name: user.name,
            role: user.role
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
    console.error('Business layout error:', error);

    // If requireBusiness throws an error, it will redirect
    // This is just a safety net
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
