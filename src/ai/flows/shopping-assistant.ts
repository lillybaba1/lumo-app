'use server';

/**
 * @fileOverview AI Shopping Assistant that helps users with product queries,
 * availability, pricing, and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getProducts } from '@/services/productService';

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

export async function shoppingAssistant(
  input: ShoppingAssistantInput
): Promise<ShoppingAssistantOutput> {
  // Check if running in Edge runtime - if so, return fallback
  if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge') {
    return { answer: 'AI Assistant is not available in this environment. Please contact support for assistance.' };
  }

  // Check if API key is configured
  if (!process.env.GOOGLE_GENERATIVEAI_API_KEY) {
    return { answer: 'AI Assistant is currently unavailable. The service is being configured. Please try again later or contact support.' };
  }

  try {
    return await shoppingAssistantFlow(input);
  } catch (error) {
    console.error('Shopping assistant error:', error);
    return { answer: 'I apologize, but I encountered an error processing your request. Please try rephrasing your question or contact our support team.' };
  }
}

const shoppingAssistantPrompt = ai.definePrompt({
  name: 'shoppingAssistantPrompt',
  input: { schema: ShoppingAssistantInputSchema },
  output: { schema: ShoppingAssistantOutputSchema },
  prompt: `You are a helpful AI shopping assistant for Lumo, an e-commerce platform.

Your role is to:
- Help customers find products they're looking for
- Answer questions about product availability, pricing, and features
- Provide recommendations based on customer needs
- Assist with general shopping inquiries
- Be friendly, concise, and helpful

Available product information will be provided in the context.

{{#if history}}
Conversation history:
{{#each history}}
{{role}}: {{content}}
{{/each}}
{{/if}}

Customer question: {{query}}

Provide a helpful, friendly response to assist the customer. Keep responses concise but informative.`,
});

const shoppingAssistantFlow = ai.defineFlow(
  {
    name: 'shoppingAssistantFlow',
    inputSchema: ShoppingAssistantInputSchema,
    outputSchema: ShoppingAssistantOutputSchema,
  },
  async (input) => {
    // Fetch product data to provide context
    let productContext = '';
    try {
      const products = await getProducts();
      if (products && products.length > 0) {
        // Limit to first 10 products to avoid token limits
        const limitedProducts = products.slice(0, 10);
        productContext = `\n\nAvailable products (sample):\n${limitedProducts.map(p =>
          `- ${p.name}: $${p.price} ${p.stock > 0 ? '(In Stock)' : '(Out of Stock)'}`
        ).join('\n')}`;
      }
    } catch (error) {
      console.error('Error fetching products for context:', error);
    }

    // Enhance the prompt with product context
    const enhancedInput = {
      ...input,
      query: input.query + productContext,
    };

    const { output } = await shoppingAssistantPrompt(enhancedInput);
    return output!;
  }
);
