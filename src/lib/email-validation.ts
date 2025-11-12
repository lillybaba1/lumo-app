/**
 * Advanced email validation service
 * - Format validation
 * - Disposable email detection
 * - Domain verification
 */

import { z } from 'zod';

/**
 * List of known disposable/temporary email providers
 * In production, consider using a service like https://github.com/disposable-email-domains/disposable-email-domains
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'maildrop.cc',
  'tempmail.com',
  'trashmail.com',
  'getnada.com',
  'sharklasers.com',
  'guerrillamail.info',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.de',
  'spam4.me',
  'mintemail.com',
  'emailondeck.com',
  'fakeinbox.com',
  'tmpeml.com',
  'dispostable.com',
  'spamgourmet.com',
  '33mail.com',
  'jetable.org',
  'mailnesia.com',
  'mailcatch.com',
  'mytemp.email',
  'mohmal.com',
  'inboxbear.com',
  'temp-mail.io',
]);

/**
 * Email validation result
 */
export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
}

/**
 * Common email typos and their corrections
 */
const COMMON_TYPOS: Record<string, string> = {
  'gmail.con': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
};

/**
 * Basic email format validation using regex
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Check if email is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = extractDomain(email);
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Check for common typos and suggest corrections
 */
export function suggestEmailCorrection(email: string): string | null {
  const domain = extractDomain(email);
  const correction = COMMON_TYPOS[domain];

  if (correction) {
    const localPart = email.split('@')[0];
    return `${localPart}@${correction}`;
  }

  return null;
}

/**
 * Verify email domain has valid MX records
 * Note: This requires DNS lookups which aren't available in Edge Runtime or browser
 * For server-side validation only - skipped on client
 */
export async function verifyDomainMX(domain: string): Promise<boolean> {
  // Skip MX check in browser or Edge Runtime
  if (typeof window !== 'undefined') {
    return true;
  }

  // Skip if not in Node.js environment
  if (typeof process === 'undefined' || process.env.NEXT_RUNTIME === 'edge') {
    return true;
  }

  try {
    // Only import dns in server environment
    const { promises: dns } = require('dns');
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    // If DNS lookup fails or module not available, be permissive
    return true;
  }
}

/**
 * Comprehensive email validation
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  // Trim and lowercase
  const normalizedEmail = email.trim().toLowerCase();

  // Check format
  if (!validateEmailFormat(normalizedEmail)) {
    const suggestion = suggestEmailCorrection(normalizedEmail);
    return {
      valid: false,
      error: 'Invalid email format. Please check your email address.',
      suggestions: suggestion ? [suggestion] : undefined,
    };
  }

  // Check for disposable email
  if (isDisposableEmail(normalizedEmail)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
    };
  }

  // Extract domain
  const domain = extractDomain(normalizedEmail);

  // Check if domain looks suspicious
  if (domain.length < 3) {
    return {
      valid: false,
      error: 'Email domain appears to be invalid.',
    };
  }

  // Verify MX records (server-side only)
  const hasMX = await verifyDomainMX(domain);
  if (!hasMX) {
    return {
      valid: false,
      error: 'Email domain does not appear to be valid. Please check your email address.',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Zod schema for validated email
 */
export const validatedEmailSchema = z.string().refine(
  async (email) => {
    const result = await validateEmail(email);
    return result.valid;
  },
  {
    message: 'Please enter a valid email address',
  }
);

/**
 * Quick synchronous email validation (no MX check)
 * Use this for client-side validation
 */
export function validateEmailQuick(email: string): EmailValidationResult {
  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmailFormat(normalizedEmail)) {
    const suggestion = suggestEmailCorrection(normalizedEmail);
    return {
      valid: false,
      error: 'Invalid email format. Please check your email address.',
      suggestions: suggestion ? [suggestion] : undefined,
    };
  }

  if (isDisposableEmail(normalizedEmail)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed. Please use a permanent email address.',
    };
  }

  const domain = extractDomain(normalizedEmail);
  if (domain.length < 3) {
    return {
      valid: false,
      error: 'Email domain appears to be invalid.',
    };
  }

  return {
    valid: true,
  };
}
