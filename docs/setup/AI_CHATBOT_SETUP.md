# AI Chatbot Setup Guide - OpenAI & Gemini Support

## Overview

The Lumo AI chatbot (Luna) now supports **both OpenAI and Google Gemini** with automatic selection. Manual fallback responses have been removed - the chatbot now relies 100% on AI for intelligent responses.

## ✅ Changes Made

### 1. **Removed Manual Fallback Responses**
- Deleted 80+ lines of hardcoded keyword matching
- Removed manual greetings, product search, and follow-up responses
- AI now handles ALL user queries intelligently

### 2. **Added Dual AI Provider Support**
- **OpenAI GPT-4o** (primary option)
- **Google Gemini 1.5 Flash** (alternative option)
- Automatic provider selection based on available API keys

### 3. **Smart Provider Selection**
```typescript
Priority order:
1. OpenAI (if OPENAI_API_KEY is set)
2. Gemini (if GEMINI_API_KEY or GOOGLE_API_KEY is set)
3. Error (if no API key configured)
```

### 4. **Enhanced Error Handling**
- Clear error messages when AI is unavailable
- Detailed logging for debugging
- No confusing fallback behavior

## 🚀 How to Configure

### Option 1: Use OpenAI (Currently Configured)

Your system already has OpenAI configured. No action needed!

```bash
# Already in your .env.local:
OPENAI_API_KEY=sk-...
```

**Pros:**
- ✅ More reliable and consistent
- ✅ Better reasoning capabilities
- ✅ Lower latency

**Cons:**
- ❌ Costs per token (pay as you go)
- ❌ Requires credit card on OpenAI account

### Option 2: Switch to Google Gemini (Free Tier Available)

If you want to use Gemini instead:

1. **Get Gemini API Key:**
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to Environment:**
   ```bash
   # Add to .env.local:
   GEMINI_API_KEY=your-gemini-key-here

   # Optional: Remove OpenAI key to force Gemini usage
   # OPENAI_API_KEY=...  # Comment this out
   ```

3. **Restart Server:**
   ```bash
   # Stop the dev server and restart
   npm run dev
   ```

**Pros:**
- ✅ Free tier: 15 requests/minute, 1500 requests/day
- ✅ No credit card required
- ✅ Fast responses

**Cons:**
- ❌ Rate limits on free tier
- ❌ Slightly less consistent than GPT-4

### Option 3: Use Both (Automatic Fallback)

Keep both API keys configured for redundancy:

```bash
# In .env.local:
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=your-gemini-key-here
```

The system will use OpenAI by default, but you can switch by commenting out the OpenAI key.

## 📊 API Key Comparison

| Feature | OpenAI GPT-4o | Google Gemini 1.5 Flash |
|---------|---------------|-------------------------|
| **Free Tier** | No (paid only) | Yes (15 req/min) |
| **Cost** | ~$0.005/1K tokens | Free or $0.0001/1K tokens |
| **Quality** | Excellent | Very Good |
| **Speed** | Fast | Very Fast |
| **Context** | 128K tokens | 1M tokens |
| **Setup** | Credit card required | No credit card needed |

## 🔍 How It Works

### Request Flow:

```
User Message
  ↓
API Route (/api/assistant)
  ↓
Shopping Assistant (admin commands check)
  ↓
Product Question Answering (AI prompt)
  ↓
Genkit (OpenAI or Gemini)
  ↓
AI Response
  ↓
User sees intelligent answer
```

### What AI Handles:

- ✅ Product questions and recommendations
- ✅ Natural language understanding
- ✅ Conversation context and history
- ✅ Admin business insights
- ✅ Greetings and small talk
- ✅ Follow-up questions
- ✅ Clarifications and corrections

### No More Hardcoded Responses For:

- ❌ Keyword matching ("show me products with X")
- ❌ Manual greetings
- ❌ Fuzzy search fallbacks
- ❌ Generic error messages

## 🧪 Testing the Chatbot

### Test Cases:

1. **Greetings:**
   ```
   User: "Hi!"
   AI: [Warm personalized greeting with context]
   ```

2. **Product Search:**
   ```
   User: "Show me wireless headphones"
   AI: [Intelligent product recommendations with details]
   ```

3. **Follow-up Questions:**
   ```
   User: "Tell me more about the first one"
   AI: [Contextual response based on conversation history]
   ```

4. **Admin Queries (for admin users):**
   ```
   User: "What are today's sales?"
   AI: [Detailed sales summary with data]
   ```

5. **Complex Questions:**
   ```
   User: "I need a gift for my mom who loves skincare"
   AI: [Thoughtful recommendations with reasoning]
   ```

## 🛠️ Troubleshooting

### Issue: "I'm having trouble connecting to my AI services"

**Cause:** No API key configured or invalid key

**Fix:**
1. Check `.env.local` has either `OPENAI_API_KEY` or `GEMINI_API_KEY`
2. Verify the key is valid (not expired)
3. Check the key has proper permissions
4. Restart dev server after adding key

### Issue: Rate limit errors

**Cause:** Exceeded API quota

**Fix for OpenAI:**
- Add credits to your OpenAI account
- Check usage at: https://platform.openai.com/usage

**Fix for Gemini:**
- Wait for rate limit reset (1 minute)
- Upgrade to paid tier for higher limits
- Or switch to OpenAI

### Issue: Slow responses

**Possible Causes:**
- High API latency
- Large conversation history
- Complex product queries

**Fix:**
- Use Gemini 1.5 Flash (faster than GPT-4)
- Clear chat after long conversations
- Optimize product data size

## 📝 Environment Variables Reference

```bash
# AI Provider Keys (set at least one)
OPENAI_API_KEY=sk-proj-...           # OpenAI GPT-4o
GEMINI_API_KEY=AIza...               # Google Gemini
GOOGLE_API_KEY=AIza...               # Alternative Gemini key name

# Other AI Settings (optional)
# These are set in code, not env vars:
# - Model selection (GPT-4o or Gemini 1.5 Flash)
# - Temperature, max tokens, etc.
```

## 🎯 Recommendations

### For Development:
- **Use Gemini** (free tier is sufficient)
- No credit card needed
- 1500 requests/day is plenty for testing

### For Production:
- **Use OpenAI GPT-4o** (better quality)
- More reliable and consistent
- Better reasoning for complex queries
- Worth the cost for customer experience

### For Cost Optimization:
- **Use Gemini 1.5 Flash** (very cheap)
- $0.0001/1K tokens = ~$0.01 per 100 conversations
- Good balance of quality and cost

## 📚 Additional Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **Gemini API Docs:** https://ai.google.dev/docs
- **Genkit Framework:** https://firebase.google.com/docs/genkit
- **Rate Limits:** Already implemented in `/lib/rate-limiter.ts`

## ✅ Success Criteria

Your chatbot is working properly when:

- [x] Users get intelligent, contextual responses
- [x] No hardcoded keyword matching
- [x] Conversation history is maintained
- [x] Admin users get business insights
- [x] Error messages are clear and helpful
- [x] Responses feel natural and human-like

## 🎉 Benefits

**Before (Manual Fallback):**
- Limited to keyword matching
- Generic, scripted responses
- No context awareness
- Frequent "I don't understand"

**After (AI-Powered):**
- ✅ Natural language understanding
- ✅ Contextual, intelligent responses
- ✅ Learns from conversation history
- ✅ Handles complex queries
- ✅ Personalized recommendations
- ✅ Professional customer support experience

---

**Questions?** Check the logs at startup for AI provider selection:
```
[Genkit Init] Using OpenAI (GPT-4o)
```
or
```
[Genkit Init] Using Google Gemini (Gemini 1.5 Flash)
```
