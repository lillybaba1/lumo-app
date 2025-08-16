'use server';

import { z } from 'zod';

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

// Edge-safe stub for now
export async function shoppingAssistant(
  _input: ShoppingAssistantInput
): Promise<ShoppingAssistantOutput> {
  return { answer: 'Assistant disabled on Cloudflare Edge build for now.' };
}
