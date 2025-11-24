import {genkit} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Check if Gemini API key is configured
const hasGemini = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

console.log('[Genkit Init] Environment:', process.env.NODE_ENV);
console.log('[Genkit Init] GEMINI_API_KEY present:', hasGemini);

// Initialize AI with Gemini
let aiInstance: ReturnType<typeof genkit> | null = null;

if (hasGemini) {
  console.log('[Genkit Init] Using Google Gemini (Gemini 2.5 Flash)');
  aiInstance = genkit({
    plugins: [
      googleAI({
        apiKey: geminiKey,
      })
    ],
    model: 'googleai/gemini-2.5-flash',
  });
} else {
  console.warn(
    '⚠️  WARNING: No Gemini API key configured!\n' +
    '   Get your API key from: https://makersuite.google.com/app/apikey\n' +
    '   For production: Add to Vercel environment variables as GEMINI_API_KEY or GOOGLE_API_KEY\n' +
    '   For development: Add to .env.local as GEMINI_API_KEY or GOOGLE_API_KEY\n' +
    '   AI assistant will return a helpful error message to users.'
  );
}

// Export ai instance (may be null if no API key configured)
export const ai = aiInstance;

// Export the selected model for reference
export const selectedModel = hasGemini ? 'Google Gemini 2.5 Flash' : null;
export const hasAIConfigured = hasGemini;
