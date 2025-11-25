import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Genkit AI Initialization', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('should use gemini15Flash model when GEMINI_API_KEY is set', async () => {
    // Set up environment for Gemini
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.OPENAI_API_KEY;

    // Import the module - this will initialize the AI
    const { selectedModel, hasAIConfigured } = await import('../genkit');

    // Verify the correct model is selected
    expect(selectedModel).toBe('Google Gemini 1.5 Flash');
    expect(hasAIConfigured).toBe(true);
  });

  it('should use OpenAI GPT-4o when OPENAI_API_KEY is set', async () => {
    // Set up environment for OpenAI
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    // Import the module - this will initialize the AI
    const { selectedModel, hasAIConfigured } = await import('../genkit');

    // Verify the correct model is selected
    expect(selectedModel).toBe('OpenAI GPT-4o');
    expect(hasAIConfigured).toBe(true);
  });

  it('should prefer OpenAI when both API keys are set', async () => {
    // Set up environment with both keys
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    // Import the module - this will initialize the AI
    const { selectedModel, hasAIConfigured } = await import('../genkit');

    // Verify OpenAI is preferred
    expect(selectedModel).toBe('OpenAI GPT-4o');
    expect(hasAIConfigured).toBe(true);
  });

  it('should throw error when no API keys are configured', async () => {
    // Clear all API keys
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    // Importing should throw an error
    await expect(async () => {
      await import('../genkit');
    }).rejects.toThrow('No AI API key configured');
  });

  it('should use GOOGLE_API_KEY as fallback for Gemini', async () => {
    // Set up environment with GOOGLE_API_KEY instead of GEMINI_API_KEY
    process.env.GOOGLE_API_KEY = 'test-google-key';
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    // Import the module - this will initialize the AI
    const { selectedModel, hasAIConfigured } = await import('../genkit');

    // Verify the correct model is selected
    expect(selectedModel).toBe('Google Gemini 1.5 Flash');
    expect(hasAIConfigured).toBe(true);
  });
});
