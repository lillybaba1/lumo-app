import {genkit} from 'genkit';
import openAI, { gpt4o, gpt35Turbo } from 'genkitx-openai';
import { googleAI, gemini15Flash, gemini15Pro } from '@genkit-ai/googleai';

// Check which AI API keys are configured
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasGemini = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

console.log('[Genkit Init] Environment:', process.env.NODE_ENV);
console.log('[Genkit Init] OPENAI_API_KEY present:', hasOpenAI);
console.log('[Genkit Init] GEMINI_API_KEY present:', hasGemini);

// Determine which AI provider to use (prefer OpenAI if both are available)
const plugins = [];
let defaultModel;
let aiInstance: ReturnType<typeof genkit> | null = null;

if (hasOpenAI) {
  console.log('[Genkit Init] Using OpenAI (GPT-4o)');
  plugins.push(openAI({
    apiKey: process.env.OPENAI_API_KEY,
  }));
  defaultModel = gpt4o;
} else if (hasGemini) {
  console.log('[Genkit Init] Using Google Gemini (Gemini 2.5 Flash)');
  plugins.push(googleAI({
    apiKey: geminiKey,
  }));
  // Use Gemini 2.5 Flash (the genkit library model reference)
  defaultModel = 'googleai/gemini-2.5-flash';
} else {
  console.warn(
    '⚠️  WARNING: No AI API key configured!\n' +
    '   Option 1 (OpenAI): Get key from https://platform.openai.com/api-keys\n' +
    '   Option 2 (Gemini): Get key from https://makersuite.google.com/app/apikey\n' +
    '   For production: Add to Vercel environment variables as OPENAI_API_KEY or GEMINI_API_KEY\n' +
    '   For development: Add to .env.local as OPENAI_API_KEY or GEMINI_API_KEY\n' +
    '   AI assistant will return a helpful error message to users.'
  );
}

// Only initialize genkit if we have an API key
if (hasOpenAI || hasGemini) {
  aiInstance = genkit({
    plugins,
    model: defaultModel,
  });
}

// Export ai instance (may be null if no API key configured)
export const ai = aiInstance;

// Export the selected model for reference
export const selectedModel = hasOpenAI ? 'OpenAI GPT-4o' : hasGemini ? 'Google Gemini 2.5 Flash' : null;
export const hasAIConfigured = hasOpenAI || hasGemini;
