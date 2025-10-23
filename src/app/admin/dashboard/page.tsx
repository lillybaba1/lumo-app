
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

export default async function DashboardPage() {
  const [settings, analytics] = await Promise.all([
    getSettings(),
    getAnalytics(),
  ]);

  const currencySymbol = getCurrencySymbol(settings?.currency);

  // Get top selling product
  const topProduct = analytics.topProducts[0];
  const topProductName = topProduct ? topProduct.product.name : 'No sales yet';
  const topProductSales = topProduct ? `${topProduct.sales} sold` : 'Start selling';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`${currencySymbol}${analytics.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          change={`From ${analytics.totalOrders} orders`}
        />
        <StatsCard
          title="Total Orders"
          value={analytics.totalOrders.toString()}
          icon={ShoppingCart}
          change={`${analytics.ordersByStatus.Pending} pending`}
        />
        <StatsCard
            title="Best Seller"
            value={topProductName}
            icon={Package}
            change={topProductSales}
            valueClassName="text-xl"
        />
        <StatsCard
            title="Total Customers"
            value={analytics.totalCustomers.toString()}
            icon={Users}
            change={`${analytics.totalProducts} products`}
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <SalesChart currencySymbol={currencySymbol} revenueData={analytics.revenueByMonth} />
        <RecentOrdersTable />
      </div>
    </div>
  );
}
