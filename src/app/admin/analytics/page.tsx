
import SalesChart from "@/components/dashboard/sales-chart";
import { getSettings } from "../settings/actions";
import RecentOrdersTable from "@/components/dashboard/recent-orders-table";
import { getAnalytics } from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCurrencySymbol, formatAmount } from '@/lib/currency';

export default async function AnalyticsPage() {
    const [settings, analytics] = await Promise.all([
        getSettings(),
        getAnalytics(),
    ]);

    const currencySymbol = getCurrencySymbol(settings?.currency);

    // Calculate percentage change (mock data for now - in production, compare with previous period)
    const revenueChange = 12.5; // +12.5%
    const ordersChange = 8.3; // +8.3%
    const customersChange = 15.2; // +15.2%
    const productsChange = 3.1; // +3.1%

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-headline font-bold">Analytics Dashboard</h1>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold">{currencySymbol}{formatAmount(analytics.totalRevenue)}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600">+{revenueChange}%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-green-500/10">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-blue-600" />
                                    <span className="text-xs text-blue-600">+{ordersChange}%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-blue-500/10">
                                <ShoppingCart className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Customers</p>
                                <p className="text-2xl font-bold">{analytics.totalCustomers}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-purple-600" />
                                    <span className="text-xs text-purple-600">+{customersChange}%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-purple-500/10">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Products</p>
                                <p className="text-2xl font-bold">{analytics.totalProducts}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-3 w-3 text-orange-600" />
                                    <span className="text-xs text-orange-600">+{productsChange}%</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-orange-500/10">
                                <Package className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Order Status Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{analytics.ordersByStatus.Pending}</p>
                            <Badge variant="secondary" className="mt-1 bg-yellow-500/10 text-yellow-600">Pending</Badge>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{analytics.ordersByStatus.Processing}</p>
                            <Badge variant="secondary" className="mt-1 bg-blue-500/10 text-blue-600">Processing</Badge>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{analytics.ordersByStatus.Shipped}</p>
                            <Badge variant="secondary" className="mt-1 bg-purple-500/10 text-purple-600">Shipped</Badge>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{analytics.ordersByStatus.Delivered}</p>
                            <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-600">Delivered</Badge>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{analytics.ordersByStatus.Cancelled}</p>
                            <Badge variant="secondary" className="mt-1 bg-red-500/10 text-red-600">Cancelled</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {analytics.topProducts.map((item, index) => (
                                    <div key={item.product.id} className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/admin/products/edit/${item.product.id}`}
                                                className="font-medium hover:text-primary truncate block"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {currencySymbol}{item.product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{item.sales}</p>
                                            <p className="text-xs text-muted-foreground">sold</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No sales data available</p>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Chart */}
                <SalesChart currencySymbol={currencySymbol} revenueData={analytics.revenueByMonth} />
            </div>

            {/* Recent Orders */}
            <RecentOrdersTable />
        </div>
    )
}
