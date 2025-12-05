'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getProducts } from '@/services/productService';
import { getOrders } from '@/services/orderService';
import { getAnalytics } from '@/services/analyticsService';
import { getSettings } from '@/services/settingsService';
import { getAllBusinessAccounts } from '@/services/businessAccountService';
import { getPublishedBoutiques } from '@/services/boutiqueService';
import { getBoutiqueSettings } from '@/services/platformSettingsService';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ==========================================
// ADMIN AI ASSISTANT
// ==========================================
// Full admin capabilities:
// - View all platform data (analytics, orders, inventory, sellers)
// - Help with writing (product descriptions, announcements, emails)
// - Inventory management assistance
// - Business insights and recommendations
// ONLY visible to platform admin (APP_OWNER_ADMIN)

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const AdminAssistantInputSchema = z.object({
  query: z.string().describe('The admin query for the assistant.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
});
export type AdminAssistantInput = z.infer<typeof AdminAssistantInputSchema>;

const AdminAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer from the AI admin assistant.'),
});
export type AdminAssistantOutput = z.infer<typeof AdminAssistantOutputSchema>;

// ==========================================
// WRITING ASSISTANCE FUNCTIONS
// ==========================================

async function handleWritingRequest(query: string, products: any[]): Promise<string | null> {
  const q = query.toLowerCase();
  
  // Product description writing
  if ((q.includes('write') || q.includes('create') || q.includes('generate')) && 
      (q.includes('description') || q.includes('product'))) {
    
    // Extract product name if mentioned
    const productMatch = products.find(p => 
      q.includes(p.name.toLowerCase())
    );
    
    if (productMatch) {
      try {
        const result = await ai.generate({
          prompt: `Write a compelling, SEO-friendly product description for:
          
Product: ${productMatch.name}
Category: ${productMatch.category || 'General'}
Price: $${productMatch.price}
Current Description: ${productMatch.description || 'None'}

Write a professional description that:
1. Highlights key features and benefits
2. Uses persuasive language
3. Is 2-3 paragraphs
4. Includes a call to action

Return ONLY the description text, no headers or labels.`
        });
        
        return `✍️ **Product Description for "${productMatch.name}"**

${result.text}

---
*You can copy this description and use it on your product page!*`;
      } catch (err) {
        console.error('AI generation error:', err);
      }
    }
    
    return `✍️ **Product Description Help**

I can write product descriptions for you! Just tell me:
• Which product you want a description for
• Any specific features to highlight
• The tone you prefer (professional, casual, luxury, etc.)

**Example:** "Write a description for [Product Name]"

Your products:
${products.slice(0, 10).map(p => `• ${p.name}`).join('\n')}`;
  }
  
  // Announcement writing
  if ((q.includes('write') || q.includes('create')) && 
      (q.includes('announcement') || q.includes('banner') || q.includes('promo'))) {
    try {
      const result = await ai.generate({
        prompt: `Create a short, catchy announcement or promotional banner text for an e-commerce store. 
        
The announcement should:
1. Be attention-grabbing
2. Create urgency or excitement
3. Be concise (1-2 sentences max)
4. Include an emoji

Generate 3 different options.`
      });
      
      return `📢 **Announcement Ideas**

${result.text}

---
*Choose your favorite or ask me to write more specific ones!*`;
    } catch (err) {
      console.error('AI generation error:', err);
    }
  }
  
  // Email writing
  if ((q.includes('write') || q.includes('create') || q.includes('draft')) && 
      (q.includes('email') || q.includes('newsletter') || q.includes('message'))) {
    try {
      const analytics = await getAnalytics();
      const result = await ai.generate({
        prompt: `Write a professional marketing email for an e-commerce store.

Store stats for context:
- Total products: ${analytics.totalProducts}
- Total customers: ${analytics.totalCustomers}

Create a friendly, engaging email that:
1. Has a catchy subject line
2. Welcomes customers or announces something
3. Includes a call to action
4. Is personalized with [Customer Name] placeholder

Format:
Subject: [subject line]
---
[email body]`
      });
      
      return `📧 **Email Draft**

${result.text}

---
*Feel free to customize this for your needs!*`;
    } catch (err) {
      console.error('AI generation error:', err);
    }
  }
  
  return null;
}

// ==========================================
// INVENTORY MANAGEMENT FUNCTIONS
// ==========================================

async function handleInventoryRequest(query: string, products: any[]): Promise<string | null> {
  const q = query.toLowerCase();
  const settings = await getSettings();
  const threshold = settings.lowStockThreshold || 10;
  
  // Low stock report
  if (q.includes('low stock') || q.includes('running low') || q.includes('restock')) {
    const lowStock = products.filter(p => (p.stock || 0) < threshold && (p.stock || 0) > 0);
    const outOfStock = products.filter(p => (p.stock || 0) === 0);
    
    let response = `📦 **Inventory Report**\n\n`;
    
    if (outOfStock.length > 0) {
      response += `**🚨 OUT OF STOCK (${outOfStock.length} items):**\n`;
      outOfStock.slice(0, 10).forEach(p => {
        response += `• ${p.name} - **RESTOCK URGENTLY**\n`;
      });
      if (outOfStock.length > 10) response += `  ...and ${outOfStock.length - 10} more\n`;
      response += '\n';
    }
    
    if (lowStock.length > 0) {
      response += `**⚠️ LOW STOCK (${lowStock.length} items below ${threshold} units):**\n`;
      lowStock.slice(0, 10).forEach(p => {
        response += `• ${p.name} - ${p.stock} remaining\n`;
      });
      if (lowStock.length > 10) response += `  ...and ${lowStock.length - 10} more\n`;
    }
    
    if (outOfStock.length === 0 && lowStock.length === 0) {
      response = `✅ **All products are well-stocked!**\n\nNo items below the ${threshold} unit threshold.`;
    }
    
    // Add restock recommendations
    if (outOfStock.length > 0 || lowStock.length > 0) {
      response += `\n---\n**💡 Recommendations:**\n`;
      response += `• Priority: Restock out-of-stock items first\n`;
      response += `• Consider bulk ordering for frequently sold items\n`;
      response += `• Review sales velocity to optimize stock levels`;
    }
    
    return response;
  }
  
  // Stock value
  if (q.includes('stock value') || q.includes('inventory value') || q.includes('total value')) {
    let totalValue = 0;
    let totalUnits = 0;
    
    products.forEach(p => {
      const stock = p.stock || 0;
      const price = p.price || 0;
      totalValue += stock * price;
      totalUnits += stock;
    });
    
    return `💰 **Inventory Valuation**

• **Total Stock Value:** $${totalValue.toFixed(2)}
• **Total Units:** ${totalUnits.toLocaleString()}
• **Average Value per Unit:** $${totalUnits > 0 ? (totalValue / totalUnits).toFixed(2) : '0.00'}
• **Total Products:** ${products.length}

**By Category:**
${getCategoryBreakdown(products)}`;
  }
  
  // Update stock suggestion
  if (q.includes('update') && q.includes('stock')) {
    return `📝 **Stock Update Help**

To update stock levels, you can:

1. **Single Product:** Go to Products → Edit Product → Update Stock
2. **Bulk Update:** Go to Inventory → Bulk Actions
3. **Quick Update:** Click the stock number on any product card

**Would you like me to:**
• Show you products that need restocking?
• Calculate recommended reorder quantities?
• Analyze your best-selling items for stock planning?`;
  }
  
  return null;
}

function getCategoryBreakdown(products: any[]): string {
  const categories: Record<string, { count: number; value: number }> = {};
  
  products.forEach(p => {
    const cat = p.category || 'Uncategorized';
    if (!categories[cat]) categories[cat] = { count: 0, value: 0 };
    categories[cat].count += p.stock || 0;
    categories[cat].value += (p.stock || 0) * (p.price || 0);
  });
  
  return Object.entries(categories)
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([cat, data]) => `• ${cat}: ${data.count} units ($${data.value.toFixed(2)})`)
    .join('\n');
}

// ==========================================
// CUSTOMER EXPERIENCE FUNCTIONS
// ==========================================

async function getCustomerInsights(): Promise<string> {
  const orders = await getOrders();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Recent orders (last 30 days)
  const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  
  // Calculate metrics
  const totalOrders = recentOrders.length;
  const avgOrderValue = totalOrders > 0 
    ? recentOrders.reduce((sum, o) => sum + o.total, 0) / totalOrders 
    : 0;
  
  // Order status breakdown
  const statusCounts: Record<string, number> = {
    Pending: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0
  };
  recentOrders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  
  // Calculate fulfillment rate
  const completedOrders = statusCounts.Delivered + statusCounts.Shipped;
  const fulfillmentRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  
  // Calculate cancellation rate
  const cancellationRate = totalOrders > 0 ? (statusCounts.Cancelled / totalOrders) * 100 : 0;
  
  // Find slow-processing orders (pending for more than 2 days)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const slowOrders = recentOrders.filter(o => 
    o.status === 'Pending' && new Date(o.createdAt) < twoDaysAgo
  );
  
  // Unique customers
  const uniqueCustomers = new Set(recentOrders.map(o => o.customerEmail)).size;
  
  // Repeat customers (approximate)
  const customerOrderCounts: Record<string, number> = {};
  recentOrders.forEach(o => {
    customerOrderCounts[o.customerEmail] = (customerOrderCounts[o.customerEmail] || 0) + 1;
  });
  const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;

  return `
👥 **CUSTOMER EXPERIENCE INSIGHTS (Last 30 Days)**

**📊 Order Metrics:**
• Total Orders: ${totalOrders}
• Unique Customers: ${uniqueCustomers}
• Repeat Customers: ${repeatCustomers} (${uniqueCustomers > 0 ? ((repeatCustomers / uniqueCustomers) * 100).toFixed(1) : 0}%)
• Average Order Value: $${avgOrderValue.toFixed(2)}

**🚀 Fulfillment Performance:**
• Fulfillment Rate: ${fulfillmentRate.toFixed(1)}%
• Cancellation Rate: ${cancellationRate.toFixed(1)}% ${cancellationRate > 10 ? '⚠️ HIGH' : '✅'}
• Orders Pending: ${statusCounts.Pending} ${slowOrders.length > 0 ? `(${slowOrders.length} delayed ⚠️)` : ''}
• Orders Processing: ${statusCounts.Processing}
• Orders Shipped: ${statusCounts.Shipped}
• Orders Delivered: ${statusCounts.Delivered}

**⚠️ Attention Needed:**
${slowOrders.length > 0 ? `• ${slowOrders.length} orders pending for 2+ days - customers may be frustrated!` : '• No delayed orders - great job!'}
${cancellationRate > 10 ? '• High cancellation rate - investigate causes' : ''}
${statusCounts.Pending > 5 ? `• ${statusCounts.Pending} orders waiting - consider hiring more staff` : ''}
`.trim();
}

async function getSellerPerformance(): Promise<string> {
  const [orders, businessAccounts, boutiques] = await Promise.all([
    getOrders(),
    getAllBusinessAccounts(),
    getPublishedBoutiques({ limit: 100 })
  ]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);

  // Calculate seller metrics
  const sellerMetrics: Record<string, {
    name: string;
    totalSales: number;
    totalRevenue: number;
    ordersCount: number;
    avgOrderValue: number;
  }> = {};

  recentOrders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const sellerId = item.product?.sellerId;
        if (sellerId) {
          if (!sellerMetrics[sellerId]) {
            const seller = businessAccounts.find(b => b.id === sellerId);
            sellerMetrics[sellerId] = {
              name: seller?.businessName || 'Unknown Seller',
              totalSales: 0,
              totalRevenue: 0,
              ordersCount: 0,
              avgOrderValue: 0
            };
          }
          sellerMetrics[sellerId].totalSales += item.quantity;
          sellerMetrics[sellerId].totalRevenue += item.product.price * item.quantity;
          sellerMetrics[sellerId].ordersCount++;
        }
      });
    }
  });

  // Sort by revenue
  const topSellers = Object.entries(sellerMetrics)
    .map(([id, data]) => ({
      ...data,
      avgOrderValue: data.ordersCount > 0 ? data.totalRevenue / data.ordersCount : 0
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Active vs inactive sellers
  const activeSellers = businessAccounts.filter(b => b.status === 'ACTIVE').length;
  const inactiveSellers = businessAccounts.filter(b => b.status !== 'ACTIVE').length;

  let result = `
🏪 **SELLER PERFORMANCE (Last 30 Days)**

**Overview:**
• Active Sellers: ${activeSellers}
• Inactive/Pending: ${inactiveSellers}
• Published Boutiques: ${boutiques.length}

**🏆 Top Performing Sellers:**
`;

  if (topSellers.length === 0) {
    result += 'No sales data available yet.\n';
  } else {
    topSellers.forEach((seller, idx) => {
      result += `${idx + 1}. **${seller.name}**\n`;
      result += `   Revenue: $${seller.totalRevenue.toFixed(2)} | Sales: ${seller.totalSales} | Orders: ${seller.ordersCount}\n`;
    });
  }

  return result.trim();
}

async function getCustomerFeedback(): Promise<string> {
  // Get product reviews from database
  try {
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        products:product_id (name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!reviews || reviews.length === 0) {
      return `📝 **CUSTOMER FEEDBACK**

No reviews available yet. Encourage customers to leave reviews after their purchases!

**Tips to get more reviews:**
• Send follow-up emails after delivery
• Offer incentives for honest reviews
• Make the review process simple`;
    }

    // Calculate average rating
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    // Rating distribution
    const ratingDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;
    });

    // Low-rated reviews (potential issues)
    const lowRated = reviews.filter(r => r.rating <= 2);
    
    let result = `
📝 **CUSTOMER FEEDBACK ANALYSIS**

**Overall Rating:** ${'⭐'.repeat(Math.round(avgRating))} ${avgRating.toFixed(1)}/5
**Total Reviews:** ${reviews.length}

**Rating Distribution:**
• ⭐⭐⭐⭐⭐ (5): ${ratingDist[5]} reviews
• ⭐⭐⭐⭐ (4): ${ratingDist[4]} reviews
• ⭐⭐⭐ (3): ${ratingDist[3]} reviews
• ⭐⭐ (2): ${ratingDist[2]} reviews
• ⭐ (1): ${ratingDist[1]} reviews
`;

    if (lowRated.length > 0) {
      result += `\n**⚠️ Potential Issues (Low-Rated Reviews):**\n`;
      lowRated.slice(0, 5).forEach(r => {
        const productName = (r.products as any)?.name || 'Unknown Product';
        result += `• "${r.comment?.substring(0, 60) || 'No comment'}..." - ${productName}\n`;
      });
    } else {
      result += `\n✅ **No concerning low-rated reviews!**`;
    }

    return result.trim();
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return 'Unable to fetch customer feedback at this time.';
  }
}

async function getSalesAnalytics(): Promise<string> {
  const orders = await getOrders();
  const now = new Date();
  
  // Time periods
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const calcMetrics = (filteredOrders: any[]) => {
    const completed = filteredOrders.filter(o => o.status !== 'Cancelled');
    return {
      count: completed.length,
      revenue: completed.reduce((sum, o) => sum + o.total, 0)
    };
  };

  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  const yesterdayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= yesterday && d < today;
  });
  const thisWeekOrders = orders.filter(o => new Date(o.createdAt) >= thisWeek);
  const thisMonthOrders = orders.filter(o => new Date(o.createdAt) >= thisMonth);
  const lastMonthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= lastMonth && d <= lastMonthEnd;
  });

  const todayMetrics = calcMetrics(todayOrders);
  const yesterdayMetrics = calcMetrics(yesterdayOrders);
  const thisWeekMetrics = calcMetrics(thisWeekOrders);
  const thisMonthMetrics = calcMetrics(thisMonthOrders);
  const lastMonthMetrics = calcMetrics(lastMonthOrders);

  // Calculate growth
  const dailyGrowth = yesterdayMetrics.revenue > 0 
    ? ((todayMetrics.revenue - yesterdayMetrics.revenue) / yesterdayMetrics.revenue * 100)
    : (todayMetrics.revenue > 0 ? 100 : 0);
  
  const monthlyGrowth = lastMonthMetrics.revenue > 0
    ? ((thisMonthMetrics.revenue - lastMonthMetrics.revenue) / lastMonthMetrics.revenue * 100)
    : (thisMonthMetrics.revenue > 0 ? 100 : 0);

  return `
💰 **SALES ANALYTICS**

**Today:**
• Orders: ${todayMetrics.count}
• Revenue: $${todayMetrics.revenue.toFixed(2)}
${dailyGrowth >= 0 ? `• 📈 +${dailyGrowth.toFixed(1)}% vs yesterday` : `• 📉 ${dailyGrowth.toFixed(1)}% vs yesterday`}

**This Week:**
• Orders: ${thisWeekMetrics.count}
• Revenue: $${thisWeekMetrics.revenue.toFixed(2)}

**This Month:**
• Orders: ${thisMonthMetrics.count}
• Revenue: $${thisMonthMetrics.revenue.toFixed(2)}
${monthlyGrowth >= 0 ? `• 📈 +${monthlyGrowth.toFixed(1)}% vs last month` : `• 📉 ${monthlyGrowth.toFixed(1)}% vs last month`}

**Last Month:**
• Orders: ${lastMonthMetrics.count}
• Revenue: $${lastMonthMetrics.revenue.toFixed(2)}
`.trim();
}

// ==========================================
// ANALYTICS & INSIGHTS FUNCTIONS  
// ==========================================

async function getSystemOverview(): Promise<string> {
  const [analytics, settings, businessAccounts, boutiques, products] = await Promise.all([
    getAnalytics(),
    getSettings(),
    getAllBusinessAccounts(),
    getPublishedBoutiques({ limit: 100 }),
    getProducts(),
  ]);

  const activeSellers = businessAccounts.filter(b => b.status === 'ACTIVE').length;
  const pendingApproval = businessAccounts.filter(b => b.status === 'PENDING_APPROVAL').length;
  
  const tierCounts = {
    free: businessAccounts.filter(b => b.subscriptionTier === 'free').length,
    pro: businessAccounts.filter(b => b.subscriptionTier === 'pro').length,
    enterprise: businessAccounts.filter(b => b.subscriptionTier === 'enterprise').length,
  };

  const lowStockThreshold = settings.lowStockThreshold || 10;
  const lowStockProducts = products.filter(p => (p.stock || 0) < lowStockThreshold && (p.stock || 0) > 0);
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);

  const currencySymbol = settings.currency === 'GMD' ? 'D' : '$';

  return `
📊 **LUMO PLATFORM OVERVIEW**

**💰 Revenue & Orders:**
• Total Revenue: ${currencySymbol}${analytics.totalRevenue.toFixed(2)}
• Total Orders: ${analytics.totalOrders}
• Pending: ${analytics.ordersByStatus.Pending} | Processing: ${analytics.ordersByStatus.Processing}
• Shipped: ${analytics.ordersByStatus.Shipped} | Delivered: ${analytics.ordersByStatus.Delivered}

**📦 Products & Inventory:**
• Total Products: ${products.length}
• Low Stock: ${lowStockProducts.length} ⚠️
• Out of Stock: ${outOfStockProducts.length} 🚨

**👥 Sellers & Boutiques:**
• Total Sellers: ${businessAccounts.length} (${activeSellers} active)
• Pending Approval: ${pendingApproval}
• Boutiques: ${boutiques.length}
• Tiers: Free(${tierCounts.free}) | Pro(${tierCounts.pro}) | Enterprise(${tierCounts.enterprise})

**👤 Customers:** ${analytics.totalCustomers}
`.trim();
}

async function getTopProducts(): Promise<string> {
  const analytics = await getAnalytics();
  
  if (analytics.topProducts.length === 0) {
    return 'No sales data available yet.';
  }

  let result = '🏆 **Top Selling Products**\n\n';
  analytics.topProducts.slice(0, 10).forEach((item, idx) => {
    result += `${idx + 1}. **${item.product.name}** - ${item.sales} sales ($${item.product.price})\n`;
  });

  return result;
}

async function getRecentOrders(): Promise<string> {
  const orders = await getOrders();
  
  if (orders.length === 0) return 'No orders yet.';

  const sorted = orders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10);

  let result = '📦 **Recent Orders**\n\n';
  sorted.forEach(order => {
    const emoji = 
      order.status === 'Delivered' ? '✅' :
      order.status === 'Shipped' ? '🚚' :
      order.status === 'Processing' ? '⚙️' :
      order.status === 'Cancelled' ? '❌' : '⏳';
    
    result += `${emoji} #${order.id.slice(0, 8)} - $${order.total.toFixed(2)} (${order.status})\n`;
  });

  return result;
}

// ==========================================
// MAIN ADMIN ASSISTANT
// ==========================================

export async function adminAssistant(
  input: AdminAssistantInput
): Promise<AdminAssistantOutput> {
  const { query, history } = input;
  const q = query.toLowerCase().trim();

  console.log('[Admin AI] Query:', q);

  try {
    const products = await getProducts();
    
    // ==========================================
    // CAPABILITIES / HELP
    // ==========================================
    
    if (q.includes('what can you do') || q.includes('help') || q.includes('capabilities')) {
      return {
        answer: `🤖 **Admin AI Assistant - Your Platform Partner**

I have full admin access and can help you with:

**📊 Analytics & Insights:**
• "Show me the dashboard" - Platform overview
• "Sales analytics" - Revenue by day/week/month
• "Top selling products" - Best performers
• "Recent orders" - Latest activity

**👥 Customer Experience:**
• "Customer insights" - Order metrics & customer behavior
• "Customer feedback" - Review analysis & ratings
• "Fulfillment status" - Delivery performance

**🏪 Seller Management:**
• "Seller performance" - Top sellers & revenue by seller
• "Show sellers" - All seller accounts
• "Pending approvals" - Sellers awaiting review

**📦 Inventory Management:**
• "Low stock report" - Items needing restock
• "Inventory value" - Total stock worth
• "Out of stock items" - Urgent restocks

**✍️ Writing Assistance:**
• "Write a description for [product]" - Product copy
• "Create an announcement" - Promo banners
• "Draft an email" - Customer communications

**What would you like help with?**`
      };
    }

    // ==========================================
    // WRITING REQUESTS
    // ==========================================
    
    const writingResponse = await handleWritingRequest(query, products);
    if (writingResponse) {
      return { answer: writingResponse };
    }

    // ==========================================
    // INVENTORY REQUESTS
    // ==========================================
    
    const inventoryResponse = await handleInventoryRequest(query, products);
    if (inventoryResponse) {
      return { answer: inventoryResponse };
    }

    // ==========================================
    // GREETINGS
    // ==========================================
    
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(g => q === g || q.startsWith(g + ' '))) {
      const overview = await getSystemOverview();
      return {
        answer: `👋 **Hello, Admin!** I'm your AI assistant with full platform access.

${overview}

**Quick Actions:**
• "Help" - See all my capabilities
• "Low stock" - Inventory alerts
• "Write a description" - Content help
• "Recent orders" - Latest activity`
      };
    }

    // ==========================================
    // ANALYTICS QUERIES
    // ==========================================
    
    if (q.includes('overview') || q.includes('dashboard') || q.includes('status')) {
      const overview = await getSystemOverview();
      return { answer: overview };
    }

    if (q.includes('top') && (q.includes('product') || q.includes('selling'))) {
      const top = await getTopProducts();
      return { answer: top };
    }

    if (q.includes('order') || q.includes('recent')) {
      const orders = await getRecentOrders();
      return { answer: orders };
    }

    // ==========================================
    // CUSTOMER EXPERIENCE QUERIES
    // ==========================================

    if (q.includes('customer insight') || q.includes('customer experience') || 
        q.includes('customer metric') || q.includes('fulfillment') ||
        q.includes('what are customers experiencing') || q.includes('customer behavior')) {
      const insights = await getCustomerInsights();
      return { answer: insights };
    }

    if (q.includes('feedback') || q.includes('review') || q.includes('rating') ||
        q.includes('complaint') || q.includes('what customers think')) {
      const feedback = await getCustomerFeedback();
      return { answer: feedback };
    }

    if (q.includes('sales analytic') || q.includes('revenue') || 
        q.includes('sales report') || q.includes('how are sales')) {
      const sales = await getSalesAnalytics();
      return { answer: sales };
    }

    // ==========================================
    // SELLER QUERIES
    // ==========================================

    if (q.includes('seller performance') || q.includes('top seller') ||
        q.includes('best seller') || q.includes('seller revenue')) {
      const performance = await getSellerPerformance();
      return { answer: performance };
    }

    if (q.includes('seller') || q.includes('boutique')) {
      const businessAccounts = await getAllBusinessAccounts();
      const pending = businessAccounts.filter(b => b.status === 'PENDING_APPROVAL');
      const active = businessAccounts.filter(b => b.status === 'ACTIVE');
      
      let result = `👥 **Seller Overview**\n\n`;
      result += `• Total: ${businessAccounts.length}\n`;
      result += `• Active: ${active.length}\n`;
      result += `• Pending Approval: ${pending.length}\n\n`;
      
      if (pending.length > 0) {
        result += `**⏳ Pending Approval:**\n`;
        pending.slice(0, 5).forEach(s => {
          result += `• ${s.businessName}\n`;
        });
      }
      
      return { answer: result };
    }

    // ==========================================
    // AI-POWERED GENERAL RESPONSE
    // ==========================================
    
    // For complex queries, use AI
    try {
      const analytics = await getAnalytics();
      const context = `
Platform Stats:
- Products: ${products.length}
- Orders: ${analytics.totalOrders}
- Revenue: $${analytics.totalRevenue.toFixed(2)}
- Customers: ${analytics.totalCustomers}

Recent Products: ${products.slice(0, 5).map(p => p.name).join(', ')}
`;
      
      const result = await ai.generate({
        prompt: `You are an AI admin assistant for Lumo e-commerce platform. 
        
Context: ${context}

Admin's question: ${query}

Provide a helpful, professional response. If you don't have enough information, explain what you would need.
Format your response with markdown for readability.`
      });
      
      return { answer: result.text };
    } catch (aiErr) {
      console.error('[Admin AI] AI generation error:', aiErr);
    }

    // Fallback
    return {
      answer: `I can help you with that! Here are some things I can do:

• **Analytics:** "Show dashboard", "Top products", "Recent orders"
• **Inventory:** "Low stock", "Stock value", "Restock suggestions"  
• **Writing:** "Write description for [product]", "Create announcement"

What would you like to know?`
    };

  } catch (error) {
    console.error('[Admin AI] Error:', error);
    return {
      answer: `I encountered an error processing your request. Please try again or rephrase your question.`
    };
  }
}
