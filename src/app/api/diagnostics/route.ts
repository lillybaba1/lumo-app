import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testAI = url.searchParams.get('testAI') === 'true';

  const diagnostics: any = {
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

  // Optional: Test AI functionality with a simple query
  if (testAI) {
    diagnostics.aiTest = { status: 'testing' };
    try {
      // Try to initialize genkit to see if it throws an error
      const { hasAIConfigured, selectedModel } = await import('@/ai/genkit');

      if (!hasAIConfigured) {
        diagnostics.aiTest = {
          status: 'failed',
          error: 'No AI API key configured',
          selectedModel: null,
        };
      } else {
        // Try a simple test query
        const { shoppingAssistant } = await import('@/ai/flows/shopping-assistant');
        const testStart = Date.now();
        const result = await shoppingAssistant({
          query: 'test',
          history: [],
          userRole: 'customer',
        });
        const testDuration = Date.now() - testStart;

        diagnostics.aiTest = {
          status: 'success',
          selectedModel,
          responseTime: `${testDuration}ms`,
          responseLength: result.answer?.length || 0,
        };
      }
    } catch (error: any) {
      diagnostics.aiTest = {
        status: 'failed',
        error: error?.message || 'Unknown error',
        errorType: error?.name || 'UnknownError',
        errorStack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      };
    }
  }

  return NextResponse.json(diagnostics);
}
