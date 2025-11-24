# Quick Fix: Chatbot Not Working in Production

## Problem
Chatbot not working in production due to missing Google Gemini API key.

## Solution (3 Steps)

### 1. Get FREE Gemini API Key
- Visit: https://makersuite.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy the key (starts with `AIza...`)

### 2. Add to Vercel
**Option A - Dashboard:**
1. Go to: https://vercel.com/lillybaba1/lumo-app/settings/environment-variables
2. Click "Add New"
3. Name: `GEMINI_API_KEY`
4. Value: Your API key
5. Environments: Select all (Production, Preview, Development)
6. Save

**Option B - CLI:**
```bash
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_API_KEY preview
```

### 3. Redeploy
```bash
# Via Git
git commit --allow-empty -m "Trigger redeploy"
git push

# Or via Vercel Dashboard
# Deployments → Click ... → Redeploy
```

## Verification
1. Visit: https://lumo-app-heiliges-projects.vercel.app
2. Go to AI Assistant page
3. Send a test message
4. Should receive intelligent AI response

## Free Tier Limits
- 15 requests/minute
- 1500 requests/day
- No credit card required
- Perfect for most use cases

## Need Help?
See `CHATBOT_PRODUCTION_SETUP.md` for detailed instructions.
