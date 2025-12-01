import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  // SECURITY: Require admin authentication for diagnostics
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Only show safe diagnostics info - no key prefixes
  const url = new URL(req.url);
  const testAI = url.searchParams.get('testAI') === 'true';

  const diagnostics: any = {
    nodeEnv: process.env.NODE_ENV,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasGoogleKey: !!process.env.GOOGLE_API_KEY,
    // SECURITY: Removed key prefixes and lengths - only show boolean presence
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
