"use server";

import { z } from 'zod';
import { getProducts } from '@/services/productService';
import { productQuestionAnswering } from './product-question-answering';
import { getProductRecommendations } from './product-recommendation';

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

// Implemented server-side shopping assistant. It builds a compact product
// context from Firestore (or mock data via productService fallbacks) and
// delegates to the productQuestionAnswering flow. For simple "recommend"
// queries we also try the recommendation flow.
export async function shoppingAssistant(
  input: ShoppingAssistantInput
): Promise<ShoppingAssistantOutput> {
  // Note: do not early-return based on environment flags here. The
  // API route (`/api/assistant`) controls runtime selection. If the
  // runtime doesn't support required libs the flow will throw and we
  // will return a graceful fallback below.

  const { query, history } = input;

  try {
    // Fetch a list of products to provide context to the model.
    const products = await getProducts();
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
    const conversationHistory = history && history.length > 0
      ? history.map(msg => `${msg.role === 'user' ? 'Customer' : 'Luna'}: ${msg.content}`).join('\n')
      : undefined;

    try {
      const res = await productQuestionAnswering({
        question,
        productDetails,
        conversationHistory
      });
      if (res && res.answer) return { answer: res.answer };
      // fallthrough to local fallback below
    } catch (qaErr) {
      console.error('productQuestionAnswering failed, falling back to local search:', qaErr);
      // Continue to a local fallback that can answer simple queries from product data.
    }

    // Local fallback: simple keyword search over the fetched products.
    try {
      const q = query.toLowerCase().trim();

      // Handle greetings
      const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
      if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ','))) {
        return {
          answer: "Hello! 👋 Welcome to Lumo! I'm Luna, your shopping assistant. I'm here to help you find the perfect products. What are you looking for today?"
        };
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
