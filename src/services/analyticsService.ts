'use server';

import { getOrders } from './orderService';
import { getProducts } from './productService';
import { getPaymentStats } from './paymentService';
import { getReviewsByProduct } from './reviewService';
import { AnalyticsData, Order, Product } from '@/lib/types';

export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const [orders, products, paymentStats] = await Promise.all([
      getOrders(),
      getProducts(),
      getPaymentStats(),
    ]);

    // Calculate total revenue from completed orders
    const completedOrders = orders.filter(o => o.paymentStatus === 'Paid');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

    // Get unique customers
    const uniqueCustomers = new Set(orders.map(o => o.customerEmail));
    const totalCustomers = uniqueCustomers.size;

    // Get recent orders (last 10)
    const recentOrders = orders.slice(0, 10);

    // Calculate top products by sales
    const productSales = new Map<string, number>();
    orders.forEach(order => {
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

    // Calculate revenue by month (last 12 months)
    const revenueByMonth = calculateRevenueByMonth(completedOrders);

    // Calculate orders by status
    const ordersByStatus: Record<Order['status'], number> = {
      'Pending': 0,
      'Processing': 0,
      'Shipped': 0,
      'Delivered': 0,
      'Cancelled': 0,
    };

    orders.forEach(order => {
      ordersByStatus[order.status]++;
    });

    return {
      totalRevenue,
      totalOrders: orders.length,
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
        'Processing': 0,
        'Shipped': 0,
        'Delivered': 0,
        'Cancelled': 0,
      },
    };
  }
}

function calculateRevenueByMonth(orders: Order[]): Array<{ month: string; revenue: number }> {
  const monthlyRevenue = new Map<string, number>();

  // Get last 12 months
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
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
