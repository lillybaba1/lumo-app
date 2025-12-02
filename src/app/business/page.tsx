import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';

export default async function BusinessIndexPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/business');
  }

  // Check if user has a business account
  const businessAccount = await getBusinessAccountByOwner(authUser.id);

  if (!businessAccount) {
    // No business account - redirect to signup
    redirect('/signup');
  }

  // Redirect based on status
  if (businessAccount.status === 'ACTIVE') {
    redirect('/business/dashboard');
  } else {
    redirect('/business/pending');
  }
}
