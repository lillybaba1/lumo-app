import { requireBusiness } from '@/lib/auth-business';
import { getBoutiqueByBusinessAccount } from '@/services/boutiqueService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Sparkles, Crown, Zap } from 'lucide-react';
import BoutiqueForm from './boutique-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_TIERS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BusinessBoutiquePage() {
  const { user, businessAccount } = await requireBusiness();
  const boutique = await getBoutiqueByBusinessAccount(businessAccount.id);
  
  // Platform admin always gets enterprise tier with full access
  const isAdmin = user.role === 'APP_OWNER_ADMIN' || (user.role as string) === 'admin';
  const tier = isAdmin ? 'enterprise' : (businessAccount.subscriptionTier || 'free');
  const tierDetails = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  const canCustomize = isAdmin || tierDetails?.features?.customBoutique || false;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            My Boutique
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your public storefront
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {isAdmin ? 'Platform Owner' : (tierDetails?.name || 'Starter')} Plan
        </Badge>
      </div>

      {/* Upgrade CTA for free tier - never show for admins */}
      {!isAdmin && tier === 'free' && (
        <Card className="mb-6 border-primary/50 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Unlock Custom Branding</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for custom colors, logos, and lower commission rates
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/business/subscription">
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Benefits Summary */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Plan Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Commission Rate</p>
              <p className="text-xl font-bold text-primary">
                {isAdmin ? '0%' : `${tierDetails?.commissionRate}%`}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Max Products</p>
              <p className="text-xl font-bold">
                {isAdmin || tierDetails?.features?.maxProducts === -1 ? '∞' : tierDetails?.features?.maxProducts}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Custom Branding</p>
              <p className="text-xl font-bold">
                {canCustomize ? '✓' : '✗'}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Featured Slots</p>
              <p className="text-xl font-bold">
                {isAdmin ? '∞' : `${tierDetails?.features?.featuredListings}/mo`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Boutique Form */}
      <BoutiqueForm 
        boutique={boutique}
        businessAccountId={businessAccount.id}
        canCustomize={canCustomize}
      />
    </div>
  );
}
