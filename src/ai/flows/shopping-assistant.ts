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
    const res = await productQuestionAnswering({ question, productDetails });
    return { answer: res.answer };
  } catch (err) {
    console.error('shoppingAssistant error:', err);
    return { answer: "I'm sorry — I couldn't complete that request right now." };
  }
}
