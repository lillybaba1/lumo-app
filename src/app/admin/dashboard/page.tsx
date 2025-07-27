import { DollarSign, ShoppingCart, Users, CreditCard } from 'lucide-react';
import StatsCard from '@/components/dashboard/stats-card';
import SalesChart from '@/components/dashboard/sales-chart';
import RecentOrdersTable from '@/components/dashboard/recent-orders-table';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-headline font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard 
          title="Total Revenue" 
          value="$45,231.89"
          icon={DollarSign}
          change="+20.1% from last month"
        />
        <StatsCard 
          title="Total Orders"
          value="+2350"
          icon={ShoppingCart}
          change="+180.1% from last month"
        />
        <StatsCard
            title="Sales"
            value="+12,234"
            icon={CreditCard}
            change="+19% from last month"
        />
        <StatsCard
            title="Active Now"
            value="+573"
            icon={Users}
            change="+201 since last hour"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SalesChart />
        </div>
        <div className="lg:col-span-2">
          <RecentOrdersTable />
        </div>
      </div>
    </div>
  );
}
