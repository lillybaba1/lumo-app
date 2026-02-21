'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { BoutiqueSystemSettings } from '@/lib/types';
import { updateBoutiqueSettingsAction } from './actions';
import { 
  Loader2, Save, DollarSign, Calendar, CreditCard, 
  Building2, Smartphone, Clock, AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  settings: BoutiqueSystemSettings;
}

const PAYOUT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  { id: 'wave_money', label: 'Wave Money', icon: Smartphone },
  { id: 'paypal', label: 'PayPal', icon: CreditCard },
  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
];

export default function PayoutSettingsForm({ settings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [payouts, setPayouts] = useState(settings.payouts);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateBoutiqueSettingsAction({ payouts });
      
      if (result.success) {
        toast({
          title: 'Payout Settings Updated',
          description: 'Payout configuration has been saved.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update payout settings',
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

  const togglePayoutMethod = (methodId: string) => {
    const methods = payouts.payoutMethods.includes(methodId)
      ? payouts.payoutMethods.filter(m => m !== methodId)
      : [...payouts.payoutMethods, methodId];
    
    setPayouts({ ...payouts, payoutMethods: methods });
  };

  return (
    <div className="space-y-6">
      {/* Payout Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payout Schedule
          </CardTitle>
          <CardDescription>
            Configure how and when sellers receive their earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Payout Frequency</Label>
              <Select
                value={payouts.payoutSchedule}
                onValueChange={(value: any) => setPayouts({ ...payouts, payoutSchedule: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How often payouts are processed
              </p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Payout Amount ($)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={payouts.minimumPayout}
                onChange={(e) => setPayouts({ 
                  ...payouts, 
                  minimumPayout: parseFloat(e.target.value) || 0 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum balance required for payout
              </p>
            </div>

            <div className="space-y-2">
              <Label>Hold Period (Days)</Label>
              <Input
                type="number"
                min={0}
                max={90}
                value={payouts.holdPeriodDays}
                onChange={(e) => setPayouts({ 
                  ...payouts, 
                  holdPeriodDays: parseInt(e.target.value) || 0 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Days to hold funds before payout
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Methods
          </CardTitle>
          <CardDescription>
            Enable the payout methods available to sellers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAYOUT_METHODS.map((method) => {
              const Icon = method.icon;
              const isEnabled = payouts.payoutMethods.includes(method.id);

              return (
                <div
                  key={method.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                    isEnabled 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                  onClick={() => togglePayoutMethod(method.id)}
                >
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={() => togglePayoutMethod(method.id)}
                  />
                  <div className={`p-2 rounded-lg ${
                    isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{method.label}</p>
                  </div>
                  {isEnabled && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {payouts.payoutMethods.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  No Payout Methods Enabled
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Sellers won&apos;t be able to receive payouts until at least one method is enabled.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payout Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Sale Completed</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>{payouts.holdPeriodDays} Days Hold</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Available for Payout</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>{payouts.payoutSchedule.charAt(0).toUpperCase() + payouts.payoutSchedule.slice(1)} Payout</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Example:</strong> A sale completed today will have funds available after{' '}
              <strong>{payouts.holdPeriodDays} days</strong>. If the seller has at least{' '}
              <strong>${payouts.minimumPayout}</strong> available, they will receive payment on the next{' '}
              <strong>{payouts.payoutSchedule}</strong> payout cycle via their chosen method.
            </p>
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
          Save Payout Settings
        </Button>
      </div>
    </div>
  );
}
