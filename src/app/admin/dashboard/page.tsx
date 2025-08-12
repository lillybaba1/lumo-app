
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import StatsCard from '@/components/dashboard/stats-card';
import SalesChart from '@/components/dashboard/sales-chart';
import RecentOrdersTable from '@/components/dashboard/recent-orders-table';
import { getSettings } from '@/app/admin/settings/actions';

export default async function DashboardPage() {
  const settings = await getSettings();
  const currencySymbol = settings?.currency ? (new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency }).formatToParts(1).find(p => p.type === 'currency')?.value || '$') : '$';
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard 
          title="Total Revenue" 
          value={`${currencySymbol}45,231.89`}
          icon={DollarSign}
          change="+20.1% from last month"
        />
        <StatsCard 
          title="Orders"
          value="+2350"
          icon={ShoppingCart}
          change="+180.1% from last month"
        />
        <StatsCard
            title="Best Seller"
            value="Hydrating Serum"
            icon={Package}
            change="Top product this month"
            valueClassName="text-xl"
        />
        <StatsCard
            title="New Customers"
            value="+573"
            icon={Users}
            change="+201 since last month"
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <SalesChart currencySymbol={currencySymbol} />
      </div>
    </div>
  );
}
