// This is an AI shopping assistant that answers user questions about product availability, pricing, and recommendations.
// It takes a product question as input and returns an answer as output.
// The flow uses a prompt to generate the answer.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductQuestionAnsweringInputSchema = z.object({
  question: z.string().describe('The question about the product.'),
  productDetails: z.string().describe('The details of the product.'),
});

export type ProductQuestionAnsweringInput = z.infer<typeof ProductQuestionAnsweringInputSchema>;

const ProductQuestionAnsweringOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});

export type ProductQuestionAnsweringOutput = z.infer<typeof ProductQuestionAnsweringOutputSchema>;

export async function productQuestionAnswering(input: ProductQuestionAnsweringInput): Promise<ProductQuestionAnsweringOutput> {
  return productQuestionAnsweringFlow(input);
}

const productQuestionAnsweringPrompt = ai.definePrompt({
  name: 'productQuestionAnsweringPrompt',
  input: {schema: ProductQuestionAnsweringInputSchema},
  output: {schema: ProductQuestionAnsweringOutputSchema},
  prompt: `You are a shopping assistant. Use the following information to answer the user's question about the product.

Product Details: {{{productDetails}}}

Question: {{{question}}}

Answer:`,
});

const productQuestionAnsweringFlow = ai.defineFlow(
  {
    name: 'productQuestionAnsweringFlow',
    inputSchema: ProductQuestionAnsweringInputSchema,
    outputSchema: ProductQuestionAnsweringOutputSchema,
  },
  async input => {
    const {output} = await productQuestionAnsweringPrompt(input);
    return output!;
  }
);
