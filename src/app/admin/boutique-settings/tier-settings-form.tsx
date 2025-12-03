'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BoutiqueSystemSettings } from '@/lib/types';
import { updateBoutiqueSettingsAction } from './actions';
import { Loader2, Crown, Sparkles, User, Save, Check, X } from 'lucide-react';

interface Props {
  settings: BoutiqueSystemSettings;
}

export default function TierSettingsForm({ settings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [tiers, setTiers] = useState(settings.tiers);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateBoutiqueSettingsAction({ tiers });
      
      if (result.success) {
        toast({
          title: 'Tiers Updated',
          description: 'Subscription tier settings have been saved.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update tiers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTier = (
    tier: 'free' | 'pro' | 'enterprise',
    field: string,
    value: any
  ) => {
    setTiers({
      ...tiers,
      [tier]: {
        ...tiers[tier],
        [field]: value,
      },
    });
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'free': return <User className="h-5 w-5" />;
      case 'pro': return <Sparkles className="h-5 w-5 text-amber-500" />;
      case 'enterprise': return <Crown className="h-5 w-5 text-purple-500" />;
      default: return null;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'border-gray-200 bg-gray-50';
      case 'pro': return 'border-amber-200 bg-amber-50';
      case 'enterprise': return 'border-purple-200 bg-purple-50';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {(['free', 'pro', 'enterprise'] as const).map((tierKey) => {
          const tier = tiers[tierKey];
          
          return (
            <Card key={tierKey} className={getTierColor(tierKey)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getTierIcon(tierKey)}
                    {tier.name} Tier
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Enabled</Label>
                    <Switch
                      checked={tier.enabled}
                      onCheckedChange={(checked) => updateTier(tierKey, 'enabled', checked)}
                    />
                  </div>
                </div>
                <CardDescription>
                  Configure pricing, limits, and features for {tier.name} sellers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing */}
                <div>
                  <h4 className="font-medium mb-3">Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tier Name</Label>
                      <Input
                        value={tier.name}
                        onChange={(e) => updateTier(tierKey, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Price ($)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={tier.monthlyPrice}
                        onChange={(e) => updateTier(tierKey, 'monthlyPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Price ($)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={tier.annualPrice}
                        onChange={(e) => updateTier(tierKey, 'annualPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <h4 className="font-medium mb-3">Limits & Commission</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={tier.commissionRate}
                        onChange={(e) => updateTier(tierKey, 'commissionRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Products</Label>
                      <Input
                        type="number"
                        min={-1}
                        value={tier.maxProducts}
                        onChange={(e) => updateTier(tierKey, 'maxProducts', parseInt(e.target.value) || 0)}
                        placeholder="-1 for unlimited"
                      />
                      <p className="text-xs text-muted-foreground">-1 = unlimited</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Monthly Orders</Label>
                      <Input
                        type="number"
                        min={-1}
                        value={tier.maxMonthlyOrders}
                        onChange={(e) => updateTier(tierKey, 'maxMonthlyOrders', parseInt(e.target.value) || 0)}
                        placeholder="-1 for unlimited"
                      />
                      <p className="text-xs text-muted-foreground">-1 = unlimited</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Featured Listings</Label>
                      <Input
                        type="number"
                        min={0}
                        value={tier.featuredListings}
                        onChange={(e) => updateTier(tierKey, 'featuredListings', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium mb-3">Features</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                      { key: 'customBoutique', label: 'Custom Boutique' },
                      { key: 'prioritySupport', label: 'Priority Support' },
                      { key: 'analyticsAdvanced', label: 'Advanced Analytics' },
                      { key: 'promotionalTools', label: 'Promo Tools' },
                      { key: 'verifiedBadge', label: 'Verified Badge' },
                    ].map(({ key, label }) => (
                      <div 
                        key={key}
                        className={`flex items-center gap-2 p-3 rounded-lg border ${
                          tier[key as keyof typeof tier] 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950' 
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-900'
                        }`}
                      >
                        <Switch
                          checked={tier[key as keyof typeof tier] as boolean}
                          onCheckedChange={(checked) => updateTier(tierKey, key, checked)}
                        />
                        <span className="text-sm">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2">{tiers.free.name}</th>
                  <th className="text-center p-2">{tiers.pro.name}</th>
                  <th className="text-center p-2">{tiers.enterprise.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Monthly Price</td>
                  <td className="text-center p-2">${tiers.free.monthlyPrice}</td>
                  <td className="text-center p-2">${tiers.pro.monthlyPrice}</td>
                  <td className="text-center p-2">${tiers.enterprise.monthlyPrice}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Commission</td>
                  <td className="text-center p-2">{tiers.free.commissionRate}%</td>
                  <td className="text-center p-2">{tiers.pro.commissionRate}%</td>
                  <td className="text-center p-2">{tiers.enterprise.commissionRate}%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Max Products</td>
                  <td className="text-center p-2">{tiers.free.maxProducts === -1 ? '∞' : tiers.free.maxProducts}</td>
                  <td className="text-center p-2">{tiers.pro.maxProducts === -1 ? '∞' : tiers.pro.maxProducts}</td>
                  <td className="text-center p-2">{tiers.enterprise.maxProducts === -1 ? '∞' : tiers.enterprise.maxProducts}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Verified Badge</td>
                  <td className="text-center p-2">{tiers.free.verifiedBadge ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</td>
                  <td className="text-center p-2">{tiers.pro.verifiedBadge ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</td>
                  <td className="text-center p-2">{tiers.enterprise.verifiedBadge ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Tier Settings
        </Button>
      </div>
    </div>
  );
}
