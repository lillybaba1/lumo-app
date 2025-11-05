"use server";

import { z } from 'zod';
import { getProducts } from '@/services/productService';
import { getOrders } from '@/services/orderService';
import { getAnalytics } from '@/services/analyticsService';
import { getSettings } from '@/services/settingsService';
import { productQuestionAnswering } from './product-question-answering';
import { getProductRecommendations } from './product-recommendation';

// Admin command handler - provides business insights and data queries
async function handleAdminCommand(query: string, products: any[]): Promise<string | null> {
  const q = query.toLowerCase().trim();
  console.log('[Admin Handler] Checking query:', q);

  // Low stock products
  if (q.includes('low stock') || q.includes('running low') || q.includes('inventory alert')) {
    const settings = await getSettings();
    const threshold = settings.lowStockThreshold || 10;
    const lowStockItems = products.filter(p => (p.stock || 0) < threshold);

    if (lowStockItems.length === 0) {
      return `✅ **Good news!** All products are well-stocked (above ${threshold} units). No inventory alerts at the moment.`;
    }

    const items = lowStockItems.slice(0, 10).map(p =>
      `• **${p.name}** - Only ${p.stock || 0} left in stock`
    ).join('\n');

    return `⚠️ **Low Stock Alert**\n\nFound ${lowStockItems.length} product(s) below the threshold of ${threshold} units:\n\n${items}\n\n${lowStockItems.length > 10 ? `\n...and ${lowStockItems.length - 10} more. Visit the Products page to see all.` : ''}`;
  }

  // Today's orders
  if (q.includes('today') && (q.includes('order') || q.includes('sale'))) {
    const orders = await getOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    const revenue = todayOrders
      .filter(o => o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + o.total, 0);

    if (todayOrders.length === 0) {
      return `📊 **Today's Orders**: No orders received yet today. Keep an eye on the dashboard for updates!`;
    }

    return `📊 **Today's Orders Summary**\n\n• **Total Orders**: ${todayOrders.length}\n• **Revenue**: $${revenue.toFixed(2)}\n• **Pending**: ${todayOrders.filter(o => o.status === 'Pending').length}\n• **Processing**: ${todayOrders.filter(o => o.status === 'Processing').length}\n\nVisit the Orders page for detailed information.`;
  }

  // Sales summary / analytics
  if ((q.includes('sales') || q.includes('revenue') || q.includes('analytics')) &&
      (q.includes('summary') || q.includes('report') || q.includes('overview'))) {
    const analytics = await getAnalytics();
    const settings = await getSettings();
    const currencySymbol = settings.currency === 'GMD' ? 'D' : '$';

    return `📈 **Sales Summary**\n\n• **Total Revenue**: ${currencySymbol}${analytics.totalRevenue.toFixed(2)}\n• **Total Orders**: ${analytics.totalOrders}\n• **Total Customers**: ${analytics.totalCustomers}\n• **Total Products**: ${analytics.totalProducts}\n\n**Order Status:**\n• Pending: ${analytics.ordersByStatus.Pending}\n• Processing: ${analytics.ordersByStatus.Processing}\n• Shipped: ${analytics.ordersByStatus.Shipped}\n• Delivered: ${analytics.ordersByStatus.Delivered}\n• Cancelled: ${analytics.ordersByStatus.Cancelled}\n\nFor detailed analytics, visit the Analytics Dashboard.`;
  }

  // Top selling products
  if (q.includes('top') && (q.includes('product') || q.includes('selling') || q.includes('seller'))) {
    const analytics = await getAnalytics();

    if (analytics.topProducts.length === 0) {
      return `📦 No sales data available yet. Once customers start purchasing, I'll show you the top sellers!`;
    }

    const top = analytics.topProducts.slice(0, 5).map((item, idx) =>
      `${idx + 1}. **${item.product.name}** - ${item.sales} sales ($${item.product.price})`
    ).join('\n');

    return `🏆 **Top Selling Products**\n\n${top}\n\nVisit the Analytics page for the complete list and detailed insights.`;
  }

  // Out of stock products
  if (q.includes('out of stock') || q.includes('no stock') || q.includes('sold out')) {
    const outOfStock = products.filter(p => (p.stock || 0) === 0);

    if (outOfStock.length === 0) {
      return `✅ **Excellent!** No products are out of stock. All items are available for purchase.`;
    }

    const items = outOfStock.slice(0, 10).map(p => `• **${p.name}**`).join('\n');

    return `⚠️ **Out of Stock Alert**\n\n${outOfStock.length} product(s) are currently out of stock:\n\n${items}\n\n${outOfStock.length > 10 ? `\n...and ${outOfStock.length - 10} more.` : ''}\n\nConsider restocking these items soon!`;
  }

  // Admin greeting - special response (expanded to catch variations)
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ','))) {
    const analytics = await getAnalytics();
    const lowStockItems = products.filter(p => (p.stock || 0) < 10).length;

    return `👋 **Hello, Admin!** I'm Luna, your AI business assistant.\n\n**Quick Overview:**\n• Total Products: ${products.length}\n• Total Orders: ${analytics.totalOrders}\n• Revenue: $${analytics.totalRevenue.toFixed(2)}\n${lowStockItems > 0 ? `• ⚠️ ${lowStockItems} low stock alert(s)\n` : ''}\n**I can help you with:**\n• "Show low stock products"\n• "What are today's orders?"\n• "Sales summary"\n• "Top selling products"\n• "Out of stock items"\n\nWhat would you like to know?`;
  }

  // Meta questions about admin status/role - EXPANDED PATTERNS
  if (
    (q.includes('notice') && (q.includes('role') || q.includes('admin'))) ||
    (q.includes('know') && q.includes('role')) ||
    (q.includes('do you') && q.includes('role')) ||
    q === 'my role' ||
    q === 'role'
  ) {
    console.log('[Admin Handler] MATCHED: Meta-question about admin role');
    return `✅ **Yes, I recognize you as an Admin!** I have special capabilities to help you manage your business:\n\n• **Inventory Management**: Ask about low stock or out of stock items\n• **Sales Analytics**: Get revenue summaries and top products\n• **Order Tracking**: Check today's orders and their status\n• **Business Insights**: I can provide data-driven insights\n\nTry asking: "Show low stock products" or "What are today's orders?"`;
  }

  if (q.includes('who am i') || q.includes('what is my role') || (q.includes('am i') && q.includes('admin'))) {
    console.log('[Admin Handler] MATCHED: Who am I question');
    return `🔐 **You are an Admin** of the Lumo store. I can provide you with business insights and management tools that regular customers don't have access to. How can I assist you with managing your store today?`;
  }

  // No admin command matched
  console.log('[Admin Handler] No admin command matched');
  return null;
}

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ShoppingAssistantInputSchema = z.object({
  query: z.string().describe('The user query for the shopping assistant.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
  userRole: z.enum(['customer', 'admin']).optional().describe('The role of the user (admin or customer).'),
});
export type ShoppingAssistantInput = z.infer<typeof ShoppingAssistantInputSchema>;

const ShoppingAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer from the AI shopping assistant.'),
});
export type ShoppingAssistantOutput = z.infer<typeof ShoppingAssistantOutputSchema>;

// Implemented server-side shopping assistant. It builds a compact product
// context from Firestore (or mock data via productService fallbacks) and
// delegates to the productQuestionAnswering flow. For simple "recommend"
// queries we also try the recommendation flow.
// ADMIN FEATURES: When userRole is 'admin', provides business insights and data queries.
export async function shoppingAssistant(
  input: ShoppingAssistantInput
): Promise<ShoppingAssistantOutput> {
  // Note: do not early-return based on environment flags here. The
  // API route (`/api/assistant`) controls runtime selection. If the
  // runtime doesn't support required libs the flow will throw and we
  // will return a graceful fallback below.

  const { query, history, userRole } = input;
  const isAdmin = userRole === 'admin';

  console.log('[AI Flow] shoppingAssistant called - userRole:', userRole, 'isAdmin:', isAdmin, 'query:', query);

  try {
    // Fetch a list of products to provide context to the model.
    const products = await getProducts();
    console.log('[AI Flow] Products fetched:', products.length);

    // ADMIN-SPECIFIC FEATURES: Handle SPECIFIC admin commands only
    // For general questions, let Gemini AI handle with admin context
    if (isAdmin) {
      console.log('[AI Flow] User is admin, checking for specific admin commands...');
      const q = query.toLowerCase().trim();

      // Only intercept specific data queries, not general questions
      const isSpecificCommand =
        q.includes('low stock') || q.includes('running low') || q.includes('inventory alert') ||
        (q.includes('today') && (q.includes('order') || q.includes('sale'))) ||
        ((q.includes('sales') || q.includes('revenue') || q.includes('analytics')) && (q.includes('summary') || q.includes('report') || q.includes('overview'))) ||
        (q.includes('top') && (q.includes('product') || q.includes('selling') || q.includes('seller'))) ||
        q.includes('out of stock') || q.includes('no stock') || q.includes('sold out');

      if (isSpecificCommand) {
        const adminResponse = await handleAdminCommand(query, products);
        if (adminResponse) {
          console.log('[AI Flow] Specific admin command matched! Response length:', adminResponse.length);
          return { answer: adminResponse };
        }
      } else {
        console.log('[AI Flow] Not a specific command, letting Gemini AI handle with admin context');
      }
    }

    const maxProducts = 12;
    const slice = products.slice(0, maxProducts);

    const productDetails = slice
      .map((p: any) => {
        const parts: string[] = [];
        if (p.id) parts.push(`ID: ${p.id}`);
        if (p.name) parts.push(`Name: ${p.name}`);
        if (p.price !== undefined) parts.push(`Price: ${p.price}`);
        if (p.category) parts.push(`Category: ${p.category}`);
        if (p.description) parts.push(`Description: ${String(p.description).slice(0, 240)}`);
        return parts.join(' | ');
      })
      .join('\n');

    // Quick heuristic: if user asks for recommendations, call the recommendation flow.
    const lower = query.toLowerCase();
    if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('what should i buy')) {
      try {
        const rec = await getProductRecommendations({
          userId: 'anonymous',
          browsingHistory: (history || []).map(h => h.content).slice(-10),
          pastPurchases: [],
        });
        // Map recommended ids back to names when available
        const recommended = (rec.recommendedProducts || []).map(id => {
          const prod = products.find((p: any) => String(p.id) === String(id));
          return prod ? `${prod.name} (ID: ${prod.id})` : String(id);
        });
        const answer = `Recommended products: ${recommended.join(', ')}\n\nReasoning: ${rec.reasoning || 'No reasoning provided.'}`;
        return { answer };
      } catch (recErr) {
        // fall through to QA flow if recommendation failed
        console.error('Recommendation flow failed:', recErr);
      }
    }

    // Otherwise use the product question answering flow with product context.
    const question = query;

    // Format conversation history for the AI to maintain context
    const roleLabel = isAdmin ? 'Admin' : 'Customer';
    const conversationHistory = history && history.length > 0
      ? history.map(msg => `${msg.role === 'user' ? roleLabel : 'Luna'}: ${msg.content}`).join('\n')
      : undefined;

    try {
      const res = await productQuestionAnswering({
        question,
        productDetails,
        conversationHistory,
        userRole
      });
      if (res && res.answer) {
        console.log('[AI] Gemini response successful');
        return { answer: res.answer };
      }
      console.warn('[AI] Gemini returned empty response, falling back');
      // fallthrough to local fallback below
    } catch (qaErr) {
      const errorMsg = qaErr instanceof Error ? qaErr.message : String(qaErr);
      console.error('[AI] Gemini failed, falling back to local search. Error:', errorMsg);
      // Continue to a local fallback that can answer simple queries from product data.
    }

    // Local fallback: simple keyword search over the fetched products.
    try {
      const q = query.toLowerCase().trim();

      // Handle negative responses - user is declining
      const negatives = ['no', 'nope', 'no thanks', 'not interested', 'nothing', 'never mind'];
      if (negatives.some(n => q === n || q === n + '.')) {
        return {
          answer: "No problem! Is there anything else I can help you with? I can help you search for products, answer questions, or provide recommendations."
        };
      }

      // Handle greetings (only for non-admin, admin greetings handled above)
      if (!isAdmin) {
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you'];
        if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ',') || q.includes(g))) {
          return {
            answer: "Hello! 👋 Welcome to Lumo! I'm Luna, your shopping assistant. I'm here to help you find the perfect products. What are you looking for today?"
          };
        }
      }

      // Handle follow-up questions without AI context
      const followUps = ['do you have them', 'tell me more', 'more info', 'more information', 'details'];
      if (followUps.some(f => q.includes(f))) {
        const lastUserMessage = history?.filter(m => m.role === 'user').slice(-2, -1)[0];
        if (lastUserMessage) {
          return {
            answer: `I'd love to provide more details! However, I need my AI connection to give you comprehensive information. Could you please be more specific about which product you'd like to know more about? For example, ask about "Hydrating Face Mask details" or "tell me about the Wireless Headphones".`
          };
        }
      }

      const tokens = q.split(/\s+/).filter(Boolean);

      // Try fuzzy matching for common typos (e.g., "sikn" -> "skin")
      const fuzzyTokens = tokens.map(token => {
        if (token.match(/^sk?i[kn]+$/)) return 'skin'; // sikn, skin, skiin -> skin
        if (token.match(/^ca?re?$/)) return 'care'; // care, car -> care
        return token;
      });

      const matches = slice.filter((p: any) => {
        const hay = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
        return fuzzyTokens.every(t => hay.includes(t));
      });

      if (matches.length === 0) {
        // If no exact-match, try looser matching on any token
        const loose = slice.filter((p: any) => {
          const hay = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
          return fuzzyTokens.some(t => hay.includes(t));
        });
        if (loose.length === 0) {
          return {
            answer: "I couldn't find any matching products. Could you try describing what you're looking for differently? For example, try 'electronics', 'fashion', or 'skincare'."
          };
        }
        const top = loose.slice(0, 4).map((p: any) => `• ${p.name} — $${p.price || '??'} (${p.category || 'General'})`);
        return {
          answer: `I found these products that might interest you:\n\n${top.join('\n')}\n\nWould you like to know more about any of these?`
        };
      }

      const topMatches = matches.slice(0, 6).map((p: any) => {
        const desc = p.description ? `\n  ${String(p.description).slice(0, 100)}${String(p.description).length > 100 ? '...' : ''}` : '';
        return `• **${p.name}** — $${p.price || '??'} (${p.category || 'General'})${desc}`;
      });
      return {
        answer: `Great! Here are the products I found:\n\n${topMatches.join('\n\n')}\n\nWould you like more details about any of these?`
      };
    } catch (localErr) {
      console.error('Local fallback failed:', localErr);
      return {
        answer: "I'm having trouble processing your request right now. Please try again or rephrase your question."
      };
    }
  } catch (err) {
    console.error('shoppingAssistant error:', err);
    return { answer: "I'm sorry — I couldn't complete that request right now." };
  }
}
