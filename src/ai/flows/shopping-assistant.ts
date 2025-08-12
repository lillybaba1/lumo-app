
'use server';

/**
 * @fileOverview AI shopping assistant flow.
 *
 * - shoppingAssistant - A function that takes a user query and returns an answer from the AI shopping assistant.
 * - ShoppingAssistantInput - The input type for the shoppingAssistant function.
 * - ShoppingAssistantOutput - The return type for the shoppingAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export async function shoppingAssistant(input: ShoppingAssistantInput): Promise<ShoppingAssistantOutput> {
  return shoppingAssistantFlow(input);
}

const shoppingAssistantPrompt = ai.definePrompt({
  name: 'shoppingAssistantPrompt',
  input: {schema: ShoppingAssistantInputSchema},
  output: {schema: ShoppingAssistantOutputSchema},
  prompt: `You are an AI shopping assistant. Your goal is to help users with their shopping-related tasks.
  Keep your responses concise and helpful.

  Here is the conversation history:
  {{#each history}}
    {{role}}: {{content}}
  {{/each}}

  Answer the following question based on the history:
  User: {{query}}
  Assistant:`,
});

const shoppingAssistantFlow = ai.defineFlow(
  {
    name: 'shoppingAssistantFlow',
    inputSchema: ShoppingAssistantInputSchema,
    outputSchema: ShoppingAssistantOutputSchema,
  },
  async input => {
    const {output} = await shoppingAssistantPrompt(input);
    return output!;
  }
);
