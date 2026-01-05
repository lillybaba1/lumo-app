"use server";

import { headers } from 'next/headers';

/**
 * IP Extraction Utilities for Vercel Deployment
 * 
 * Vercel sets the following headers:
 * - x-vercel-forwarded-for: Original client IP (most reliable)
 * - x-real-ip: Real client IP
 * - x-forwarded-for: Standard proxy header
 * 
 * If using Cloudflare in front of Vercel:
 * - cf-connecting-ip: Cloudflare's client IP header
 * - true-client-ip: Cloudflare Enterprise / Akamai
 */

export interface ClientInfo {
  ip: string;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
}

/**
 * Get the real client IP address from request headers
 * Works with Vercel, Cloudflare, and other proxies
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return extractIPFromHeaders(headersList);
}

/**
 * Extract IP from a Headers object (sync version for use in routes)
 */
export function extractIPFromHeaders(headersList: Headers): string {
  // Vercel-specific headers (most reliable on Vercel)
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Vercel also sets x-real-ip
  const vercelRealIP = headersList.get('x-real-ip');
  if (vercelRealIP) {
    return vercelRealIP;
  }

  // Cloudflare header (if using Cloudflare in front of Vercel)
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // True-Client-IP (Cloudflare Enterprise or Akamai)
  const trueClientIP = headersList.get('true-client-ip');
  if (trueClientIP) {
    return trueClientIP;
  }

  // Standard X-Forwarded-For header
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback
  return '0.0.0.0';
}

/**
 * Get full client info including geolocation from Vercel headers
 * Vercel provides geolocation data in headers on Edge/Serverless functions
 */
export async function getClientInfo(): Promise<ClientInfo> {
  const headersList = await headers();
  
  return {
    ip: extractIPFromHeaders(headersList),
    userAgent: headersList.get('user-agent'),
    // Vercel geolocation headers
    country: headersList.get('x-vercel-ip-country'),
    city: headersList.get('x-vercel-ip-city'),
    region: headersList.get('x-vercel-ip-country-region'),
  };
}

/**
 * Check if an IP is a private/internal IP
 * These should not be logged as they indicate a proxy misconfiguration
 */
export function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^10\./,                          // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,                    // 192.168.0.0/16
    /^127\./,                         // 127.0.0.0/8 (loopback)
    /^169\.254\./,                    // 169.254.0.0/16 (link-local)
    /^0\.0\.0\.0/,                    // Invalid
  ];

  // IPv6 private/local
  const ipv6Private = [
    /^::1$/,          // Loopback
    /^fe80:/i,        // Link-local
    /^fc00:/i,        // Unique local
    /^fd00:/i,        // Unique local
  ];

  for (const regex of privateRanges) {
    if (regex.test(ip)) return true;
  }

  for (const regex of ipv6Private) {
    if (regex.test(ip)) return true;
  }

  return false;
}

/**
 * Validate that a string is a valid IP address
 */
export function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every(part => part >= 0 && part <= 255);
  }

  // IPv6 (simplified check)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip);
}
