'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getProducts } from '@/services/productService';
import { getOrders } from '@/services/orderService';
import { getSettings } from '@/services/settingsService';

// ==========================================
// SELLER AI ASSISTANT
// ==========================================
// For business account users (sellers) on their dashboard.
// Can help with:
// - Their own inventory management
// - Product descriptions and writing
// - Order management
// - Store insights
// Does NOT have platform-wide admin access.

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const SellerAssistantInputSchema = z.object({
  query: z.string().describe('The seller query for the assistant.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
  sellerId: z.string().optional().describe('The seller/business account ID.'),
});
export type SellerAssistantInput = z.infer<typeof SellerAssistantInputSchema>;

const SellerAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer from the AI seller assistant.'),
});
export type SellerAssistantOutput = z.infer<typeof SellerAssistantOutputSchema>;

// ==========================================
// WRITING ASSISTANCE FOR SELLERS
// ==========================================

async function handleWritingRequest(query: string, products: any[]): Promise<string | null> {
  const q = query.toLowerCase();
  
  // Product description writing
  if ((q.includes('write') || q.includes('create') || q.includes('generate') || q.includes('help')) && 
      (q.includes('description') || q.includes('product'))) {
    
    // Check if a specific product is mentioned
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
*Copy this and paste it in your product edit page!*`;
      } catch (err) {
        console.error('AI generation error:', err);
      }
    }
    
    // General help with description
    return `✍️ **Product Description Help**

I can write product descriptions for you! Tell me:
• Which product you want a description for
• Any specific features to highlight
• The tone you prefer (professional, casual, luxury, etc.)

**Your Products:**
${products.slice(0, 8).map(p => `• ${p.name}`).join('\n')}

**Example:** "Write a description for ${products[0]?.name || 'my product'}"`;
  }
  
  return null;
}

// ==========================================
// INVENTORY MANAGEMENT FOR SELLERS
// ==========================================

async function handleInventoryRequest(query: string, products: any[], sellerId?: string): Promise<string | null> {
  const q = query.toLowerCase();
  const settings = await getSettings();
  const threshold = settings.lowStockThreshold || 10;
  
  // Filter to seller's products if sellerId is provided
  const sellerProducts = sellerId 
    ? products.filter(p => p.sellerId === sellerId || p.businessId === sellerId)
    : products;
  
  // Low stock report
  if (q.includes('low stock') || q.includes('running low') || q.includes('restock') || 
      q.includes('inventory') || q.includes('stock')) {
    const lowStock = sellerProducts.filter(p => (p.stock || 0) < threshold && (p.stock || 0) > 0);
    const outOfStock = sellerProducts.filter(p => (p.stock || 0) === 0);
    const wellStocked = sellerProducts.filter(p => (p.stock || 0) >= threshold);
    
    let response = `📦 **Your Inventory Report**\n\n`;
    response += `**Total Products:** ${sellerProducts.length}\n\n`;
    
    if (outOfStock.length > 0) {
      response += `**🚨 OUT OF STOCK (${outOfStock.length}):**\n`;
      outOfStock.forEach(p => {
        response += `• ${p.name} - **Needs Restock!**\n`;
      });
      response += '\n';
    }
    
    if (lowStock.length > 0) {
      response += `**⚠️ LOW STOCK (${lowStock.length} items below ${threshold} units):**\n`;
      lowStock.forEach(p => {
        response += `• ${p.name} - ${p.stock} remaining\n`;
      });
      response += '\n';
    }
    
    if (wellStocked.length > 0) {
      response += `**✅ WELL STOCKED (${wellStocked.length}):**\n`;
      wellStocked.slice(0, 5).forEach(p => {
        response += `• ${p.name} - ${p.stock} units\n`;
      });
      if (wellStocked.length > 5) {
        response += `  ...and ${wellStocked.length - 5} more\n`;
      }
    }
    
    if (outOfStock.length === 0 && lowStock.length === 0) {
      response = `✅ **Great news!** All your products are well-stocked.\n\nNo items below the ${threshold} unit threshold.`;
    }
    
    // Add recommendations
    if (outOfStock.length > 0 || lowStock.length > 0) {
      response += `\n---\n**💡 Quick Actions:**\n`;
      response += `• Go to **My Products** to update stock levels\n`;
      response += `• Priority: Restock out-of-stock items first\n`;
      if (outOfStock.length > 0) {
        response += `• Consider temporarily hiding out-of-stock items`;
      }
    }
    
    return response;
  }
  
  // Stock value
  if (q.includes('value') || q.includes('worth') || q.includes('total')) {
    let totalValue = 0;
    let totalUnits = 0;
    
    sellerProducts.forEach(p => {
      const stock = p.stock || 0;
      const price = p.price || 0;
      totalValue += stock * price;
      totalUnits += stock;
    });
    
    return `💰 **Your Inventory Value**

• **Total Value:** $${totalValue.toFixed(2)}
• **Total Units:** ${totalUnits.toLocaleString()}
• **Products Listed:** ${sellerProducts.length}
• **Average Price:** $${sellerProducts.length > 0 ? (totalValue / totalUnits || 0).toFixed(2) : '0.00'}`;
  }
  
  return null;
}

// ==========================================
// ORDER MANAGEMENT FOR SELLERS
// ==========================================

async function handleOrdersRequest(query: string, sellerId?: string): Promise<string | null> {
  const q = query.toLowerCase();
  
  if (q.includes('order') || q.includes('sales') || q.includes('sold')) {
    try {
      const orders = await getOrders();
      
      // Filter to seller's orders if sellerId provided (check items for seller products)
      const sellerOrders = sellerId 
        ? orders.filter(o => (o as any).sellerId === sellerId || (o as any).items?.some((i: any) => i.sellerId === sellerId))
        : orders;
      
      if (sellerOrders.length === 0) {
        return `📦 **Your Orders**

No orders yet! Here are some tips to get started:
• Make sure your products have good descriptions
• Add high-quality images
• Set competitive prices
• Share your boutique link on social media`;
      }
      
      const recent = sellerOrders.slice(0, 5);
      const pending = sellerOrders.filter(o => o.status === 'Pending' || o.status === 'Paid' || o.status === 'Preparing');
      
      let response = `📦 **Your Orders Summary**\n\n`;
      response += `• Total Orders: ${sellerOrders.length}\n`;
      response += `• Pending/Processing: ${pending.length}\n\n`;
      
      response += `**Recent Orders:**\n`;
      recent.forEach(order => {
        const emoji = 
          order.status === 'Delivered' ? '✅' :
          order.status === 'Shipped' ? '🚚' :
          order.status === 'Preparing' ? '⚙️' :
          order.status === 'Paid' ? '💰' : '⏳';
        response += `${emoji} #${order.id.slice(0, 8)} - $${order.total?.toFixed(2) || '0.00'} (${order.status})\n`;
      });
      
      if (pending.length > 0) {
        response += `\n⚡ **Action Needed:** You have ${pending.length} order(s) to process!`;
      }
      
      return response;
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }
  
  return null;
}

// ==========================================
// MAIN SELLER ASSISTANT
// ==========================================

export async function sellerAssistant(
  input: SellerAssistantInput
): Promise<SellerAssistantOutput> {
  const { query, history, sellerId } = input;
  const q = query.toLowerCase().trim();

  console.log('[Seller AI] Query:', q, 'SellerId:', sellerId);

  try {
    const products = await getProducts();
    
    // Filter to seller's products if we have sellerId
    const sellerProducts = sellerId 
      ? products.filter(p => (p as any).sellerId === sellerId || (p as any).businessId === sellerId)
      : products;
    
    // ==========================================
    // GREETINGS & HELP
    // ==========================================
    
    const greetings = ['hi', 'hello', 'hey', 'help', 'what can you do'];
    if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.includes(g))) {
      return {
        answer: `👋 **Hello, Seller!** I'm your AI assistant for managing your store.

**I can help you with:**

📦 **Inventory:**
• "Show my inventory" - See stock levels
• "Low stock items" - What needs restocking
• "Inventory value" - Your stock worth

✍️ **Writing:**
• "Write a description for [product]" - Product copy
• "Help me describe my product" - Writing assistance

📋 **Orders:**
• "Show my orders" - Recent orders
• "Pending orders" - Orders needing action

**What would you like help with?**`
      };
    }

    // ==========================================
    // INVENTORY REQUESTS
    // ==========================================
    
    const inventoryResponse = await handleInventoryRequest(query, products, sellerId);
    if (inventoryResponse) {
      return { answer: inventoryResponse };
    }

    // ==========================================
    // WRITING REQUESTS
    // ==========================================
    
    const writingResponse = await handleWritingRequest(query, sellerProducts);
    if (writingResponse) {
      return { answer: writingResponse };
    }

    // ==========================================
    // ORDER REQUESTS
    // ==========================================
    
    const ordersResponse = await handleOrdersRequest(query, sellerId);
    if (ordersResponse) {
      return { answer: ordersResponse };
    }

    // ==========================================
    // AI-POWERED GENERAL RESPONSE
    // ==========================================
    
    try {
      const result = await ai.generate({
        prompt: `You are a helpful AI assistant for an e-commerce seller on JulaZone marketplace.

The seller is asking: "${query}"

Seller's store info:
- Products listed: ${sellerProducts.length}
- Total inventory units: ${sellerProducts.reduce((sum, p) => sum + (p.stock || 0), 0)}

Help them with their question. If they're asking about:
- Inventory/stock - Suggest they ask "show my inventory" or "low stock items"
- Writing descriptions - Offer to help write for a specific product
- Orders - Suggest "show my orders"

Be helpful, friendly, and concise. Use markdown for formatting.`
      });
      
      return { answer: result.text };
    } catch (aiErr) {
      console.error('[Seller AI] AI generation error:', aiErr);
    }

    // Fallback
    return {
      answer: `I'm here to help with your store! Try asking:

📦 **"Show my inventory"** - See your stock levels
✍️ **"Help me write a description"** - Product copy assistance  
📋 **"Show my orders"** - View recent orders

What would you like help with?`
    };

  } catch (error) {
    console.error('[Seller AI] Error:', error);
    return {
      answer: `I encountered an error. Please try again or rephrase your question.`
    };
  }
}
