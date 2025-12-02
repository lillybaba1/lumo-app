import { requireBusiness } from '@/lib/auth-business';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Crown, Zap, Building2, Star } from 'lucide-react';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const { businessAccount } = await requireBusiness();
  
  const currentTier = businessAccount.subscriptionTier || 'free';
  const tiers = Object.values(SUBSCRIPTION_TIERS);

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return <Zap className="h-6 w-6" />;
      case 'pro': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Building2 className="h-6 w-6" />;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pro': return 'bg-primary/10 text-primary border-primary/30';
      case 'enterprise': return 'bg-gradient-to-br from-purple-50 to-pink-50 text-purple-800 border-purple-200';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-1">
          Choose the plan that best fits your business needs
        </p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8 border-primary">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {getTierIcon(currentTier as SubscriptionTier)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <h3 className="font-semibold text-lg">
                  {SUBSCRIPTION_TIERS[currentTier as SubscriptionTier]?.name || 'Starter'}
                </h3>
              </div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isCurrentPlan = tier.tier === currentTier;
          const isPopular = tier.tier === 'pro';

          return (
            <Card 
              key={tier.tier}
              className={`relative overflow-hidden ${isCurrentPlan ? 'border-primary ring-2 ring-primary/20' : ''} ${isPopular ? 'border-primary' : ''}`}
            >
              {isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${getTierColor(tier.tier)}`}>
                  {getTierIcon(tier.tier)}
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>
                  {tier.tier === 'free' && 'Perfect for getting started'}
                  {tier.tier === 'pro' && 'For growing businesses'}
                  {tier.tier === 'enterprise' && 'For high-volume sellers'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${tier.monthlyPrice}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {tier.annualPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or ${tier.annualPrice}/year (save {Math.round((1 - tier.annualPrice / (tier.monthlyPrice * 12)) * 100)}%)
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {tier.commissionRate}%
                      </span>
                    </div>
                    <span className="text-sm">Commission per sale</span>
                  </div>

                  <div className="pt-3 space-y-2">
                    <FeatureRow 
                      included 
                      text={tier.features.maxProducts === -1 ? 'Unlimited products' : `Up to ${tier.features.maxProducts} products`} 
                    />
                    <FeatureRow 
                      included 
                      text={tier.features.maxMonthlyOrders === -1 ? 'Unlimited orders' : `Up to ${tier.features.maxMonthlyOrders} orders/mo`} 
                    />
                    <FeatureRow 
                      included={tier.features.customBoutique} 
                      text="Custom boutique branding" 
                    />
                    <FeatureRow 
                      included={tier.features.prioritySupport} 
                      text="Priority support" 
                    />
                    <FeatureRow 
                      included={tier.features.analyticsAdvanced} 
                      text="Advanced analytics" 
                    />
                    <FeatureRow 
                      included={tier.features.promotionalTools} 
                      text="Promotional tools" 
                    />
                    <FeatureRow 
                      included={tier.features.verifiedBadge} 
                      text="Verified seller badge" 
                    />
                    <FeatureRow 
                      included={tier.features.featuredListings > 0} 
                      text={`${tier.features.featuredListings} featured listings/mo`} 
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : tier.tier === 'free' ? (
                  <Button className="w-full" variant="outline" disabled>
                    Downgrade
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href={`/business/subscription/checkout?plan=${tier.tier}`}>
                      {tier.tier === 'enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-1">How does the commission work?</h4>
            <p className="text-sm text-muted-foreground">
              We take a small percentage of each sale you make. The rate depends on your subscription tier - 
              lower tiers have higher commission rates, while higher tiers have reduced rates.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Can I change my plan anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, 
              while downgrades take effect at the end of your current billing period.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards (Visa, Mastercard, American Express) and PayPal.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Is there a free trial for paid plans?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! New sellers get a 14-day free trial of the Pro plan. You can explore all features 
              before committing to a paid subscription.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureRow({ included, text }: { included: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className={included ? '' : 'text-muted-foreground'}>{text}</span>
    </div>
  );
}
