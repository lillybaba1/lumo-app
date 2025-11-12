"use client";

import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRY_CODES } from '@/lib/phone-validation';

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

/**
 * Enhanced country code selector with auto-detection
 */
export function CountryCodeSelector({ value, onChange, disabled }: CountryCodeSelectorProps) {
  // Auto-detect country from browser locale
  useEffect(() => {
    if (!value) {
      const locale = navigator.language || 'en-US';
      const country = locale.split('-')[1] || 'US';

      // Map country codes to phone codes
      const countryToPhone: Record<string, string> = {
        'US': '+1',
        'CA': '+1',
        'GB': '+44',
        'UK': '+44',
        'IN': '+91',
        'CN': '+86',
        'JP': '+81',
        'DE': '+49',
        'FR': '+33',
        'AU': '+61',
        'BR': '+55',
        'MX': '+52',
        'ES': '+34',
        'IT': '+39',
        'RU': '+7',
        'KR': '+82',
        'ID': '+62',
        'ZA': '+27',
        'NG': '+234',
        'GM': '+220',
        'KE': '+254',
        'UG': '+256',
      };

      const detected = countryToPhone[country];
      if (detected && COUNTRY_CODES.find(c => c.code === detected)) {
        onChange(detected);
      } else {
        // Default to US if not detected
        onChange('+1');
      }
    }
  }, [value, onChange]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[160px]" aria-label="Select country code">
        <SelectValue placeholder="Country code" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {COUNTRY_CODES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.code} {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
