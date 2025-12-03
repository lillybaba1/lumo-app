import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, Globe, Clock, DollarSign, MapPin } from "lucide-react";
import ShippingSettingsForm from "./shipping-form";

export const dynamic = 'force-dynamic';

export default async function BusinessShippingPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Truck className="h-8 w-8" />
          Shipping Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your shipping methods, zones, and rates
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipping Zones</p>
                <p className="text-xl font-bold">{businessAccount.shippingPolicies?.zones?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Methods</p>
                <p className="text-xl font-bold">{businessAccount.shippingPolicies?.methods?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Shipping</p>
                <p className="text-xl font-bold">
                  {businessAccount.shippingPolicies?.freeShippingThreshold 
                    ? `$${businessAccount.shippingPolicies.freeShippingThreshold}+` 
                    : 'Not Set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-xl font-bold">
                  {businessAccount.shippingPolicies?.processingTime || '1-2'} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Form */}
      <ShippingSettingsForm 
        businessAccountId={businessAccount.id}
        currentSettings={businessAccount.shippingPolicies || {}}
      />
    </div>
  );
}
