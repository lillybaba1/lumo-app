'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BoutiqueSystemSettings } from '@/lib/types';
import { updateBoutiqueSettingsAction } from './actions';
import { 
  Loader2, Save, Package, Store, BarChart3, 
  Megaphone, MessageCircle, Star, Wallet, Info
} from 'lucide-react';

interface Props {
  settings: BoutiqueSystemSettings;
}

const FEATURE_INFO = {
  customBoutiques: {
    icon: Store,
    title: 'Custom Boutiques',
    description: 'Allow sellers to create personalized storefront pages with custom branding',
  },
  sellerAnalytics: {
    icon: BarChart3,
    title: 'Seller Analytics',
    description: 'Provide sellers with detailed analytics and insights about their sales',
  },
  promotionalTools: {
    icon: Megaphone,
    title: 'Promotional Tools',
    description: 'Enable sellers to create discounts, coupons, and promotional campaigns',
  },
  sellerMessaging: {
    icon: MessageCircle,
    title: 'Seller Messaging',
    description: 'Allow customers to directly message sellers about products',
  },
  sellerReviews: {
    icon: Star,
    title: 'Seller Reviews',
    description: 'Enable customers to leave reviews and ratings for sellers',
  },
  automaticPayouts: {
    icon: Wallet,
    title: 'Automatic Payouts',
    description: 'Automatically process seller payouts on schedule (requires payment integration)',
  },
};

export default function FeatureSettingsForm({ settings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [features, setFeatures] = useState(settings.features);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateBoutiqueSettingsAction({ features });
      
      if (result.success) {
        toast({
          title: 'Features Updated',
          description: 'Feature settings have been saved.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update features',
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

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures({
      ...features,
      [key]: !features[key],
    });
  };

  const enabledCount = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Platform Features
          </CardTitle>
          <CardDescription>
            Enable or disable features available to sellers on your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {enabledCount} / {totalCount} Features Enabled
            </Badge>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(enabledCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(FEATURE_INFO) as Array<keyof typeof FEATURE_INFO>).map((key) => {
          const info = FEATURE_INFO[key];
          const Icon = info.icon;
          const isEnabled = features[key];

          return (
            <Card 
              key={key}
              className={`transition-all ${
                isEnabled 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'border-muted'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isEnabled 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{info.title}</h3>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleFeature(key)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {info.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Feature Changes
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Disabling a feature will hide it from all sellers immediately. 
                Existing data created with that feature will be preserved but not accessible 
                until the feature is re-enabled.
              </p>
            </div>
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
          Save Feature Settings
        </Button>
      </div>
    </div>
  );
}
