'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Eye, Percent } from "lucide-react";
import { formatAmount } from '@/lib/currency';

interface DailySale {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

interface Props {
  dailySales: DailySale[];
  topByRevenue: ProductPerformance[];
  topByViews: ProductPerformance[];
  topByConversion: ProductPerformance[];
}

export default function AnalyticsCharts({ dailySales, topByRevenue, topByViews, topByConversion }: Props) {
  // Calculate max values for chart scaling
  const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);
  const maxOrders = Math.max(...dailySales.map(d => d.orders), 1);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Daily revenue breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailySales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sales data yet. Start selling to see your revenue chart!
            </p>
          ) : (
            <div className="space-y-4">
              {/* Simple Bar Chart */}
              <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
                {dailySales.map((day, index) => (
                  <div key={day.date} className="flex flex-col items-center min-w-[24px] group">
                    <div className="relative flex-1 w-full flex items-end">
                      {/* Revenue bar */}
                      <div 
                        className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                        style={{ 
                          height: `${Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 5 : 0)}%`,
                          minHeight: day.revenue > 0 ? '4px' : '0'
                        }}
                        title={`${formatDate(day.date)}: $${formatAmount(day.revenue)} (${day.orders} orders)`}
                      />
                    </div>
                    {/* Show date label every 5 days */}
                    {index % 5 === 0 && (
                      <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                        {formatDate(day.date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold">
                    ${formatAmount(dailySales.reduce((sum, d) => sum + d.revenue, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">
                    {dailySales.reduce((sum, d) => sum + d.orders, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg/Day</p>
                  <p className="text-lg font-bold">
                    ${formatAmount(dailySales.reduce((sum, d) => sum + d.revenue, 0) / 30)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Product Performance
          </CardTitle>
          <CardDescription>
            Top performing products by different metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="revenue">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="revenue">By Revenue</TabsTrigger>
              <TabsTrigger value="views">By Views</TabsTrigger>
              <TabsTrigger value="conversion">By Conversion</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="mt-4">
              {topByRevenue.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No sales data yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {topByRevenue.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sales} sold
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${formatAmount(product.revenue)}</p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(product.revenue / topByRevenue[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="views" className="mt-4">
              {topByViews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No view data yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {topByViews.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sales} sold
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <p className="font-bold">{product.views.toLocaleString()}</p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(product.views / topByViews[0].views) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversion" className="mt-4">
              {topByConversion.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Not enough data yet. Products need at least 10 views.
                </p>
              ) : (
                <div className="space-y-4">
                  {topByConversion.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.views} views → {product.sales} sales
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <p className="font-bold text-purple-600">{product.conversionRate.toFixed(1)}%</p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((product.conversionRate / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
