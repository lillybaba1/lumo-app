import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getBusinessAccountByOwner } from '@/services/businessAccountService';
import PendingBoutiqueContent from './pending-boutique-content';

export default async function PendingBoutiqueReviewPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?redirect=/business/pending-boutique-review');
  }

  const businessAccount = await getBusinessAccountByOwner(authUser.id);

  if (!businessAccount) {
    redirect('/signup');
  }

  // If account not approved yet, go back to pending
  if (!businessAccount.accountApproved) {
    redirect('/business/pending');
  }

  // If boutique not submitted, go to setup
  if (!businessAccount.boutiqueSubmitted) {
    redirect('/business/setup-boutique');
  }

  // If fully approved, go to dashboard
  if (businessAccount.boutiqueApproved) {
    redirect('/business/dashboard');
  }

  // Legacy: If ACTIVE status, go to dashboard
  if (businessAccount.status === 'ACTIVE') {
    redirect('/business/dashboard');
  }

  return <PendingBoutiqueContent businessAccount={businessAccount} />;
}
