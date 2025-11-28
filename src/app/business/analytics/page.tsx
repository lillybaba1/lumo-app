import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BusinessAnalyticsPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your sales performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Sales Analytics
          </CardTitle>
          <CardDescription>
            Detailed analytics filtered to your products only
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Analytics dashboard coming soon with charts and insights about your sales performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
