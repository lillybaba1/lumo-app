import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Shield, Globe, Eye, Trash2 } from "lucide-react";
import AccountSettingsForm from "./settings-form";

export const dynamic = 'force-dynamic';

export default async function BusinessSettingsPage() {
  const { user, businessAccount } = await requireBusiness();
  
  const isAdmin = user.role === 'APP_OWNER_ADMIN' || user.role === 'admin';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and notifications
        </p>
      </div>

      <AccountSettingsForm 
        businessAccountId={businessAccount.id}
        userEmail={user.email}
        userName={user.name}
        isAdmin={isAdmin}
      />
    </div>
  );
}
