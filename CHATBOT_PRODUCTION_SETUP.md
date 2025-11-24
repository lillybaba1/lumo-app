# AI Chatbot Production Setup Guide

## Problem
The AI chatbot is not working in production because the required API keys are not configured in the production environment (Vercel).

## Solution

### Required Environment Variables

The chatbot requires **at least one** of the following API keys to function:

1. **OPENAI_API_KEY** (OpenAI GPT-4o) - Recommended for production
2. **GEMINI_API_KEY** or **GOOGLE_API_KEY** (Google Gemini 2.5 Flash) - Free tier available

### Option 1: OpenAI (Recommended for Production)

**Pros:**
- More reliable and consistent responses
- Better reasoning capabilities
- Lower latency
- Professional quality

**Cons:**
- Requires payment (pay-as-you-go)
- Costs approximately $0.005 per 1K tokens

**Setup:**
1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. Add to Vercel (see steps below)

### Option 2: Google Gemini (Free Tier Available)

**Pros:**
- Free tier: 15 requests/minute, 1500 requests/day
- No credit card required
- Fast responses
- Good quality

**Cons:**
- Rate limits on free tier
- Slightly less consistent than GPT-4o

**Setup:**
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)
5. Add to Vercel (see steps below)

## Adding Environment Variables to Vercel

### Via Vercel Dashboard:

1. Go to your Vercel project: https://vercel.com/lillybaba1/lumo-app
2. Click "Settings" tab
3. Click "Environment Variables" in the left sidebar
4. Click "Add New"
5. Enter the variable details:
   - **Name**: `OPENAI_API_KEY` or `GEMINI_API_KEY`
   - **Value**: Your API key
   - **Environments**: Select all three (Production, Preview, Development)
6. Click "Save"

### Via Vercel CLI:

```bash
# For OpenAI
vercel env add OPENAI_API_KEY production
# Paste your API key when prompted

vercel env add OPENAI_API_KEY preview
# Paste your API key

# Or for Gemini
vercel env add GEMINI_API_KEY production
# Paste your API key when prompted

vercel env add GEMINI_API_KEY preview
# Paste your API key
```

## Redeploy Your Application

After adding the environment variables, you must redeploy:

### Via Vercel Dashboard:
1. Go to the "Deployments" tab
2. Click the "..." menu on the latest deployment
3. Click "Redeploy"

### Via Git:
```bash
git commit --allow-empty -m "Trigger redeploy for AI configuration"
git push origin master
```

### Via Vercel CLI:
```bash
vercel --prod
```

## Verification

After deployment, test the chatbot:

1. Visit your production site: https://lumo-app-heiliges-projects.vercel.app
2. Navigate to the AI Assistant page
3. Try sending a message like "Hello" or "Show me products"
4. You should receive an intelligent AI response

### Expected Behavior:

**Before Fix (No API Key):**
- Error message about missing configuration
- Instructions on how to set up API keys
- Links to get API keys

**After Fix (API Key Configured):**
- Intelligent, conversational responses
- Product recommendations
- Natural language understanding
- Context awareness

## Troubleshooting

### Issue: Still getting configuration error messages

**Check:**
1. Verify the environment variable is set in Vercel dashboard
2. Ensure you redeployed after adding the variable
3. Check the deployment logs for any errors

**Fix:**
```bash
# Verify environment variables are set
vercel env ls

# Force a new deployment
vercel --prod --force
```

### Issue: "Invalid API Key" errors

**Causes:**
- Expired or incorrect API key
- API key doesn't have proper permissions

**Fix:**
1. Generate a new API key from the provider
2. Update the environment variable in Vercel
3. Redeploy

### Issue: Rate limit errors

**For OpenAI:**
- Check your OpenAI account has credits
- Visit: https://platform.openai.com/usage

**For Gemini:**
- Free tier: 15 requests/minute
- Wait for rate limit to reset (1 minute)
- Or upgrade to paid tier

## Code Changes Made

The following files were updated to handle missing API keys gracefully:

1. **src/ai/genkit.ts**
   - Changed from throwing error to logging warning
   - Made AI instance nullable when no key configured
   - Added helpful warning messages

2. **src/ai/flows/product-question-answering.ts**
   - Added check for AI configuration
   - Returns user-friendly error message when not configured
   - Includes setup instructions in the error message

3. **src/ai/flows/product-recommendation.ts**
   - Added check for AI configuration
   - Returns graceful fallback when not configured

## Local Development Setup

For local development, create a `.env.local` file:

```bash
# Choose one:
OPENAI_API_KEY=sk-your-openai-key-here
# OR
GEMINI_API_KEY=AIza-your-gemini-key-here

# Other required variables
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumo-app-183f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumo-app-183f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599053873389
NEXT_PUBLIC_FIREBASE_APP_ID=1:599053873389:web:7ae9fc52e26be1e3d89ce4
```

Then restart your dev server:
```bash
npm run dev
```

## Cost Estimates

### OpenAI GPT-4o:
- Input: ~$0.0025 per 1K tokens
- Output: ~$0.0075 per 1K tokens
- Average conversation (10 messages): ~$0.05-0.15
- Monthly estimate (1000 conversations): ~$50-150

### Google Gemini 2.5 Flash:
- Free tier: 1500 requests/day (plenty for small-medium sites)
- Paid tier: ~$0.0001 per 1K tokens
- Monthly estimate (1000 conversations): ~$1-5

## Recommendations

**For small sites or testing:**
- Use Google Gemini free tier
- No cost, generous limits

**For production sites with traffic:**
- Use OpenAI GPT-4o
- Better quality, more reliable
- Worth the cost for customer experience

**For cost optimization:**
- Use Gemini paid tier
- Good balance of quality and cost

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables are set
3. Test API keys directly using curl
4. Check provider's status page (OpenAI or Google)

## References

- OpenAI API Docs: https://platform.openai.com/docs
- Gemini API Docs: https://ai.google.dev/docs
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Project Documentation: See AI_CHATBOT_SETUP.md for detailed features
