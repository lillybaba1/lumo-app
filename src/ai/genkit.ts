import 'server-only';

import {genkit} from 'genkit';
import openAI, { gpt4o, gpt35Turbo } from 'genkitx-openai';
import { googleAI, gemini15Flash, gemini15Pro, gemini20Flash } from '@genkit-ai/googleai';
import { logger } from '@/lib/logger';

const aiLogger = logger.child('GenkitAI');

// Check which AI API keys are configured
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasGemini = !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

aiLogger.info('Genkit initialization', {
  environment: process.env.NODE_ENV,
  openaiConfigured: hasOpenAI,
  geminiConfigured: hasGemini,
  deploymentVersion: process.env.VERCEL_GIT_COMMIT_SHA || 'local'
});

// Determine which AI provider to use (prefer Gemini over OpenAI)
const plugins = [];
let defaultModel;

if (hasGemini) {
  aiLogger.info('Using Google Gemini (Gemini 2.0 Flash)');
  plugins.push(googleAI({
    apiKey: geminiKey,
  }));
  // Use Gemini 2.0 Flash - more widely available than 1.5
  defaultModel = gemini20Flash;
} else if (hasOpenAI) {
  aiLogger.info('Using OpenAI (GPT-4o)');
  plugins.push(openAI({
    apiKey: process.env.OPENAI_API_KEY,
  }));
  defaultModel = gpt4o;
} else {
  // During build time, API keys may not be set yet (they're set at runtime in production)
  // Use a placeholder model to allow build to succeed
  aiLogger.warn('No AI API key configured at build time - this is expected during Next.js build process');
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
export const selectedModel = hasGemini ? 'Google Gemini 2.0 Flash' : 'OpenAI GPT-4o';
export const hasAIConfigured = hasGemini || hasOpenAI;
