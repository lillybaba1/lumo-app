# AI Assistant Setup Guide

This app uses **Google's Gemini AI** via **Firebase Genkit** to power the intelligent shopping assistant.

## Current Configuration

- **AI Model**: Gemini 2.0 Flash (`googleai/gemini-2.0-flash`)
- **Framework**: Firebase Genkit
- **Features**:
  - Product recommendations based on browsing history
  - Product question answering
  - Natural language shopping assistance
  - Fallback to local search if AI is unavailable

## Quick Setup

### 1. Get Your Google AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API key"** or **"Create API key"**
4. Copy the generated API key

### 2. Configure Environment Variables

#### For Local Development:

Create a `.env.local` file in the project root:

```bash
GOOGLE_API_KEY=your_google_ai_api_key_here
```

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `GOOGLE_API_KEY`
   - **Value**: Your Google AI API key
   - **Environment**: Production, Preview, and Development
4. Redeploy your application

### 3. Test the AI Assistant

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app in the browser
3. Look for the AI assistant widget (bot icon in the bottom-right corner)
4. Try asking questions like:
   - "Show me smartphones under $500"
   - "What are the specs of this laptop?"
   - "Recommend products for gaming"

## Architecture

### AI Flows (Server-Side)

The AI functionality is organized into three main flows:

1. **Shopping Assistant** (`src/ai/flows/shopping-assistant.ts`)
   - Main orchestrator for all AI interactions
   - Routes queries to appropriate sub-flows
   - Implements fallback strategies

2. **Product Question Answering** (`src/ai/flows/product-question-answering.ts`)
   - Answers specific questions about products
   - Uses product context from the database

3. **Product Recommendation** (`src/ai/flows/product-recommendation.ts`)
   - Generates personalized recommendations
   - Considers browsing history and past purchases

### API Endpoint

- **Endpoint**: `/api/assistant`
- **Method**: POST
- **Input**: `{ query: string, history: Message[] }`
- **Output**: `{ answer: string }`

### UI Components

- **AI Assistant Widget** (`src/components/ai-assistant-widget.tsx`)
  - Floating chat button
  - Auto-clears after 3 minutes of inactivity

- **Chat Interface** (`src/components/chat-interface.tsx`)
  - Message display
  - Input form
  - Loading states

## Fallback Mechanism

The AI assistant implements a robust three-tier fallback strategy:

1. **Try AI Recommendation Flow** → If fails, continue
2. **Try AI Question Answering** → If fails, continue
3. **Local Keyword Search** → If all else fails

This ensures users always get a response, even if the AI service is unavailable.

## Troubleshooting

### AI Not Responding

**Issue**: The assistant doesn't reply or shows errors

**Solutions**:
1. Check if `GOOGLE_API_KEY` is set correctly
2. Verify the API key is valid (not expired)
3. Check your Google AI quota/billing at [Google AI Studio](https://aistudio.google.com/)
4. Look at server logs for detailed error messages

### Development Warning

If you see this warning during development:

```
⚠️  WARNING: GOOGLE_API_KEY is not set. AI assistant will not work.
```

This means your `.env.local` file is missing or the `GOOGLE_API_KEY` is not set.

### Rate Limiting

Google AI has rate limits. If you exceed them:
- Free tier: 15 requests per minute
- Paid tier: Higher limits based on your plan

Consider implementing request throttling for production use.

## Upgrading to Different Models

You can switch to other Gemini models by editing `src/ai/genkit.ts`:

```typescript
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    })
  ],
  model: 'googleai/gemini-2.0-flash', // Change this line
});
```

Available models:
- `googleai/gemini-2.0-flash` (fastest, current)
- `googleai/gemini-1.5-pro` (more capable, slower)
- `googleai/gemini-1.5-flash` (balanced)

## Cost Optimization

Gemini 2.0 Flash is optimized for cost and speed:
- **Free tier**: 15 RPM, 1 million TPM
- **Pay-as-you-go**: Very low cost per request

Tips to reduce costs:
1. Implement caching for common queries
2. Use the fallback mechanism (already implemented)
3. Set request rate limits
4. Monitor usage in Google AI Studio

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Genkit Docs](https://firebase.google.com/docs/genkit)
- [Genkit Google AI Plugin](https://firebase.google.com/docs/genkit/plugins/google-ai)

## Support

If you encounter issues:
1. Check the logs in your development console
2. Verify environment variables are set
3. Test your API key directly in Google AI Studio
4. Review the fallback mechanism logs

The AI assistant will gracefully degrade to local search if there are any issues with the Gemini API.
