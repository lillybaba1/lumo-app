import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BusinessPayoutPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Payout Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure how you receive payments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Receiving
          </CardTitle>
          <CardDescription>
            Set up your bank account or payment provider details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Payout configuration coming soon. Connect your bank account or payment provider
            to receive payments from your sales.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
