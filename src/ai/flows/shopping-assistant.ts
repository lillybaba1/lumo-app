"use server";

import { z } from 'zod';
import { getProducts } from '@/services/productService';
import { productQuestionAnswering } from './product-question-answering';
import { getProductRecommendations } from './product-recommendation';

// ==========================================
// CUSTOMER SHOPPING ASSISTANT (Luna)
// ==========================================
// This AI ONLY has access to product information.
// It helps customers find products, get recommendations, and answer product questions.
// NO admin features, NO business data, NO inventory management.

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ShoppingAssistantInputSchema = z.object({
  query: z.string().describe('The user query for the shopping assistant.'),
  history: z.array(MessageSchema).optional().describe('The conversation history.'),
});
export type ShoppingAssistantInput = z.infer<typeof ShoppingAssistantInputSchema>;

const ShoppingAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer from the AI shopping assistant.'),
});
export type ShoppingAssistantOutput = z.infer<typeof ShoppingAssistantOutputSchema>;

/**
 * Customer Shopping Assistant - Product queries only
 * This is the public-facing AI that helps customers shop.
 * It has NO access to admin data, inventory levels, sales, or business metrics.
 */
export async function shoppingAssistant(
  input: ShoppingAssistantInput
): Promise<ShoppingAssistantOutput> {
  const { query, history } = input;
  const q = query.toLowerCase().trim();

  console.log('[Shopping AI] Customer query:', q);

  try {
    // Fetch products for context
    const products = await getProducts();
    console.log('[Shopping AI] Products available:', products.length);

    // Customer greeting
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ','))) {
      return {
        answer: `👋 **Hello!** I'm Luna, your shopping assistant.

I can help you:
• Find products you're looking for
• Get recommendations based on your preferences
• Answer questions about our products
• Compare products and features

**What are you shopping for today?**`
      };
    }

    // If someone tries to ask for admin data, politely redirect
    if (q.includes('admin') || q.includes('inventory') || q.includes('stock level') || 
        q.includes('sales report') || q.includes('revenue') || q.includes('analytics') ||
        q.includes('orders today') || q.includes('business')) {
      return {
        answer: `I'm your shopping assistant and I can help you find and learn about products! 

For business-related questions, please contact our support team or log in to your admin account.

**How can I help you with your shopping today?**`
      };
    }

    // Build product context for AI
    const maxProducts = 15;
    const slice = products.slice(0, maxProducts);

    const productDetails = slice
      .map((p: any) => {
        const parts: string[] = [];
        if (p.name) parts.push(`Name: ${p.name}`);
        if (p.price !== undefined) parts.push(`Price: $${p.price}`);
        if (p.category) parts.push(`Category: ${p.category}`);
        if (p.description) parts.push(`Description: ${String(p.description).slice(0, 200)}`);
        // Note: We deliberately don't include stock info for customers
        return parts.join(' | ');
      })
      .join('\n');

    // Handle recommendation requests
    if (q.includes('recommend') || q.includes('suggest') || q.includes('what should i buy')) {
      try {
        const rec = await getProductRecommendations({
          userId: 'anonymous',
          browsingHistory: (history || []).map(h => h.content).slice(-10),
          pastPurchases: [],
        });
        
        const recommended = (rec.recommendedProducts || []).map(id => {
          const prod = products.find((p: any) => String(p.id) === String(id));
          return prod ? `• **${prod.name}** - $${prod.price}` : null;
        }).filter(Boolean);

        if (recommended.length > 0) {
          return {
            answer: `🎯 **Here are some products I think you'll love:**

${recommended.join('\n')}

${rec.reasoning ? `\n💡 *${rec.reasoning}*` : ''}

Would you like more details about any of these?`
          };
        }
      } catch (recErr) {
        console.error('Recommendation error:', recErr);
      }
    }

    // Use AI for product questions
    const conversationHistory = history && history.length > 0
      ? history.map(msg => `${msg.role === 'user' ? 'Customer' : 'Luna'}: ${msg.content}`).join('\n')
      : undefined;

    try {
      const res = await productQuestionAnswering({
        question: query,
        productDetails,
        conversationHistory,
        userRole: 'customer' // Always customer for this assistant
      });

      if (res && res.answer) {
        return { answer: res.answer };
      }
    } catch (qaErr) {
      console.error('[Shopping AI] AI error:', qaErr);
    }

    // Fallback
    return {
      answer: `I'd be happy to help you find what you're looking for! 

We have ${products.length} products available. Could you tell me:
• What type of product are you looking for?
• Any specific features or price range?

I'll help you find the perfect match!`
    };

  } catch (error) {
    console.error('[Shopping AI] Error:', error);
    return { 
      answer: "I'm having trouble right now. Please try again in a moment, or browse our products directly!" 
    };
  }
}
