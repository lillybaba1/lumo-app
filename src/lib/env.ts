/**
 * Environment variable validation
 * Validates required environment variables at startup
 * Throws descriptive errors if any are missing or invalid
 */

import { z } from 'zod';

/**
 * Schema for all required environment variables
 */
const envSchema = z.object({
  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .refine(
      (url) => url.includes('supabase.co'),
      'NEXT_PUBLIC_SUPABASE_URL must be a Supabase URL'
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // AI - Optional but validated if present
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Redis - Optional (falls back to in-memory)
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  REDIS_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email - Optional
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Type for validated environment
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Cached validated environment
 */
let validatedEnv: Env | null = null;

/**
 * Validate and return environment variables
 * Throws an error with details if validation fails
 */
export function validateEnv(): Env {
  // Return cached result if already validated
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    console.error('\n❌ Environment variable validation failed:\n' + errors + '\n');
    
    // In production, throw error to prevent startup with invalid config
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing or invalid environment variables. Check server logs.');
    }
    
    // In development, warn but don't crash
    console.warn('⚠️  Continuing with potentially invalid environment in development mode.\n');
  }

  // Cache the result
  validatedEnv = result.success ? result.data : (process.env as unknown as Env);
  
  return validatedEnv;
}

/**
 * Get validated environment (lazy validation)
 * Use this instead of direct process.env access for type safety
 */
export function getEnv(): Env {
  return validateEnv();
}

/**
 * Check if a specific feature is enabled based on env vars
 */
export const features = {
  get hasRedis(): boolean {
    const env = getEnv();
    return !!(env.REDIS_URL || env.UPSTASH_REDIS_REST_URL);
  },
  get hasAI(): boolean {
    const env = getEnv();
    return !!(env.GOOGLE_API_KEY || env.GEMINI_API_KEY || env.OPENAI_API_KEY);
  },
  get hasEmail(): boolean {
    const env = getEnv();
    return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  },
  get isProduction(): boolean {
    return getEnv().NODE_ENV === 'production';
  },
  get isDevelopment(): boolean {
    return getEnv().NODE_ENV === 'development';
  },
};
