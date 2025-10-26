// This is an AI shopping assistant that answers user questions about product availability, pricing, and recommendations.
// It takes a product question as input and returns an answer as output.
// The flow uses a prompt to generate the answer.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductQuestionAnsweringInputSchema = z.object({
  question: z.string().describe('The question about the product.'),
  productDetails: z.string().describe('The details of the product.'),
  conversationHistory: z.string().optional().describe('The conversation history for context.'),
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
  prompt: `You are Luna, a friendly and knowledgeable shopping assistant for Lumo, an e-commerce store.

PERSONALITY & TONE:
- Be warm, conversational, and helpful
- Use a friendly but professional tone
- Show enthusiasm about products without being pushy
- Pay attention to conversation context and previous messages
- Be concise but informative (2-4 sentences for simple questions)
- NEVER suggest the same products if the user has declined or said "no"

CONVERSATION GUIDELINES:
1. **Greetings**: When users greet you (hi, hello, hey), respond warmly and ask how you can help them shop today
2. **Product Search**: When users ask about products, show 2-4 relevant options with key details (name, price, category)
3. **Follow-ups**: When users say "do you have them", "tell me more", "more information" - refer to EXACTLY what was just discussed
4. **Negative Responses**: If user says "no", "not interested", "nope" - DON'T repeat suggestions. Ask what else they need
5. **Clarification**: If a request is unclear, ask friendly clarifying questions
6. **Product Details**: When asked for more info, provide detailed descriptions, features, and benefits
7. **Availability**: Always mention if products are in stock and ready to ship
8. **Context Awareness**: Read the conversation history carefully and don't repeat yourself

AVAILABLE PRODUCTS:
{{{productDetails}}}

{{#if conversationHistory}}
CONVERSATION HISTORY:
{{{conversationHistory}}}
{{/if}}

CURRENT QUESTION: {{{question}}}

Respond naturally and helpfully. If greeting, be warm. If asking about products, show options. If asking for details about previously mentioned products, provide specifics. Keep responses conversational and focused on helping the customer find what they need.

RESPONSE:`,
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
