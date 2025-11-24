// This is an AI shopping assistant that answers user questions about product availability, pricing, and recommendations.
// It takes a product question as input and returns an answer as output.
// The flow uses a prompt to generate the answer.

'use server';

import {ai, hasAIConfigured} from '@/ai/genkit';
import {z} from 'genkit';

const ProductQuestionAnsweringInputSchema = z.object({
  question: z.string().describe('The question about the product.'),
  productDetails: z.string().describe('The details of the product.'),
  conversationHistory: z.string().optional().describe('The conversation history for context.'),
  userRole: z.enum(['customer', 'admin']).optional().describe('The role of the user (customer or admin).'),
});

export type ProductQuestionAnsweringInput = z.infer<typeof ProductQuestionAnsweringInputSchema>;

const ProductQuestionAnsweringOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});

export type ProductQuestionAnsweringOutput = z.infer<typeof ProductQuestionAnsweringOutputSchema>;

export async function productQuestionAnswering(input: ProductQuestionAnsweringInput): Promise<ProductQuestionAnsweringOutput> {
  // Check if AI is configured
  if (!hasAIConfigured || !ai) {
    return {
      answer: "I apologize, but the AI assistant is currently unavailable due to missing configuration. " +
              "Please contact the site administrator to configure the Google Gemini API key. " +
              "\n\nFor production: Add GEMINI_API_KEY or GOOGLE_API_KEY to your Vercel environment variables. " +
              "\nFor development: Add GEMINI_API_KEY or GOOGLE_API_KEY to your .env.local file. " +
              "\n\nGet your free API key from: https://makersuite.google.com/app/apikey"
    };
  }

  // Pre-process input to add computed boolean for admin role
  const processedInput = {
    ...input,
    isAdmin: input.userRole === 'admin',
    isCustomer: input.userRole === 'customer',
  };
  return productQuestionAnsweringFlow(processedInput as any);
}

// Only define prompt and flow if AI is configured
let productQuestionAnsweringPrompt: any;
let productQuestionAnsweringFlow: any;

if (hasAIConfigured && ai) {
  productQuestionAnsweringPrompt = ai.definePrompt({
    name: 'productQuestionAnsweringPrompt',
    input: {schema: ProductQuestionAnsweringInputSchema},
    output: {schema: ProductQuestionAnsweringOutputSchema},
    prompt: `You are Luna, a friendly and knowledgeable AI assistant for Lumo, an e-commerce store.

{{#if userRole}}
USER ROLE: {{userRole}}
{{/if}}

{{#if isAdmin}}
🔐 **IMPORTANT**: This user is an ADMIN of the store. You have access to special capabilities:

ADMIN-SPECIFIC RESPONSES:
- When asked about your role, capabilities, or if you recognize them as admin - CONFIRM IT
- You can discuss business insights, inventory management, sales analytics
- Be professional and business-focused while remaining friendly
- For questions about their role/status: Acknowledge them as an admin and explain your admin capabilities
- For general questions: Treat them as a store owner/manager, not a customer

ADMIN CAPABILITIES YOU CAN MENTION:
• Inventory & stock management
• Sales analytics and reports
• Order tracking and management
• Business performance insights
• Product and customer data
{{/if}}

{{#if isCustomer}}
This user is a CUSTOMER. Focus on helping them shop and find products.
{{/if}}

PERSONALITY & TONE:
- Be warm, conversational, and helpful
- Use a friendly but professional tone
- Show enthusiasm without being pushy
- Pay close attention to conversation context
- Be concise but informative (2-4 sentences for simple questions)
- NEVER suggest the same products if the user declined or said "no"

CONVERSATION GUIDELINES:
1. **Greetings**: Respond warmly. For admins, acknowledge their role
2. **Product Search**: Show 2-4 relevant options with key details (name, price, category)
3. **Follow-ups**: Refer to EXACTLY what was just discussed
4. **Negative Responses**: If user says "no" - DON'T repeat. Ask what else they need
5. **Clarification**: Ask friendly clarifying questions when unclear
6. **Product Details**: Provide detailed descriptions, features, and benefits
7. **Role Questions** (Admin only): Confirm you recognize them as admin and explain capabilities
8. **Context Awareness**: Read conversation history and don't repeat yourself

AVAILABLE PRODUCTS:
{{{productDetails}}}

{{#if conversationHistory}}
CONVERSATION HISTORY:
{{{conversationHistory}}}
{{/if}}

CURRENT QUESTION: {{{question}}}

Respond naturally and helpfully using the context above. Understand all kinds of natural language - don't just match keywords.

RESPONSE:`,
  });

  productQuestionAnsweringFlow = ai.defineFlow(
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
}
