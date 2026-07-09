/**
 * Utility functions for ZEWKA Luxury Boutique
 */

/**
 * Format price dynamically using site currency setting and language
 */
export function formatPrice(price: number, currency: string = '$', isArabic: boolean = true): string {
  const cleanCurrency = currency || '$';
  const displayPrice = typeof price === 'number' ? price.toFixed(1) : parseFloat(price as any).toFixed(1);
  
  if (cleanCurrency === '$') {
    return `$${displayPrice}`;
  }
  
  // For other currencies (like SAR, EGP, AED), place it after the number with a space
  return isArabic ? `${displayPrice} ${cleanCurrency}` : `${displayPrice} ${cleanCurrency}`;
}
