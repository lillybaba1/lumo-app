import { requireAdmin } from '@/lib/auth-admin';
import { getBusinessAccount } from '@/services/businessAccountService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, ArrowLeft, Mail, Phone, MapPin, Globe, FileText, Calendar, User, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';
import { SellerActionButtons } from './seller-action-buttons';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SellerDetailPage({ params }: Props) {
  await requireAdmin();
  
  const { id } = await params;
  const businessAccount = await getBusinessAccount(id);

  if (!businessAccount) {
    notFound();
  }

  // Get owner user details
  const { data: ownerUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', businessAccount.ownerUserId)
    .single();

  // Get product count for this seller
  const { count: productCount } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge className="bg-orange-500">Pending Approval</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-yellow-500">Email Not Verified</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-500">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/sellers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-headline font-bold">{businessAccount.businessName}</h1>
            {getStatusBadge(businessAccount.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            Seller Application Details
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <p className="text-lg font-semibold">{businessAccount.businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tax ID / Registration</label>
                  <p className="text-lg">{businessAccount.taxId || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Business Address
                </label>
                <p className="mt-1">{businessAccount.businessAddress}</p>
              </div>

              {businessAccount.website && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Website
                  </label>
                  <a 
                    href={businessAccount.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {businessAccount.website}
                  </a>
                </div>
              )}

              {businessAccount.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Description
                  </label>
                  <p className="mt-1 text-muted-foreground">{businessAccount.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{businessAccount.contactPersonName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </label>
                  <a href={`mailto:${businessAccount.contactEmail}`} className="text-primary hover:underline">
                    {businessAccount.contactEmail}
                  </a>
                </div>
              </div>

              {businessAccount.businessPhone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Phone
                  </label>
                  <a href={`tel:${businessAccount.businessPhone}`} className="text-primary hover:underline">
                    {businessAccount.businessPhone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Owner Info */}
          {ownerUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Owner
                </CardTitle>
                <CardDescription>User account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p>{ownerUser.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{ownerUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                    <p>{ownerUser.email_verified ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Role</label>
                    <p>{ownerUser.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Products Listed</label>
                <p className="text-2xl font-bold">{productCount || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Applied On
                </label>
                <p>{new Date(businessAccount.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              {businessAccount.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p>{new Date(businessAccount.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage this seller account</CardDescription>
            </CardHeader>
            <CardContent>
              <SellerActionButtons 
                businessId={businessAccount.id} 
                status={businessAccount.status} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
