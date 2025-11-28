import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BusinessSettingsPage() {
  const { user, businessAccount } = await requireBusiness();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Account preferences and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Account settings interface coming soon. Configure notifications, preferences, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
