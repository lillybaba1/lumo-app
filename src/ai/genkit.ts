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

if (hasOpenAI) {
  console.log('[Genkit Init] Using OpenAI (GPT-4o)');
  plugins.push(openAI({
    apiKey: process.env.OPENAI_API_KEY,
  }));
  defaultModel = gpt4o;
} else if (hasGemini) {
  console.log('[Genkit Init] Using Google Gemini (Gemini 1.5 Flash)');
  plugins.push(googleAI({
    apiKey: geminiKey,
  }));
  // Use Gemini 1.5 Flash (imported from @genkit-ai/googleai)
  defaultModel = gemini15Flash;
} else {
  // During build time, API keys may not be set yet (they're set at runtime in production)
  // Use a placeholder model to allow build to succeed
  console.warn(
    '⚠️  WARNING: No AI API key configured at build time!\n' +
    '   This is expected during Next.js build process.\n' +
    '   Ensure OPENAI_API_KEY or GEMINI_API_KEY is set in production environment.\n' +
    '   Option 1 (OpenAI): Get key from https://platform.openai.com/api-keys\n' +
    '   Option 2 (Gemini): Get key from https://makersuite.google.com/app/apikey'
  );
  // Use Gemini as placeholder (will fail at runtime if keys not set)
  plugins.push(googleAI({
    apiKey: 'placeholder-key-will-fail-at-runtime',
  }));
  defaultModel = gemini15Flash;
}

export const ai = genkit({
  plugins,
  model: defaultModel,
});

// Export the selected model for reference
export const selectedModel = hasOpenAI ? 'OpenAI GPT-4o' : 'Google Gemini 1.5 Flash';
export const hasAIConfigured = hasOpenAI || hasGemini;
