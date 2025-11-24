# AI Chatbot Production Setup Guide

## Problem
The AI chatbot is not working in production because the required Google Gemini API key is not configured in the production environment (Vercel).

## Solution

### Required Environment Variable

The chatbot requires a **Google Gemini API key** to function:

**GEMINI_API_KEY** or **GOOGLE_API_KEY** (Google Gemini 2.5 Flash)

### Google Gemini Setup

**Pros:**
- Free tier: 15 requests/minute, 1500 requests/day
- No credit card required
- Fast responses
- Good quality AI
- Very cost-effective for production

**Cons:**
- Rate limits on free tier (can upgrade to paid if needed)

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
   - **Name**: `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
   - **Value**: Your API key (starts with `AIza...`)
   - **Environments**: Select all three (Production, Preview, Development)
6. Click "Save"

### Via Vercel CLI:

```bash
# Add Gemini API key
vercel env add GEMINI_API_KEY production
# Paste your API key when prompted

vercel env add GEMINI_API_KEY preview
# Paste your API key
```

## Redeploy Your Application

After adding the environment variable, you must redeploy:

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
- Instructions on how to set up Gemini API key
- Link to get the free API key

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
1. Generate a new API key from https://makersuite.google.com/app/apikey
2. Update the environment variable in Vercel
3. Redeploy

### Issue: Rate limit errors

**For Gemini Free Tier:**
- 15 requests/minute, 1500 requests/day
- Wait for rate limit to reset (1 minute)
- Or upgrade to paid tier for higher limits

**Check Quota:**
https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas

## Code Changes Made

The following files were updated to handle missing API keys gracefully and use only Gemini:

1. **src/ai/genkit.ts**
   - Removed OpenAI dependency
   - Simplified to use only Google Gemini
   - Changed from throwing error to logging warning
   - Made AI instance nullable when no key configured

2. **src/ai/flows/product-question-answering.ts**
   - Added check for AI configuration
   - Returns user-friendly error message when not configured
   - Includes Gemini-specific setup instructions

3. **src/ai/flows/product-recommendation.ts**
   - Added check for AI configuration
   - Returns graceful fallback when not configured

## Local Development Setup

For local development, create a `.env.local` file:

```bash
# Google Gemini API Key (REQUIRED for AI chatbot)
GEMINI_API_KEY=AIza-your-gemini-key-here
# Or alternatively use GOOGLE_API_KEY

# Firebase Client Config (Public)
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

### Google Gemini 2.5 Flash:
- **Free tier**: 15 requests/minute, 1500 requests/day
  - Perfect for small-medium sites
  - No cost at all
  - No credit card required
  
- **Paid tier** (if you need more):
  - ~$0.0001 per 1K tokens
  - Very affordable: ~$1-5 per month for 1000 conversations
  - Much cheaper than other AI providers

## Why Gemini Only?

We simplified the chatbot to use only Google Gemini because:

1. **Free tier is generous** - 1500 requests/day covers most use cases
2. **No credit card required** - Easy to set up
3. **Good quality** - Gemini 2.5 Flash provides excellent responses
4. **Simple configuration** - Only one API key to manage
5. **Cost-effective** - Even paid tier is very affordable

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variable is set correctly
3. Test API key directly using curl:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
     -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```
4. Check Google's status page

## References

- Get Gemini API Key: https://makersuite.google.com/app/apikey
- Gemini API Docs: https://ai.google.dev/docs
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Project Documentation: See AI_CHATBOT_SETUP.md for detailed features
