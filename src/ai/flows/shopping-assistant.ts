
'use server';

/**
 * @fileOverview AI shopping assistant flow.
 *
 * - shoppingAssistant - A function that takes a user query and returns an answer from the AI shopping assistant.
 * - ShoppingAssistantInput - The input type for the shoppingAssistant function.
 * - ShoppingAssistantOutput - The return type for the shoppingAssistant function.
 */

// Comment out genkit and ai imports as they rely on Node.js modules
// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';
import { z } from 'zod'; // Use zod directly as it's Edge compatible

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

// Temporary stub for Cloudflare Edge build
export async function shoppingAssistant(input: ShoppingAssistantInput): Promise<ShoppingAssistantOutput> {
 return { reply: "Assistant disabled on Cloudflare Edge build for now." };
}

