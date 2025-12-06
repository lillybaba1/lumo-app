import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, TrendingUp, DollarSign, ShoppingCart, 
  Eye, Users, Package, ArrowUp, ArrowDown 
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AnalyticsCharts from "./analytics-charts";

export const dynamic = 'force-dynamic';

async function getSellerAnalytics(sellerId: string) {
  try {
    // Get all orders
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Get seller's products
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('seller_id', sellerId);

    // Get boutique for page views
    const { data: boutique } = await supabaseAdmin
      .from('boutiques')
      .select('*')
      .eq('business_account_id', sellerId)
      .single();

    // Calculate daily/weekly/monthly stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    let todayRevenue = 0;
    let weekRevenue = 0;
    let monthRevenue = 0;
    let lastMonthRevenue = 0;
    let todayOrders = 0;
    let weekOrders = 0;
    let monthOrders = 0;
    let lastMonthOrders = 0;

    // Daily breakdown for the last 30 days
    const dailySales: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dailySales.push({
        date: date.toISOString().split('T')[0],
        revenue: 0,
        orders: 0
      });
    }

    // Product performance
    const productPerformance = new Map<string, { 
      id: string; 
      name: string; 
      views: number; 
      sales: number; 
      revenue: number;
      conversionRate: number;
    }>();

    // Initialize product performance
    products?.forEach(p => {
      productPerformance.set(p.id, {
        id: p.id,
        name: p.name,
        views: p.view_count || 0,
        sales: 0,
        revenue: 0,
        conversionRate: 0
      });
    });

    // Process orders
    orders?.forEach((order: any) => {
      const orderDate = new Date(order.created_at);
      const orderDateStr = orderDate.toISOString().split('T')[0];
      
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.product?.sellerId === sellerId || item.sellerId === sellerId) {
            const itemRevenue = (item.product?.price || item.price || 0) * item.quantity;
            
            // Update daily sales
            const dailyEntry = dailySales.find(d => d.date === orderDateStr);
            if (dailyEntry) {
              dailyEntry.revenue += itemRevenue;
              dailyEntry.orders += 1;
            }

            // Today
            if (orderDate >= today) {
              todayRevenue += itemRevenue;
              todayOrders += 1;
            }
            // This week
            if (orderDate >= thisWeekStart) {
              weekRevenue += itemRevenue;
              weekOrders += 1;
            }
            // This month
            if (orderDate >= thisMonthStart) {
              monthRevenue += itemRevenue;
              monthOrders += 1;
            }
            // Last month
            if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
              lastMonthRevenue += itemRevenue;
              lastMonthOrders += 1;
            }

            // Product performance
            const productId = item.product?.id || item.productId;
            if (productId && productPerformance.has(productId)) {
              const perf = productPerformance.get(productId)!;
              perf.sales += item.quantity;
              perf.revenue += itemRevenue;
            }
          }
        });
      }
    });

    // Calculate conversion rates
    productPerformance.forEach(perf => {
      if (perf.views > 0) {
        perf.conversionRate = (perf.sales / perf.views) * 100;
      }
    });

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthRevenue > 0 ? 100 : 0;
    
    const ordersGrowth = lastMonthOrders > 0 
      ? ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : monthOrders > 0 ? 100 : 0;

    // Top products by different metrics
    const productList = Array.from(productPerformance.values());
    const topByRevenue = [...productList].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const topByViews = [...productList].sort((a, b) => b.views - a.views).slice(0, 5);
    const topByConversion = [...productList]
      .filter(p => p.views >= 10) // Only products with meaningful views
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    // Total stats
    const totalProducts = products?.length || 0;
    const totalViews = productList.reduce((sum, p) => sum + p.views, 0);
    const totalSales = productList.reduce((sum, p) => sum + p.sales, 0);
    const overallConversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

    return {
      summary: {
        todayRevenue,
        weekRevenue,
        monthRevenue,
        todayOrders,
        weekOrders,
        monthOrders,
        revenueGrowth,
        ordersGrowth,
        totalProducts,
        totalViews,
        totalSales,
        overallConversionRate,
        followers: boutique?.follower_count || 0,
        likes: boutique?.like_count || 0,
      },
      dailySales,
      topByRevenue,
      topByViews,
      topByConversion,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      summary: {
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        todayOrders: 0,
        weekOrders: 0,
        monthOrders: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        totalProducts: 0,
        totalViews: 0,
        totalSales: 0,
        overallConversionRate: 0,
        followers: 0,
        likes: 0,
      },
      dailySales: [],
      topByRevenue: [],
      topByViews: [],
      topByConversion: [],
    };
  }
}

export default async function BusinessAnalyticsPage() {
  const { user, businessAccount } = await requireBusiness();
  const analytics = await getSellerAnalytics(businessAccount.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your sales performance and insights
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.summary.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.todayOrders} orders today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.summary.monthRevenue.toFixed(2)}</div>
            <div className="flex items-center text-xs">
              {analytics.summary.revenueGrowth >= 0 ? (
                <span className="text-green-600 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {analytics.summary.revenueGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600 flex items-center">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  {Math.abs(analytics.summary.revenueGrowth).toFixed(1)}%
                </span>
              )}
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.overallConversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              Views to sales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Products</p>
                <p className="text-2xl font-bold">{analytics.summary.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Sales</p>
                <p className="text-2xl font-bold">{analytics.summary.totalSales}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Followers</p>
                <p className="text-2xl font-bold">{analytics.summary.followers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600 dark:text-pink-400 font-medium">Likes</p>
                <p className="text-2xl font-bold">{analytics.summary.likes}</p>
              </div>
              <span className="text-3xl">❤️</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <AnalyticsCharts 
        dailySales={analytics.dailySales}
        topByRevenue={analytics.topByRevenue}
        topByViews={analytics.topByViews}
        topByConversion={analytics.topByConversion}
      />
    </div>
  );
}
