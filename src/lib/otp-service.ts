/**
 * OTP (One-Time Password) Service
 * Handles SMS verification codes with rate limiting and expiry
 */

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';

const otpLogger = logger.child('OTPService');

export interface OTPResult {
  success: boolean;
  error?: string;
  remainingAttempts?: number;
  retryAfter?: number; // seconds until retry allowed
}

/**
 * OTP Configuration
 */
const OTP_CONFIG = {
  CODE_LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  MAX_SENDS_PER_HOUR: 3,
  RATE_LIMIT: {
    limit: 3, // 3 OTPs
    window: 60 * 60 * 1000, // per hour
  },
  VERIFICATION_RATE_LIMIT: {
    limit: 5, // 5 verification attempts
    window: 15 * 60 * 1000, // per 15 minutes
  },
};

/**
 * Generate a random numeric OTP code
 */
export function generateOTP(length: number = OTP_CONFIG.CODE_LENGTH): string {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
}

/**
 * Send OTP via Supabase Auth (SMS)
 */
export async function sendOTP(
  phoneNumber: string,
  purpose: 'signup' | 'phone_verification' | 'password_reset',
  ip: string
): Promise<OTPResult> {
  try {
    // Rate limit check by IP
    if (await rateLimiter.isRateLimited(`otp-send:${ip}`, OTP_CONFIG.RATE_LIMIT.limit, OTP_CONFIG.RATE_LIMIT.window)) {
      const retryAfter = await rateLimiter.getResetTime(`otp-send:${ip}`);
      return {
        success: false,
        error: `Too many OTP requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Rate limit check by phone number
    if (await rateLimiter.isRateLimited(`otp-send:${phoneNumber}`, OTP_CONFIG.RATE_LIMIT.limit, OTP_CONFIG.RATE_LIMIT.window)) {
      const retryAfter = await rateLimiter.getResetTime(`otp-send:${phoneNumber}`);
      return {
        success: false,
        error: `Too many OTP requests for this phone number. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    const supabase = await createClient();

    // For signup, use signUp with phone
    if (purpose === 'signup') {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send verification code',
        };
      }
    } else {
      // For other purposes, use resend or custom OTP
      const { error } = await supabase.auth.resend({
        type: 'sms',
        phone: phoneNumber,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send verification code',
        };
      }
    }

    // Store OTP record in database for tracking (optional - skip if table doesn't exist)
    try {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

      await supabase.from('otp_verifications').insert({
        phone_number: phoneNumber,
        code,
        purpose,
        expires_at: expiresAt.toISOString(),
      });
    } catch (dbError: any) {
      // Table might not exist yet - that's ok, OTP was still sent via Supabase Auth
      otpLogger.warn('OTP tracking failed (table may not exist)', { error: dbError.message });
    }

    return {
      success: true,
    };
  } catch (error: any) {
    otpLogger.error('OTP send error', error);
    return {
      success: false,
      error: 'An error occurred while sending the verification code. Please try again.',
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string,
  ip: string
): Promise<OTPResult> {
  try {
    // Rate limit verification attempts
    if (
      await rateLimiter.isRateLimited(
        `otp-verify:${phoneNumber}`,
        OTP_CONFIG.VERIFICATION_RATE_LIMIT.limit,
        OTP_CONFIG.VERIFICATION_RATE_LIMIT.window
      )
    ) {
      const retryAfter = await rateLimiter.getResetTime(`otp-verify:${phoneNumber}`);
      return {
        success: false,
        error: `Too many verification attempts. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    const supabase = await createClient();

    // Verify with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: code,
      type: 'sms',
    });

    if (error) {
      // Track failed attempt (optional - skip if table doesn't exist)
      try {
        const { data: otpRecord } = await supabase
          .from('otp_verifications')
          .select('attempts')
          .eq('phone_number', phoneNumber)
          .eq('verified', false)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (otpRecord) {
          const newAttempts = (otpRecord.attempts || 0) + 1;
          await supabase
            .from('otp_verifications')
            .update({ attempts: newAttempts })
            .eq('phone_number', phoneNumber)
            .eq('verified', false);

          const remaining = Math.max(0, OTP_CONFIG.MAX_ATTEMPTS - newAttempts);

          if (remaining === 0) {
            return {
              success: false,
              error: 'Maximum verification attempts exceeded. Please request a new code.',
              remainingAttempts: 0,
            };
          }

          return {
            success: false,
            error: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            remainingAttempts: remaining,
          };
        }
      } catch (dbError: any) {
        // Table might not exist yet - just return the auth error
        otpLogger.warn('OTP tracking query failed (table may not exist)', { error: dbError.message });
      }

      return {
        success: false,
        error: error.message || 'Invalid or expired verification code',
      };
    }

    // Mark OTP as verified (optional - skip if table doesn't exist)
    try {
      await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('phone_number', phoneNumber)
        .eq('verified', false);
    } catch (dbError: any) {
      otpLogger.warn('OTP verification tracking failed (table may not exist)', { error: dbError.message });
    }

    // Update user's phone_verified status
    if (data.user) {
      try {
        await supabaseAdmin
          .from('users')
          .update({ phone_verified: true })
          .eq('id', data.user.id);
      } catch (dbError: any) {
        otpLogger.warn('Failed to update phone_verified status', { error: dbError.message });
      }
    }

    return {
      success: true,
    };
  } catch (error: any) {
    otpLogger.error('OTP verification error', error);
    return {
      success: false,
      error: 'An error occurred during verification. Please try again.',
    };
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(phoneNumber: string, ip: string): Promise<OTPResult> {
  return sendOTP(phoneNumber, 'phone_verification', ip);
}

/**
 * Check if phone number already exists
 */
export async function checkPhoneExists(phoneNumber: string): Promise<boolean> {
  try {
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Check if email already exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // Use admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}
