import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    nodeEnv: process.env.NODE_ENV,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'not set',
    allEnvKeys: Object.keys(process.env).filter(k => 
      k.includes('OPENAI') || k.includes('API') || k.includes('KEY')
    ).sort(),
  };

  return NextResponse.json(diagnostics);
}
