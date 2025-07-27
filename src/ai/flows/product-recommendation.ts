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
  prompt: `You are an AI shopping assistant that provides personalized product recommendations to users based on their browsing history and past purchases.

  User ID: {{{userId}}}
  Browsing History: {{#each browsingHistory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Past Purchases: {{#each pastPurchases}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Based on this information, recommend products that the user is likely to be interested in. Explain your reasoning.
  Ensure the recommendedProducts are product IDs.
  Format your response as a JSON object matching the schema.
  {
    "recommendedProducts": [product IDs],
    "reasoning": "explanation"
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
