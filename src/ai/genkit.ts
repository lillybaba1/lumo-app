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

// Determine which AI provider to use (prefer Gemini over OpenAI)
const plugins = [];
let defaultModel;

if (hasGemini) {
  console.log('[Genkit Init] Using Google Gemini (Gemini 1.5 Flash)');
  plugins.push(googleAI({
    apiKey: geminiKey,
  }));
  // Use Gemini 1.5 Flash (imported from @genkit-ai/googleai)
  defaultModel = gemini15Flash;
} else if (hasOpenAI) {
  console.log('[Genkit Init] Using OpenAI (GPT-4o)');
  plugins.push(openAI({
    apiKey: process.env.OPENAI_API_KEY,
  }));
  defaultModel = gpt4o;
} else {
  console.error(
    '❌ ERROR: No AI API key configured!\n' +
    '   Option 1 (OpenAI): Get key from https://platform.openai.com/api-keys\n' +
    '   Option 2 (Gemini): Get key from https://makersuite.google.com/app/apikey\n' +
    '   Add to .env.local as OPENAI_API_KEY or GEMINI_API_KEY\n' +
    '   AI assistant will not work without an API key!'
  );
  throw new Error('No AI API key configured. Please set OPENAI_API_KEY or GEMINI_API_KEY');
}

export const ai = genkit({
  plugins,
  model: defaultModel,
});

// Export the selected model for reference
export const selectedModel = hasGemini ? 'Google Gemini 1.5 Flash' : 'OpenAI GPT-4o';
export const hasAIConfigured = hasGemini || hasOpenAI;
