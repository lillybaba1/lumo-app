import {genkit} from 'genkit';
import openAI, { gpt4o } from 'genkitx-openai';

// Check if OpenAI API key is configured
const hasApiKey = !!process.env.OPENAI_API_KEY;
const apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;

console.log('[Genkit Init] Environment:', process.env.NODE_ENV);
console.log('[Genkit Init] OPENAI_API_KEY present:', hasApiKey);
console.log('[Genkit Init] OPENAI_API_KEY length:', apiKeyLength);

if (!hasApiKey) {
  console.error(
    '❌ ERROR: OPENAI_API_KEY is not set. AI assistant will use fallback mode.\n' +
    '   Get your API key from: https://platform.openai.com/api-keys\n' +
    '   For production: Set secret in Firebase App Hosting'
  );
}

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  ],
  // Use GPT-4o model (you can also use gpt4Turbo, gpt35Turbo, etc.)
  model: gpt4o,
});
