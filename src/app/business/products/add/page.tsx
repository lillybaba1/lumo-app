import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Add Product</h1>
        <p className="text-muted-foreground mt-1">
          Create a new product listing
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Product creation form coming soon. This will integrate with the existing product creation flow,
            automatically setting seller_id to your business account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
