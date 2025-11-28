import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export default async function BusinessDashboardPage() {
  const { user, businessAccount } = await requireBusiness();

  // Fetch seller-specific stats
  const stats = await getSellerStats(businessAccount.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {businessAccount.contactPersonName}
        </p>
      </div>

      {/* Status Alert */}
      {businessAccount.status === 'PENDING_VERIFICATION' && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Account Pending Verification
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Your business account is under review. You can start adding products, but they won't be visible to customers until your account is approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders containing your products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              Listed on marketplace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Set up your seller account for success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  businessAccount.description ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {businessAccount.description ? '✓' : '1'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Complete your business profile</p>
                  <p className="text-xs text-muted-foreground">Add description and logo</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  stats.activeProducts > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {stats.activeProducts > 0 ? '✓' : '2'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">List your first product</p>
                  <p className="text-xs text-muted-foreground">Add products to start selling</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  businessAccount.shippingPolicies ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {businessAccount.shippingPolicies ? '✓' : '3'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Configure shipping</p>
                  <p className="text-xs text-muted-foreground">Set up shipping policies</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  businessAccount.payoutMethod ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {businessAccount.payoutMethod ? '✓' : '4'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Set up payouts</p>
                  <p className="text-xs text-muted-foreground">Configure how you receive payments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>
              Your best-selling items
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sales data yet. Start selling to see your top products!
              </p>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sales_count} sold · ${product.revenue?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function getSellerStats(sellerId: string) {
  try {
    // Get active products count
    const { count: activeProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    // Get orders containing this seller's products
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*');

    let totalRevenue = 0;
    let totalOrders = 0;
    const productSales = new Map<string, { id: string; name: string; count: number; revenue: number }>();

    if (orders && !ordersError) {
      orders.forEach((order: any) => {
        let hasSellerProduct = false;
        let orderSellerRevenue = 0;

        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.product?.sellerId === sellerId || item.sellerId === sellerId) {
              hasSellerProduct = true;
              const itemRevenue = item.product.price * item.quantity;
              orderSellerRevenue += itemRevenue;

              // Track product sales
              const productId = item.product.id;
              if (productSales.has(productId)) {
                const existing = productSales.get(productId)!;
                existing.count += item.quantity;
                existing.revenue += itemRevenue;
              } else {
                productSales.set(productId, {
                  id: productId,
                  name: item.product.name,
                  count: item.quantity,
                  revenue: itemRevenue
                });
              }
            }
          });
        }

        if (hasSellerProduct) {
          totalOrders++;
          totalRevenue += orderSellerRevenue;
        }
      });
    }

    // Get top 5 products by sales
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(p => ({ ...p, sales_count: p.count }));

    return {
      totalRevenue,
      totalOrders,
      activeProducts: activeProducts || 0,
      topProducts
    };
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      activeProducts: 0,
      topProducts: []
    };
  }
}
