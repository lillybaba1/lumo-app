'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Save, Bell, Shield, Eye, Trash2, Mail, 
  MessageSquare, TrendingUp, ShoppingCart, AlertTriangle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
  businessAccountId: string;
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}

export default function AccountSettingsForm({ businessAccountId, userEmail, userName, isAdmin }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);
  const [analyticsNotifications, setAnalyticsNotifications] = useState(false);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  
  // Privacy settings
  const [showBoutiqueStats, setShowBoutiqueStats] = useState(true);
  const [showRecentSales, setShowRecentSales] = useState(true);
  
  // Vacation mode
  const [vacationMode, setVacationMode] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Settings Saved',
        description: 'Your account settings have been updated.',
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="font-medium">{userName || 'Not set'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{userEmail}</p>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Account Type</Label>
            <p className="font-medium">{isAdmin ? 'Platform Owner (Admin)' : 'Seller Account'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Master toggle for all email notifications</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <Separator />
          
          <div className={`space-y-4 ${!emailNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">New Orders</p>
                  <p className="text-sm text-muted-foreground">Get notified when you receive a new order</p>
                </div>
              </div>
              <Switch
                checked={orderNotifications}
                onCheckedChange={setOrderNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Customer Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified when a customer sends a message</p>
                </div>
              </div>
              <Switch
                checked={messageNotifications}
                onCheckedChange={setMessageNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Reviews & Ratings</p>
                  <p className="text-sm text-muted-foreground">Get notified when you receive a new review</p>
                </div>
              </div>
              <Switch
                checked={reviewNotifications}
                onCheckedChange={setReviewNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Weekly Analytics Report</p>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of your boutique performance</p>
                </div>
              </div>
              <Switch
                checked={analyticsNotifications}
                onCheckedChange={setAnalyticsNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Marketing & Tips</p>
                  <p className="text-sm text-muted-foreground">Tips for growing your business and platform updates</p>
                </div>
              </div>
              <Switch
                checked={marketingNotifications}
                onCheckedChange={setMarketingNotifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy & Visibility
          </CardTitle>
          <CardDescription>
            Control what information is visible on your boutique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Boutique Statistics</p>
              <p className="text-sm text-muted-foreground">Display product count and reviews on your boutique page</p>
            </div>
            <Switch
              checked={showBoutiqueStats}
              onCheckedChange={setShowBoutiqueStats}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Recent Sales</p>
              <p className="text-sm text-muted-foreground">Display recent sales activity on your boutique</p>
            </div>
            <Switch
              checked={showRecentSales}
              onCheckedChange={setShowRecentSales}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vacation Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Vacation Mode
          </CardTitle>
          <CardDescription>
            Temporarily pause your boutique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Vacation Mode</p>
              <p className="text-sm text-muted-foreground">
                Your boutique will show as &quot;On Vacation&quot; and customers cannot place orders
              </p>
            </div>
            <Switch
              checked={vacationMode}
              onCheckedChange={setVacationMode}
            />
          </div>
          
          {vacationMode && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                ⚠️ Vacation mode is enabled. Customers cannot place new orders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone - only for non-admins */}
      {!isAdmin && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Close Boutique</p>
                <p className="text-sm text-muted-foreground">
                  Permanently close your boutique and remove all products
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Close Boutique
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently close your boutique,
                      remove all your products, and delete your seller account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                      Yes, close my boutique
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
