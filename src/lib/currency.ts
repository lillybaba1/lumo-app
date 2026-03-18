/**
 * Currency formatting utilities
 */

/**
 * Get the currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string | undefined): string {
  if (!currencyCode) return '$';
  if (currencyCode === 'GMD') return 'D';
  
  try {
    const parts = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currencyCode 
    }).formatToParts(1);
    
    return parts.find(p => p.type === 'currency')?.value || '$';
  } catch {
    return '$';
  }
}

/**
 * Format a price with the currency symbol
 */
export function formatPrice(
  amount: number, 
  currencyCode?: string,
  options?: { decimals?: number }
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const decimals = options?.decimals ?? 2;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Format a price range
 */
export function formatPriceRange(
  min: number,
  max: number,
  currencyCode?: string
): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${min.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${symbol}${max.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
