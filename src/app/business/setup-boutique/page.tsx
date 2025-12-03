import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';
import SetupBoutiqueForm from './setup-boutique-form';

export default async function SetupBoutiquePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/business/setup-boutique');
  }

  const businessAccount = await getBusinessAccountByOwner(authUser.id);

  if (!businessAccount) {
    redirect('/signup');
  }

  // If account not approved yet, go back to pending
  if (!businessAccount.accountApproved) {
    redirect('/business/pending');
  }

  // If boutique already submitted, go to pending review
  if (businessAccount.boutiqueSubmitted && !businessAccount.boutiqueApproved) {
    redirect('/business/pending-boutique-review');
  }

  // If fully approved, go to dashboard
  if (businessAccount.boutiqueApproved) {
    redirect('/business/dashboard');
  }

  // Legacy: If ACTIVE status, go to dashboard
  if (businessAccount.status === 'ACTIVE') {
    redirect('/business/dashboard');
  }

  return <SetupBoutiqueForm businessAccount={businessAccount} />;
}
