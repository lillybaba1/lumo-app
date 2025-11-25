import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    nodeEnv: process.env.NODE_ENV,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not set',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) || 'not set',
    hasGoogleKey: !!process.env.GOOGLE_API_KEY,
    googleKeyLength: process.env.GOOGLE_API_KEY?.length || 0,
    googleKeyPrefix: process.env.GOOGLE_API_KEY?.substring(0, 10) || 'not set',
    allEnvKeys: Object.keys(process.env).filter(k =>
      k.includes('OPENAI') || k.includes('GEMINI') || k.includes('GOOGLE') || k.includes('API') || k.includes('KEY')
    ).sort(),
  };

  return NextResponse.json(diagnostics);
}
