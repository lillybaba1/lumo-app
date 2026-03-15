/**
 * Country data with calling codes, flags, and phone validation
 * Sorted by relevance: Gambia first, then West Africa, then rest of Africa, then world
 */

export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;   // E.g. "+220"
  flag: string;       // Emoji flag
  pattern: RegExp;    // Validation pattern for local number
  format: string;     // Display format hint
  maxLength: number;  // Max digits in local number
}

export const COUNTRIES: Country[] = [
  // === Priority: Gambia (home market) ===
  { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲', pattern: /^\d{7}$/, format: 'XXX XXXX', maxLength: 7 },

  // === West Africa ===
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳', pattern: /^\d{9}$/, format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', pattern: /^\d{8}$/, format: 'XXXX XXXX', maxLength: 8 },
  { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳', pattern: /^\d{9}$/, format: 'XXX XX XX XX', maxLength: 9 },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', flag: '🇨🇮', pattern: /^\d{10}$/, format: 'XX XX XX XX XX', maxLength: 10 },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', pattern: /^\d{8}$/, format: 'XX XX XX XX', maxLength: 8 },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪', pattern: /^\d{8}$/, format: 'XX XX XX XX', maxLength: 8 },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬', pattern: /^\d{8}$/, format: 'XX XX XX XX', maxLength: 8 },
  { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯', pattern: /^\d{8}$/, format: 'XX XX XX XX', maxLength: 8 },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷', pattern: /^\d{8}$/, format: 'XXXX XXXX', maxLength: 8 },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱', pattern: /^\d{8}$/, format: 'XX XXX XXX', maxLength: 8 },
  { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷', pattern: /^\d{7,8}$/, format: 'XXX XXX XXXX', maxLength: 8 },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', flag: '🇬🇼', pattern: /^\d{7}$/, format: 'XXX XXXX', maxLength: 7 },
  { code: 'CV', name: 'Cape Verde', dialCode: '+238', flag: '🇨🇻', pattern: /^\d{7}$/, format: 'XXX XXXX', maxLength: 7 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', pattern: /^\d{10}$/, format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', pattern: /^\d{9}$/, format: 'XX XXX XXXX', maxLength: 9 },

  // === Rest of Africa ===
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', pattern: /^\d{9}$/, format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹', pattern: /^\d{9}$/, format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', pattern: /^\d{10}$/, format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲', pattern: /^\d{9}$/, format: 'XXX XX XX XX', maxLength: 9 },
  { code: 'CD', name: 'DR Congo', dialCode: '+243', flag: '🇨🇩', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },

  // === Europe ===
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', pattern: /^\d{10}$/, format: 'XXXX XXXXXX', maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', pattern: /^\d{10,11}$/, format: 'XXX XXXXXXX', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', pattern: /^\d{9}$/, format: 'X XX XX XX XX', maxLength: 9 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', pattern: /^\d{9}$/, format: 'XXX XXX XXX', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', pattern: /^\d{10}$/, format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', pattern: /^\d{9}$/, format: 'X XXXX XXXX', maxLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', pattern: /^\d{9}$/, format: 'XX XXX XX XX', maxLength: 9 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', pattern: /^\d{8}$/, format: 'XXX XX XXX', maxLength: 8 },

  // === Americas ===
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', pattern: /^\d{10}$/, format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', pattern: /^\d{10}$/, format: '(XXX) XXX-XXXX', maxLength: 10 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', pattern: /^\d{11}$/, format: 'XX XXXXX XXXX', maxLength: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', pattern: /^\d{10}$/, format: 'XXX XXX XXXX', maxLength: 10 },

  // === Asia & Middle East ===
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', pattern: /^\d{10}$/, format: 'XXXXX XXXXX', maxLength: 10 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', pattern: /^\d{11}$/, format: 'XXX XXXX XXXX', maxLength: 11 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', pattern: /^\d{10}$/, format: 'XX XXXX XXXX', maxLength: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', pattern: /^\d{10,11}$/, format: 'XX XXXX XXXX', maxLength: 11 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', pattern: /^\d{9}$/, format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', pattern: /^\d{9}$/, format: 'XX XXX XXXX', maxLength: 9 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', pattern: /^\d{10}$/, format: 'XXX XXX XXXX', maxLength: 10 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', pattern: /^\d{10}$/, format: 'XXX XXX XXXX', maxLength: 10 },

  // === Oceania ===
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', pattern: /^\d{9}$/, format: 'X XXXX XXXX', maxLength: 9 },
];

/**
 * Find country by ISO code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

/**
 * Find country by dial code
 */
export function getCountryByDialCode(dialCode: string): Country | undefined {
  return COUNTRIES.find(c => c.dialCode === dialCode);
}

/**
 * Validate phone number for a specific country
 */
export function validatePhoneForCountry(localNumber: string, country: Country): boolean {
  const digits = localNumber.replace(/\D/g, '');
  return country.pattern.test(digits);
}

/**
 * Format full phone number in E.164 format
 */
export function formatE164(dialCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  return `${dialCode}${digits}`;
}
