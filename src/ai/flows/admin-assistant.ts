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
• "Top selling products" - Best performers
• "Recent orders" - Latest activity
• "Revenue report" - Financial summary

**📦 Inventory Management:**
• "Low stock report" - Items needing restock
• "Inventory value" - Total stock worth
• "Out of stock items" - Urgent restocks

**✍️ Writing Assistance:**
• "Write a description for [product]" - Product copy
• "Create an announcement" - Promo banners
• "Draft an email" - Customer communications

**👥 Seller Management:**
• "Show sellers" - All seller accounts
• "Pending approvals" - Sellers awaiting review

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
