/**
 * Debug endpoint to check AI configuration status
 * DELETE THIS FILE after debugging!
 *
 * Visit: https://your-domain.vercel.app/api/debug/env-check
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Check environment variables
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_API_KEY;

  const openaiKeyPreview = process.env.OPENAI_API_KEY
    ? `${process.env.OPENAI_API_KEY.substring(0, 8)}...`
    : 'NOT SET';

  const geminiKeyPreview = process.env.GEMINI_API_KEY
    ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...`
    : 'NOT SET';

  const googleKeyPreview = process.env.GOOGLE_API_KEY
    ? `${process.env.GOOGLE_API_KEY.substring(0, 8)}...`
    : 'NOT SET';

  // Try to import AI config
  let aiConfig;
  try {
    const { hasAIConfigured, selectedModel } = await import('@/ai/genkit');
    aiConfig = {
      configured: hasAIConfigured,
      model: selectedModel,
      error: null
    };
  } catch (error) {
    aiConfig = {
      configured: false,
      model: 'Error loading AI',
      error: error instanceof Error ? error.message : String(error)
    };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    aiStatus: aiConfig,
    environmentVariables: {
      OPENAI_API_KEY: {
        present: hasOpenAI,
        preview: openaiKeyPreview
      },
      GEMINI_API_KEY: {
        present: hasGemini,
        preview: geminiKeyPreview
      },
      GOOGLE_API_KEY: {
        present: hasGoogle,
        preview: googleKeyPreview
      }
    },
    recommendation: !hasOpenAI && !hasGemini && !hasGoogle
      ? '❌ NO API KEYS FOUND! Add GOOGLE_API_KEY to Vercel environment variables and redeploy.'
      : '✅ At least one API key is configured.',
    nextSteps: !hasOpenAI && !hasGemini && !hasGoogle
      ? [
          '1. Go to Vercel Dashboard → Your Project',
          '2. Settings → Environment Variables',
          '3. Add: GOOGLE_API_KEY = your_api_key',
          '4. Select "Production" environment',
          '5. Redeploy WITHOUT build cache'
        ]
      : [
          '✅ API key found!',
          'If AI still not working, check:',
          '- Is the API key valid?',
          '- Did you redeploy after adding it?',
          '- Check function logs for errors'
        ]
  });
}
