import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import StatsCard from '@/components/dashboard/stats-card';
import SalesChart from '@/components/dashboard/sales-chart';
import RecentOrdersTable from '@/components/dashboard/recent-orders-table';
import { getSettings } from '@/app/admin/settings/actions';
import { getAnalytics } from '@/services/analyticsService';
import { getCurrencySymbol } from '@/lib/currency';

export const dynamic = 'force-dynamic';

function formatCurrency(amount: number, currencySymbol: string) {
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  let settings = null;
  let analytics = null;
  let error = null;

  try {
    [settings, analytics] = await Promise.all([
      getSettings(),
      getAnalytics()
    ]);
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    error = err instanceof Error ? err.message : 'Failed to load dashboard data';
    // Provide default values
    analytics = {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      recentOrders: [],
      topProducts: [],
      revenueByMonth: [],
      ordersByStatus: {
        'Pending': 0,
        'Processing': 0,
        'Shipped': 0,
        'Delivered': 0,
        'Cancelled': 0,
      },
    };
  }

  // Show error message if data failed to load
  if (error) {
    console.warn('Dashboard loaded with default data due to error:', error);
  }

  const currencySymbol = getCurrencySymbol(settings?.currency);

  // Get top selling product - handle null analytics
  const bestSeller = analytics?.topProducts && analytics.topProducts.length > 0
    ? analytics.topProducts[0].product.name
    : 'N/A';

  const bestSellerSales = analytics?.topProducts && analytics.topProducts.length > 0
    ? `${analytics.topProducts[0].sales} sold`
    : 'No sales yet';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(analytics?.totalRevenue || 0, currencySymbol)}
          icon={DollarSign}
          change={`From ${analytics?.totalOrders || 0} paid orders`}
        />
        <StatsCard
          title="Orders"
          value={(analytics?.totalOrders || 0).toString()}
          icon={ShoppingCart}
          change={`${analytics?.ordersByStatus?.Pending || 0} pending, ${analytics?.ordersByStatus?.Delivered || 0} delivered`}
        />
        <StatsCard
            title="Best Seller"
            value={bestSeller}
            icon={Package}
            change={bestSellerSales}
            valueClassName="text-xl"
        />
        <StatsCard
            title="Total Customers"
            value={(analytics?.totalCustomers || 0).toString()}
            icon={Users}
            change={`${analytics?.totalProducts || 0} products available`}
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <SalesChart currencySymbol={currencySymbol} revenueData={analytics?.revenueByMonth || []} />
      </div>
    </div>
  );
}
