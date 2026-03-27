'use server';

import { getOrders } from './orderService';
import { getProducts } from './productService';
import { getPaymentStats } from './paymentService';
import { getReviewsByProduct } from './reviewService';
import { getCategories } from './categoryService';
import { AnalyticsData, Order, Product } from '@/lib/types';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export async function getAnalytics(dateRange?: DateRange): Promise<AnalyticsData> {
  try {
    const [allOrders, products, paymentStats] = await Promise.all([
      getOrders(),
      getProducts(),
      getPaymentStats(),
    ]);

    // Filter orders by date range if provided
    let filteredOrders = allOrders;
    if (dateRange?.startDate || dateRange?.endDate) {
      filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (dateRange.startDate && orderDate < dateRange.startDate) return false;
        if (dateRange.endDate && orderDate > dateRange.endDate) return false;
        return true;
      });
    }

    // Calculate total revenue from completed orders
    const completedOrders = filteredOrders.filter(o => o.paymentStatus === 'Paid');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

    // Get unique customers
    const uniqueCustomers = new Set(filteredOrders.map(o => o.customerEmail));
    const totalCustomers = uniqueCustomers.size;

    // Get recent orders (last 10)
    const recentOrders = filteredOrders.slice(0, 10);

    // Calculate top products by sales
    const productSales = new Map<string, number>();
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const currentSales = productSales.get(item.product.id) || 0;
        productSales.set(item.product.id, currentSales + item.quantity);
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, sales]) => {
        const product = products.find(p => p.id === productId);
        return product ? { product, sales } : null;
      })
      .filter((item): item is { product: Product; sales: number } => item !== null)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    // Calculate revenue by month (last 12 months or filtered range)
    const revenueByMonth = calculateRevenueByMonth(completedOrders, dateRange);

    // Calculate orders by status
    const ordersByStatus: Record<Order['status'], number> = {
      'Pending': 0,
      'Paid': 0,
      'Preparing': 0,
      'Shipped': 0,
      'Delivered': 0,
      'Payout Pending': 0,
      'Completed': 0,
      'Disputed': 0,
      'Cancelled': 0,
    };

    filteredOrders.forEach(order => {
      ordersByStatus[order.status]++;;
    });

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      totalCustomers,
      totalProducts: products.length,
      recentOrders,
      topProducts,
      revenueByMonth,
      ordersByStatus,
    };
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    // Return empty analytics data on error
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      recentOrders: [],
      topProducts: [],
      revenueByMonth: [],
      ordersByStatus: {
        'Pending': 0,
        'Paid': 0,
        'Preparing': 0,
        'Shipped': 0,
        'Delivered': 0,
        'Payout Pending': 0,
        'Completed': 0,
        'Disputed': 0,
        'Cancelled': 0,
      },
    };
  }
}

function calculateRevenueByMonth(orders: Order[], dateRange?: DateRange): Array<{ month: string; revenue: number }> {
  const monthlyRevenue = new Map<string, number>();

  // Get last 12 months or use custom range
  const now = new Date();
  const months = dateRange?.startDate && dateRange?.endDate
    ? getMonthsBetween(dateRange.startDate, dateRange.endDate)
    : 12;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
    monthlyRevenue.set(monthKey, 0);
  }

  // Calculate revenue for each month
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    const monthKey = orderDate.toISOString().substring(0, 7);

    if (monthlyRevenue.has(monthKey)) {
      const currentRevenue = monthlyRevenue.get(monthKey) || 0;
      monthlyRevenue.set(monthKey, currentRevenue + order.total);
    }
  });

  // Convert to array and format month names
  return Array.from(monthlyRevenue.entries())
    .map(([monthKey, revenue]) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return { month: monthName, revenue };
    });
}

function getMonthsBetween(startDate: Date, endDate: Date): number {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                 (endDate.getMonth() - startDate.getMonth());
  return Math.max(1, Math.min(months + 1, 12)); // Between 1 and 12 months
}

// Export analytics data to CSV format
export async function exportAnalyticsToCSV(dateRange?: DateRange): Promise<string> {
  const analytics = await getAnalytics(dateRange);
  const orders = await getOrders();

  let csv = 'Analytics Report\n\n';
  csv += 'Summary\n';
  csv += 'Total Revenue,' + analytics.totalRevenue.toFixed(2) + '\n';
  csv += 'Total Orders,' + analytics.totalOrders + '\n';
  csv += 'Total Customers,' + analytics.totalCustomers + '\n';
  csv += 'Total Products,' + analytics.totalProducts + '\n\n';

  csv += 'Order Status Distribution\n';
  csv += 'Status,Count\n';
  Object.entries(analytics.ordersByStatus).forEach(([status, count]) => {
    csv += `${status},${count}\n`;
  });

  csv += '\nTop Selling Products\n';
  csv += 'Product Name,Price,Sales\n';
  analytics.topProducts.forEach(item => {
    csv += `"${item.product.name}",${item.product.price},${item.sales}\n`;
  });

  csv += '\nMonthly Revenue\n';
  csv += 'Month,Revenue\n';
  analytics.revenueByMonth.forEach(item => {
    csv += `${item.month},${item.revenue.toFixed(2)}\n`;
  });

  return csv;
}

// Get sales by category
export async function getSalesByCategory(dateRange?: DateRange): Promise<Array<{ category: string; sales: number; revenue: number }>> {
  try {
    const [orders, categories] = await Promise.all([
      getOrders(),
      getCategories(),
    ]);

    // Filter by date range
    let filteredOrders = orders;
    if (dateRange?.startDate || dateRange?.endDate) {
      filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        if (dateRange.startDate && orderDate < dateRange.startDate) return false;
        if (dateRange.endDate && orderDate > dateRange.endDate) return false;
        return true;
      });
    }

    const categorySales = new Map<string, { sales: number; revenue: number }>();

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.product.category || 'Uncategorized';
        const current = categorySales.get(category) || { sales: 0, revenue: 0 };
        categorySales.set(category, {
          sales: current.sales + item.quantity,
          revenue: current.revenue + (order.paymentStatus === 'Paid' ? item.product.price * item.quantity : 0),
        });
      });
    });

    return Array.from(categorySales.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error('Failed to get sales by category:', error);
    return [];
  }
}

export async function getProductAnalytics(productId: string): Promise<{
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  salesByMonth: Array<{ month: string; sales: number }>;
}> {
  try {
    const [orders, reviews] = await Promise.all([
      getOrders(),
      getReviewsByProduct(productId),
    ]);

    // Calculate total sales for this product
    let totalSales = 0;
    let totalRevenue = 0;
    const salesByMonthMap = new Map<string, number>();

    // Get last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      salesByMonthMap.set(monthKey, 0);
    }

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product.id === productId) {
          totalSales += item.quantity;
          if (order.paymentStatus === 'Paid') {
            totalRevenue += item.product.price * item.quantity;
          }

          // Track sales by month
          const orderDate = new Date(order.createdAt);
          const monthKey = orderDate.toISOString().substring(0, 7);
          if (salesByMonthMap.has(monthKey)) {
            const currentSales = salesByMonthMap.get(monthKey) || 0;
            salesByMonthMap.set(monthKey, currentSales + item.quantity);
          }
        }
      });
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    // Format sales by month
    const salesByMonth = Array.from(salesByMonthMap.entries())
      .map(([monthKey, sales]) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return { month: monthName, sales };
      });

    return {
      totalSales,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      salesByMonth,
    };
  } catch (error) {
    console.error(`Failed to fetch analytics for product ${productId}:`, error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalReviews: 0,
      salesByMonth: [],
    };
  }
}

export async function getCustomerAnalytics(customerEmail: string): Promise<{
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  ordersThisMonth: number;
  ordersThisYear: number;
}> {
  try {
    const allOrders = await getOrders();
    const customerOrders = allOrders.filter(o => o.customerEmail === customerEmail);

    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, order) => sum + order.total, 0);

    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate orders this month
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const ordersThisMonth = customerOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
    }).length;

    const ordersThisYear = customerOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getFullYear() === thisYear;
    }).length;

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      ordersThisMonth,
      ordersThisYear,
    };
  } catch (error) {
    console.error(`Failed to fetch analytics for customer ${customerEmail}:`, error);
    return {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      ordersThisMonth: 0,
      ordersThisYear: 0,
    };
  }
}
