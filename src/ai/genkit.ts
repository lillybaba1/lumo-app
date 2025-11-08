import {genkit} from 'genkit';
import openAI, { gpt4o } from 'genkitx-openai';

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'production') {
  console.warn(
    '⚠️  WARNING: OPENAI_API_KEY is not set. AI assistant will not work.\n' +
    '   Get your API key from: https://platform.openai.com/api-keys\n' +
    '   Then add it to your .env.local file: OPENAI_API_KEY=your_key_here'
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
