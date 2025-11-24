# Chatbot Troubleshooting Guide

## Issue: "I added the API key but chatbot still not working"

### Quick Diagnostic Checklist

Follow these steps to identify and fix the issue:

#### 1. Verify API Key is Set in Vercel

**Check in Vercel Dashboard:**
1. Go to https://vercel.com/lillybaba1/lumo-app/settings/environment-variables
2. Look for `GEMINI_API_KEY` or `GOOGLE_API_KEY`
3. Verify it shows for **Production** environment (check the badge)
4. The value should start with `AIza...`

**Common Issue:** Variable only added to Preview/Development, not Production

**Fix:** Click on the variable → Make sure "Production" is checked → Save

---

#### 2. Did You Redeploy After Adding the Key?

Environment variables are only loaded during deployment. **You must redeploy** after adding them.

**How to Redeploy:**

**Option A - Via Vercel Dashboard:**
1. Go to https://vercel.com/lillybaba1/lumo-app
2. Click "Deployments" tab
3. Find the most recent deployment
4. Click the "..." (three dots) menu
5. Click "Redeploy"
6. Wait for deployment to complete (check the logs)

**Option B - Via Git:**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin master
```

**Verify Deployment:**
- Check that deployment completed successfully (green checkmark)
- Look at deployment logs for any errors

---

#### 3. Check Deployment Logs for Errors

**View Logs:**
1. Go to https://vercel.com/lillybaba1/lumo-app
2. Click on the latest deployment
3. Click "Functions" or "View Function Logs"
4. Look for these messages:

**Good - API key found:**
```
[Genkit Init] Environment: production
[Genkit Init] GEMINI_API_KEY present: true
[Genkit Init] Using Google Gemini (Gemini 2.5 Flash)
```

**Bad - API key missing:**
```
[Genkit Init] GEMINI_API_KEY present: false
⚠️  WARNING: No Gemini API key configured!
```

---

#### 4. Test the API Key Itself

The API key might be invalid or expired.

**Test with curl:**
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY_HERE" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

**Expected Response:** JSON with AI response

**Error Response:** 
- `403 Forbidden` - Invalid API key
- `429 Too Many Requests` - Rate limit exceeded

**Fix:** Generate a new API key from https://makersuite.google.com/app/apikey

---

#### 5. Check Which Environment Variable Name You Used

The code accepts both `GEMINI_API_KEY` and `GOOGLE_API_KEY`.

**Verify you used one of these exact names:**
- ✅ `GEMINI_API_KEY` (recommended)
- ✅ `GOOGLE_API_KEY` (also works)
- ❌ `GEMINI_KEY` (won't work)
- ❌ `GOOGLE_GEMINI_API_KEY` (won't work)

**Fix:** Delete the wrong variable, add new one with correct name, redeploy

---

#### 6. Test the Chatbot

After redeploying with the correct API key:

1. Visit your production site: https://lumo-app-heiliges-projects.vercel.app
2. Navigate to the AI Assistant page
3. Send a test message: "Hello"

**What to expect:**

**If working:**
- You get an intelligent, natural response from the AI
- Response is conversational and context-aware

**If not working:**
- Error message: "AI assistant is currently unavailable due to missing configuration"
- Instructions to add API key

---

#### 7. Clear Browser Cache

Sometimes the browser caches old responses.

**How to clear:**
- Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Safari: Cmd+Option+R

---

#### 8. Check for Build Errors

If the deployment succeeded but app still doesn't work:

**View Build Logs:**
1. Go to deployment in Vercel
2. Click "Building" or "Build Logs"
3. Look for errors related to:
   - `genkit` module
   - `@genkit-ai/googleai` module
   - TypeScript compilation errors

**Common Issue:** Missing dependencies

**Fix:** Ensure `package.json` has:
```json
{
  "dependencies": {
    "@genkit-ai/googleai": "1.14.1",
    "genkit": "1.16.1"
  }
}
```

---

## Still Not Working?

### Provide These Details:

1. **Vercel deployment URL** of the latest deployment
2. **Screenshot** of environment variables page (hide the actual key value)
3. **Deployment logs** - Copy the startup logs
4. **Browser console errors** - Press F12 → Console tab → Screenshot errors
5. **What message** the chatbot shows when you try to use it

### Additional Checks:

#### Check Environment Variable Scope
In Vercel settings, click on your `GEMINI_API_KEY` variable:
- Is it encrypted? (should show as `•••••••••`)
- Which environments? (should have all three checked)
- Does it show on the Deployments page for production?

#### Verify Deployment Branch
- Is your production deployment using the correct branch?
- Did you push to the right branch (main/master)?

#### Check Function Logs in Real-Time
1. Open Vercel dashboard
2. Go to Deployments → Latest deployment
3. Click "View Function Logs"
4. Open your site and try using the chatbot
5. Watch logs appear in real-time

Look for:
```
[AI Flow] shoppingAssistant called
[AI Flow] Products fetched: X
```

If you see `[AI] AI response successful` - it's working!

If you see errors - share the error message

---

## Quick Fix Commands

If all else fails, try these:

**1. Remove and re-add the variable:**
```bash
# Via Vercel CLI
vercel env rm GEMINI_API_KEY production
vercel env add GEMINI_API_KEY production
# Enter your API key when prompted
```

**2. Force a clean deployment:**
```bash
git commit --allow-empty -m "Force redeploy"
git push origin master --force-with-lease
```

**3. Check your API key is actually set:**
```bash
vercel env ls
```

You should see `GEMINI_API_KEY` listed for production.

---

## Contact Support

If you've tried everything above and it still doesn't work, provide:
- Vercel deployment URL
- Screenshot of environment variables (hide key value)
- Copy of deployment logs
- Error message from chatbot
