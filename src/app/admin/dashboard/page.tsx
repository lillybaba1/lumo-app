
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import StatsCard from '@/components/dashboard/stats-card';
import SalesChart from '@/components/dashboard/sales-chart';
import RecentOrdersTable from '@/components/dashboard/recent-orders-table';
import { getSettings } from '@/app/admin/settings/actions';
import { getAnalytics } from '@/services/analyticsService';

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

function formatCurrency(amount: number, currencySymbol: string) {
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function DashboardPage() {
  const [settings, analytics] = await Promise.all([
    getSettings(),
    getAnalytics()
  ]);

  const currencySymbol = getCurrencySymbol(settings?.currency);

  // Get top selling product
  const bestSeller = analytics.topProducts.length > 0
    ? analytics.topProducts[0].product.name
    : 'N/A';

  const bestSellerSales = analytics.topProducts.length > 0
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
          value={formatCurrency(analytics.totalRevenue, currencySymbol)}
          icon={DollarSign}
          change={`From ${analytics.totalOrders} paid orders`}
        />
        <StatsCard
          title="Orders"
          value={analytics.totalOrders.toString()}
          icon={ShoppingCart}
          change={`${analytics.ordersByStatus.Pending} pending, ${analytics.ordersByStatus.Delivered} delivered`}
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
            value={analytics.totalCustomers.toString()}
            icon={Users}
            change={`${analytics.totalProducts} products available`}
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <SalesChart currencySymbol={currencySymbol} revenueData={analytics.revenueByMonth} />
      </div>
    </div>
  );
}
