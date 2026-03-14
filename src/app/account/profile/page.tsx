import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Calendar, Shield, ShoppingBag, Heart, Store } from 'lucide-react';
import ProfileEditForm from './profile-edit-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?redirect=/account/profile');
  }

  // Get user profile data
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch profile:', profileError);
  }

  // Get user statistics
  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: wishlistData } = await supabase
    .from('wishlists')
    .select('product_ids')
    .eq('user_id', user.id)
    .single();

  const wishlistCount = wishlistData?.product_ids?.length || 0;

  // Check for business account
  const { data: businessAccount } = await supabase
    .from('business_accounts')
    .select('id, status, business_name')
    .eq('owner_user_id', user.id)
    .single();

  const userData = {
    id: user.id,
    email: user.email || '',
    name: profile?.name || user.user_metadata?.name || 'User',
    phone_number: profile?.phone_number || '',
    role: profile?.role || 'customer',
    created_at: profile?.created_at || user.created_at,
    phone_verified: profile?.phone_verified || false,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Seller Dashboard Card - Show first for business users */}
        {businessAccount && (
          <Card className="border-emerald-500/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Seller Dashboard
                  </CardTitle>
                  <CardDescription>Manage your store{businessAccount.business_name ? ` — ${businessAccount.business_name}` : ''}</CardDescription>
                </div>
                <Badge variant={businessAccount.status === 'ACTIVE' ? 'default' : 'secondary'} className="gap-1">
                  {businessAccount.status === 'ACTIVE' ? 'Active' : businessAccount.status === 'PENDING' ? 'Pending' : businessAccount.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href={businessAccount.status === 'ACTIVE' ? '/business/dashboard' : '/business/pending'}>
                  <Store className="h-4 w-4 mr-2" />
                  {businessAccount.status === 'ACTIVE' ? 'Go to Seller Dashboard' : 'Check Application Status'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Overview
                </CardTitle>
                <CardDescription>Your basic account information</CardDescription>
              </div>
              {userData.role === 'admin' && (
                <Badge variant="default" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Administrator
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Full Name</p>
                  <p className="text-lg">{userData.name}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-lg break-all">{userData.email}</p>
                  <Badge variant="outline" className="mt-1">Verified</Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-lg break-all">{userData.phone_number || 'Not provided'}</p>
                  {userData.phone_number && (
                    <Badge variant={userData.phone_verified ? "outline" : "secondary"} className="mt-1">
                      {userData.phone_verified ? 'Verified' : 'Not verified'}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-lg">{formatDate(userData.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditForm user={userData} />
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>Your shopping activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orderCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                  <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{wishlistCount}</p>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  View Orders
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/wishlist">
                  <Heart className="h-4 w-4 mr-2" />
                  View Wishlist
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Access Card */}
        {userData.role === 'admin' && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administrator Access
              </CardTitle>
              <CardDescription>You have administrative privileges</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/dashboard">
                  Go to Admin Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
