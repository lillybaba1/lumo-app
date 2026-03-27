import { requireBusiness } from "@/lib/auth-business";
import SellerOrdersClient from "@/components/business/seller-orders-client";

export const dynamic = 'force-dynamic';

export default async function BusinessOrdersPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage orders containing your products. When buyers pay, you prepare and ship — once they confirm delivery, you get paid.
        </p>
      </div>

      <SellerOrdersClient businessAccountId={businessAccount.id} />
    </div>
  );
}
