'use server';

/**
 * @fileOverview Provides personalized product recommendations based on user history.
 *
 * - getProductRecommendations - A function to retrieve product recommendations for a user.
 * - ProductRecommendationInput - The input type for the getProductRecommendations function.
 * - ProductRecommendationOutput - The return type for the getProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to generate recommendations.'),
  browsingHistory: z
    .array(z.string())
    .describe('An array of product IDs representing the user\'s browsing history.'),
  pastPurchases: z
    .array(z.string())
    .describe('An array of product IDs representing the user\'s past purchases.'),
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

const ProductRecommendationOutputSchema = z.object({
  recommendedProducts: z
    .array(z.string())
    .describe('An array of product IDs representing the recommended products.'),
  reasoning: z
    .string()
    .optional()
    .describe('The reasoning behind the product recommendations.'),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;

export async function getProductRecommendations(input: ProductRecommendationInput): Promise<ProductRecommendationOutput> {
  return productRecommendationFlow(input);
}

const productRecommendationPrompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {schema: ProductRecommendationInputSchema},
  output: {schema: ProductRecommendationOutputSchema},
  prompt: `You are Luna, a friendly AI shopping assistant for Lumo. A customer is asking for product recommendations.

User ID: {{{userId}}}
What they've been looking at: {{#each browsingHistory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
What they've purchased before: {{#each pastPurchases}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on their interests and shopping patterns, recommend products they'll love. Think about:
- Complementary items to what they've purchased
- Similar products to what they've been browsing
- Quality items that match their taste

Provide a warm, conversational explanation of why you're recommending these products.

Return your recommendations as a JSON object:
{
  "recommendedProducts": [array of product IDs],
  "reasoning": "friendly explanation of why these products are perfect for them"
}`,
});

const productRecommendationFlow = ai.defineFlow(
  {
    name: 'productRecommendationFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async input => {
    const {output} = await productRecommendationPrompt(input);
    return output!;
  }
);
