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
let aiInstance: any = null;

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
  // Use Gemini 1.5 Flash (supported by @genkit-ai/googleai v1.14.1)
  defaultModel = gemini15Flash;
} else {
  console.error(
    '❌ ERROR: No AI API key configured!\n' +
    '   Option 1 (OpenAI): Get key from https://platform.openai.com/api-keys\n' +
    '   Option 2 (Gemini): Get key from https://aistudio.google.com/app/apikey\n' +
    '   Add to your environment as OPENAI_API_KEY, GEMINI_API_KEY, or GOOGLE_API_KEY\n' +
    '   AI assistant will not work without an API key!'
  );
  // Don't throw - let the app continue but mark AI as not configured
}

// Only initialize genkit if we have a valid configuration
if (defaultModel && plugins.length > 0) {
  aiInstance = genkit({
    plugins,
    model: defaultModel,
  });
}

// Export AI instance (null if not configured)
export const ai = aiInstance;

// Export the selected model for reference
export const selectedModel = hasOpenAI ? 'OpenAI GPT-4o' : hasGemini ? 'Google Gemini 1.5 Flash' : 'None (No API key configured)';
export const hasAIConfigured = hasOpenAI || hasGemini;
