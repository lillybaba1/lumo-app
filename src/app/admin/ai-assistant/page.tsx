import { requireAdmin } from '@/lib/auth-admin';
import { Bot, Sparkles, Shield, PenTool, Package, BarChart3, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminAIChat from './admin-ai-chat';

export const dynamic = 'force-dynamic';

export default async function AdminAIAssistantPage() {
  // Strict admin check - only APP_OWNER_ADMIN can access
  await requireAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            Admin AI Assistant
          </h1>
          <p className="text-muted-foreground mt-1">
            Your intelligent platform management companion with full admin capabilities
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Platform Admin Only
          </Badge>
          <Badge className="bg-primary/10 text-primary flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Full Access
          </Badge>
        </div>
      </div>

      {/* Capability Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-600" />
              Analytics & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Revenue, orders, top products, seller performance
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Inventory Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Stock levels, restock alerts, inventory valuation
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PenTool className="h-4 w-4 text-purple-600" />
              AI Content Writer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Product descriptions, announcements, emails
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-green-600" />
              Fully Customizable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Control tone, style, length & custom instructions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <AdminAIChat />
    </div>
  );
}
