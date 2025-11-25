import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // Check environment variables without exposing actual values
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    aiConfiguration: {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGoogleKey: !!process.env.GOOGLE_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      googleKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
      // Show first 10 characters only (safe to expose)
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not set',
      geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) || 'not set',
      googleKeyPrefix: process.env.GOOGLE_API_KEY?.substring(0, 10) || 'not set',
    },
    expectedConfiguration: {
      primary: process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o' : 
               (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'Google Gemini 1.5 Flash' : 
               'None configured',
    },
    recommendations: [] as string[],
  };

  // Add recommendations based on findings
  if (!diagnostics.aiConfiguration.hasOpenAIKey && !diagnostics.aiConfiguration.hasGeminiKey && !diagnostics.aiConfiguration.hasGoogleKey) {
    diagnostics.recommendations.push('❌ No AI API key configured! Add GEMINI_API_KEY or GOOGLE_API_KEY or OPENAI_API_KEY to Vercel environment variables.');
  } else if (diagnostics.aiConfiguration.hasGeminiKey && !diagnostics.aiConfiguration.hasGoogleKey) {
    diagnostics.recommendations.push('⚠️ GEMINI_API_KEY is set, but GOOGLE_API_KEY is not. The code checks for both. Add GOOGLE_API_KEY with the same value.');
  } else if (diagnostics.aiConfiguration.hasGoogleKey && !diagnostics.aiConfiguration.hasGeminiKey) {
    diagnostics.recommendations.push('⚠️ GOOGLE_API_KEY is set, but GEMINI_API_KEY is not. Consider adding GEMINI_API_KEY with the same value for redundancy.');
  } else if (diagnostics.aiConfiguration.hasGeminiKey && diagnostics.aiConfiguration.hasGoogleKey) {
    diagnostics.recommendations.push('✅ Both GEMINI_API_KEY and GOOGLE_API_KEY are configured. AI should work!');
  }

  if (diagnostics.aiConfiguration.hasOpenAIKey) {
    diagnostics.recommendations.push('✅ OPENAI_API_KEY is configured. Will use OpenAI GPT-4o as primary AI provider.');
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
