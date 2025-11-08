import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if Google AI API key is configured
if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    '⚠️  WARNING: GOOGLE_API_KEY is not set. AI assistant will not work.\n' +
    '   Get your API key from: https://aistudio.google.com/app/apikey\n' +
    '   Then add it to your .env.local file: GOOGLE_API_KEY=your_key_here'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    })
  ],
  // Use the latest stable Gemini 1.5 Flash model
  model: 'googleai/gemini-1.5-flash-latest',
});
