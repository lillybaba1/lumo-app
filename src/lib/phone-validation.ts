/**
 * Phone number validation and normalization
 * Formats phone numbers to E.164 international format
 */

export interface PhoneValidationResult {
  valid: boolean;
  normalized?: string; // E.164 format: +[country code][number]
  error?: string;
}

/**
 * Country calling codes and validation patterns
 */
export const COUNTRY_CODES = [
  { code: '+1', name: 'US/Canada', pattern: /^\d{10}$/, format: '+1 (XXX) XXX-XXXX' },
  { code: '+44', name: 'UK', pattern: /^\d{10}$/, format: '+44 XXXX XXXXXX' },
  { code: '+91', name: 'India', pattern: /^\d{10}$/, format: '+91 XXXXX XXXXX' },
  { code: '+86', name: 'China', pattern: /^\d{11}$/, format: '+86 XXX XXXX XXXX' },
  { code: '+81', name: 'Japan', pattern: /^\d{10}$/, format: '+81 XX XXXX XXXX' },
  { code: '+49', name: 'Germany', pattern: /^\d{10,11}$/, format: '+49 XXX XXXXXXX' },
  { code: '+33', name: 'France', pattern: /^\d{9}$/, format: '+33 X XX XX XX XX' },
  { code: '+61', name: 'Australia', pattern: /^\d{9}$/, format: '+61 X XXXX XXXX' },
  { code: '+55', name: 'Brazil', pattern: /^\d{11}$/, format: '+55 XX XXXXX XXXX' },
  { code: '+52', name: 'Mexico', pattern: /^\d{10}$/, format: '+52 XXX XXX XXXX' },
  { code: '+34', name: 'Spain', pattern: /^\d{9}$/, format: '+34 XXX XXX XXX' },
  { code: '+39', name: 'Italy', pattern: /^\d{10}$/, format: '+39 XXX XXX XXXX' },
  { code: '+7', name: 'Russia', pattern: /^\d{10}$/, format: '+7 XXX XXX XX XX' },
  { code: '+82', name: 'South Korea', pattern: /^\d{10,11}$/, format: '+82 XX XXXX XXXX' },
  { code: '+62', name: 'Indonesia', pattern: /^\d{9,12}$/, format: '+62 XXX XXXX XXXX' },
  { code: '+27', name: 'South Africa', pattern: /^\d{9}$/, format: '+27 XX XXX XXXX' },
  { code: '+234', name: 'Nigeria', pattern: /^\d{10}$/, format: '+234 XXX XXX XXXX' },
  { code: '+220', name: 'Gambia', pattern: /^\d{7}$/, format: '+220 XXX XXXX' },
  { code: '+254', name: 'Kenya', pattern: /^\d{9}$/, format: '+254 XXX XXX XXX' },
  { code: '+256', name: 'Uganda', pattern: /^\d{9}$/, format: '+256 XXX XXX XXX' },
];

/**
 * Remove all non-digit characters from phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Parse phone number and extract country code and local number
 */
export function parsePhoneNumber(phone: string): { countryCode: string; localNumber: string } | null {
  // Remove all non-digit characters
  const sanitized = sanitizePhoneNumber(phone);

  // Try to match with known country codes (longest first)
  const sortedCountryCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

  for (const country of sortedCountryCodes) {
    const codeDigits = sanitizePhoneNumber(country.code);

    if (sanitized.startsWith(codeDigits)) {
      const localNumber = sanitized.slice(codeDigits.length);
      return {
        countryCode: country.code,
        localNumber,
      };
    }
  }

  return null;
}

/**
 * Validate phone number format for a specific country code
 */
export function validatePhoneForCountry(localNumber: string, countryCode: string): boolean {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);

  if (!country) {
    // Unknown country code - be permissive
    return localNumber.length >= 6 && localNumber.length <= 15;
  }

  return country.pattern.test(localNumber);
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode: string = '+1'): string {
  const sanitized = sanitizePhoneNumber(phone);

  // Already has country code
  if (sanitized.startsWith('+') || phone.startsWith('+')) {
    const parsed = parsePhoneNumber(phone);
    if (parsed) {
      return `${parsed.countryCode}${parsed.localNumber}`;
    }
  }

  // Try parsing with + prefix
  const withPlus = '+' + sanitized;
  const parsed = parsePhoneNumber(withPlus);
  if (parsed) {
    return `${parsed.countryCode}${parsed.localNumber}`;
  }

  // Assume default country code
  const defaultCodeDigits = sanitizePhoneNumber(defaultCountryCode);
  if (sanitized.startsWith(defaultCodeDigits)) {
    return `${defaultCountryCode}${sanitized.slice(defaultCodeDigits.length)}`;
  }

  return `${defaultCountryCode}${sanitized}`;
}

/**
 * Validate and normalize phone number
 */
export function validatePhoneNumber(phone: string, countryCode?: string): PhoneValidationResult {
  if (!phone || phone.trim().length === 0) {
    return {
      valid: false,
      error: 'Phone number is required',
    };
  }

  const trimmed = phone.trim();

  // Normalize to E.164 format
  const normalized = countryCode
    ? normalizePhoneNumber(trimmed, countryCode)
    : normalizePhoneNumber(trimmed);

  // Parse to validate
  const parsed = parsePhoneNumber(normalized);

  if (!parsed) {
    return {
      valid: false,
      error: 'Invalid phone number format. Please include country code.',
    };
  }

  // Validate length
  if (!validatePhoneForCountry(parsed.localNumber, parsed.countryCode)) {
    const country = COUNTRY_CODES.find(c => c.code === parsed.countryCode);
    return {
      valid: false,
      error: country
        ? `Invalid phone number for ${country.name}. Expected format: ${country.format}`
        : 'Invalid phone number format',
    };
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const parsed = parsePhoneNumber(phone);

  if (!parsed) {
    return phone;
  }

  const country = COUNTRY_CODES.find(c => c.code === parsed.countryCode);

  if (!country) {
    return `${parsed.countryCode} ${parsed.localNumber}`;
  }

  // Simple formatting - replace X's in format string with digits
  let formatted = country.format;
  const digits = (parsed.countryCode + parsed.localNumber).replace(/\D/g, '');

  let digitIndex = 0;
  formatted = formatted.replace(/X/g, () => {
    return digitIndex < digits.length ? digits[digitIndex++] : 'X';
  });

  return formatted;
}

/**
 * Get country code info by code
 */
export function getCountryInfo(code: string) {
  return COUNTRY_CODES.find(c => c.code === code);
}

/**
 * Detect country code from phone number
 */
export function detectCountryCode(phone: string): string | null {
  const parsed = parsePhoneNumber(phone);
  return parsed ? parsed.countryCode : null;
}
