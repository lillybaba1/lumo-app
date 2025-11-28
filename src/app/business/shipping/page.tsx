import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BusinessShippingPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Shipping Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your shipping methods and rates
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Configuration
          </CardTitle>
          <CardDescription>
            Set up shipping zones, methods, and rates for your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Shipping settings interface coming soon. Configure shipping methods, zones, and rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
