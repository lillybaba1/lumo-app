import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BusinessOrdersPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage orders containing your products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Orders
          </CardTitle>
          <CardDescription>
            Orders will be filtered to show only those containing your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Order management interface coming soon. You&apos;ll be able to view and manage orders
            containing your products, update order statuses, and track shipments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
