import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, Plus } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

export default async function BusinessDashboardPage() {
  const { user, businessAccount } = await requireBusiness();

  // Fetch seller-specific stats
  const stats = await getSellerStats(businessAccount.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold">Dashboard</h1>
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
                  Your business account is under review. You can start adding products, but they won&apos;t be visible to customers until your account is approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Revenue Card - Visual Hierarchy Leader */}
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="h-24 w-24 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 dark:text-primary">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-3xl font-bold ${stats.totalRevenue > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
              ${stats.totalRevenue.toFixed(2)}
            </div>
            {stats.totalRevenue === 0 ? (
              <div className="mt-2">
                <Link href="/business/products/add" className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 group">
                  Start generating revenue 
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
            )}
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            {stats.totalOrders === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">Waiting for your first sale</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Orders with your products</p>
            )}
          </CardContent>
        </Card>

        {/* Active Products Card - With Action */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProducts}</div>
            {stats.activeProducts === 0 ? (
              <div className="mt-2">
                <Button variant="outline" size="sm" className="h-7 text-xs w-full" asChild>
                  <Link href="/business/products/add">
                    <Plus className="h-3 w-3 mr-1" /> Add Product
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Listed on marketplace</p>
            )}
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
            <p className="text-xs text-muted-foreground mt-1">Per order average</p>
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground">No top products yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-[250px]">
                  Once you start making sales, your best performers will appear here.
                </p>
                {stats.activeProducts === 0 ? (
                  <Button size="sm" asChild>
                    <Link href="/business/products/add">
                      Add Your First Product
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/business/products">
                      Manage Products
                    </Link>
                  </Button>
                )}
              </div>
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
