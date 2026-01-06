import { requireAdmin } from '@/lib/auth-admin';
import { getBoutiqueSettings } from '@/services/platformSettingsService';
import { getAllBusinessAccounts } from '@/services/businessAccountService';
import { getPublishedBoutiques } from '@/services/boutiqueService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Store, Settings, Users, CreditCard, BarChart3, Shield,
  Crown, Sparkles, Package, DollarSign, TrendingUp
} from 'lucide-react';
import GeneralSettingsForm from './general-settings-form';
import TierSettingsForm from './tier-settings-form';
import FeatureSettingsForm from './feature-settings-form';
import PayoutSettingsForm from './payout-settings-form';
import ContentSettingsForm from './content-settings-form';
import SellersOverview from './sellers-overview';

export const dynamic = 'force-dynamic';

export default async function BoutiqueSettingsPage() {
  await requireAdmin();
  
  const [settings, businessAccounts, boutiques] = await Promise.all([
    getBoutiqueSettings(),
    getAllBusinessAccounts(),
    getPublishedBoutiques({ limit: 100 }),
  ]);

  // Calculate stats
  const totalSellers = businessAccounts.length;
  const activeSellers = businessAccounts.filter(b => b.status === 'ACTIVE').length;
  const pendingApproval = businessAccounts.filter(b => b.status === 'PENDING_APPROVAL').length;
  const verifiedSellers = businessAccounts.filter(b => b.verificationStatus === 'verified').length;
  
  const tierCounts = {
    free: businessAccounts.filter(b => b.subscriptionTier === 'free').length,
    pro: businessAccounts.filter(b => b.subscriptionTier === 'pro').length,
    enterprise: businessAccounts.filter(b => b.subscriptionTier === 'enterprise').length,
  };

  const totalBoutiques = boutiques.length;
  const featuredBoutiques = boutiques.filter(b => b.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Boutique System Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete control over the marketplace and seller ecosystem
          </p>
        </div>
        <Badge 
          variant={settings.enabled ? "default" : "secondary"}
          className={settings.enabled ? "bg-green-500" : "bg-gray-500"}
        >
          {settings.enabled ? 'System Active' : 'System Disabled'}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sellers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSellers}</div>
            <p className="text-xs text-muted-foreground">
              {activeSellers} active, {pendingApproval} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedSellers}</div>
            <p className="text-xs text-muted-foreground">
              {totalSellers > 0 ? Math.round((verifiedSellers / totalSellers) * 100) : 0}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boutiques</CardTitle>
            <Store className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoutiques}</div>
            <p className="text-xs text-muted-foreground">
              {featuredBoutiques} featured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Sellers</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tierCounts.pro}</div>
            <p className="text-xs text-muted-foreground">
              ${settings.tiers.pro.monthlyPrice}/mo tier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tierCounts.enterprise}</div>
            <p className="text-xs text-muted-foreground">
              ${settings.tiers.enterprise.monthlyPrice}/mo tier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Tiers</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Payouts</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Sellers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="tiers">
          <TierSettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="features">
          <FeatureSettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutSettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="content">
          <ContentSettingsForm settings={settings} />
        </TabsContent>

        <TabsContent value="sellers">
          <SellersOverview 
            businessAccounts={businessAccounts} 
            boutiques={boutiques}
            settings={settings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
