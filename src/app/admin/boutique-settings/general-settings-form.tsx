'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { BoutiqueSystemSettings } from '@/lib/types';
import { updateBoutiqueSettingsAction, resetBoutiqueSettingsAction } from './actions';
import { Loader2, Settings, AlertTriangle, RotateCcw, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  settings: BoutiqueSystemSettings;
}

export default function GeneralSettingsForm({ settings }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [formData, setFormData] = useState({
    enabled: settings.enabled,
    allowNewSellers: settings.allowNewSellers,
    requireApproval: settings.requireApproval,
    requireVerification: settings.requireVerification,
    defaultCommissionRate: settings.defaultCommissionRate,
    minCommissionRate: settings.minCommissionRate,
    maxCommissionRate: settings.maxCommissionRate,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateBoutiqueSettingsAction(formData);
      
      if (result.success) {
        toast({
          title: 'Settings Updated',
          description: 'Boutique system settings have been saved.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update settings',
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

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetBoutiqueSettingsAction();
      
      if (result.success) {
        toast({
          title: 'Settings Reset',
          description: 'All settings have been reset to defaults.',
        });
        router.refresh();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reset settings',
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
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card className={!formData.enabled ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Enable or disable the entire boutique marketplace system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Boutique System</Label>
              <p className="text-sm text-muted-foreground">
                {formData.enabled 
                  ? 'The marketplace is active and sellers can operate'
                  : 'The marketplace is disabled. Sellers cannot access their dashboards.'}
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>

          {!formData.enabled && (
            <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 rounded-lg text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                Warning: Disabling the system will prevent all sellers from accessing their accounts
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
          <CardDescription>
            Control how new sellers can join the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Allow New Sellers</Label>
              <p className="text-sm text-muted-foreground">
                Allow new business accounts to register on the platform
              </p>
            </div>
            <Switch
              checked={formData.allowNewSellers}
              onCheckedChange={(checked) => setFormData({ ...formData, allowNewSellers: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Require Approval</Label>
              <p className="text-sm text-muted-foreground">
                New sellers must be approved by admin before they can start selling
              </p>
            </div>
            <Switch
              checked={formData.requireApproval}
              onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Require Verification</Label>
              <p className="text-sm text-muted-foreground">
                Sellers must complete identity verification before selling
              </p>
            </div>
            <Switch
              checked={formData.requireVerification}
              onCheckedChange={(checked) => setFormData({ ...formData, requireVerification: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>
            Set platform-wide commission rates (can be overridden per tier)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Default Commission Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.defaultCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  defaultCommissionRate: parseFloat(e.target.value) || 0 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Applied to new sellers before tier assignment
              </p>
            </div>

            <div className="space-y-2">
              <Label>Minimum Commission (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.minCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  minCommissionRate: parseFloat(e.target.value) || 0 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Lowest commission allowed for any seller
              </p>
            </div>

            <div className="space-y-2">
              <Label>Maximum Commission (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formData.maxCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  maxCommissionRate: parseFloat(e.target.value) || 0 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Highest commission allowed for any seller
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all boutique system settings to their default values. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleReset}
                className="bg-red-600 hover:bg-red-700"
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Reset Settings'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
