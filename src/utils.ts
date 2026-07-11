import { Product, Category } from './types';

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

/**
 * Robustly matches a product's category against a given target category ID.
 * This is case-insensitive, trimmed, and falls back to comparing by English/Arabic category names
 * if the ID doesn't match directly, to prevent issues with dynamic database schemas.
 */
export function matchProductCategory(prod: Product, categoryId: string, categories: Category[]): boolean {
  if (!categoryId || categoryId === 'all') return true;
  
  const targetId = categoryId.toLowerCase().trim();
  const prodCat = prod.category?.toLowerCase().trim() || '';
  const prodCatAr = prod.categoryAr?.trim() || '';
  
  // 1. Direct ID match
  if (prodCat === targetId) return true;
  
  // 2. Find the category object in our definitions
  const catObj = categories.find(c => c.id.toLowerCase().trim() === targetId);
  if (catObj) {
    const catNameLower = catObj.name?.toLowerCase().trim() || '';
    const catNameAr = catObj.nameAr?.trim() || '';
    
    if (prodCat === catNameLower) return true;
    if (prodCatAr === catNameAr) return true;
    if (prodCat === catNameAr.toLowerCase()) return true;
  }
  
  return false;
}

/**
 * Robustly matches a product's subcategory against a target subcategory ID.
 */
export function matchProductSubcategory(
  prod: Product,
  subcategoryId: string,
  selectedCategory: string,
  categories: Category[]
): boolean {
  if (!subcategoryId || subcategoryId === '') return true;
  
  const targetSubId = subcategoryId.toLowerCase().trim();
  const prodSub = prod.subcategory?.toLowerCase().trim() || '';
  const prodSubAr = prod.subcategoryAr?.trim() || '';
  
  // 1. Direct ID match
  if (prodSub === targetSubId) return true;
  
  // 2. Find parent category object to get subcategory details
  const parentCat = categories.find(c => c.id.toLowerCase().trim() === selectedCategory.toLowerCase().trim());
  if (parentCat && parentCat.subcategories) {
    const subObj = parentCat.subcategories.find(s => s.id.toLowerCase().trim() === targetSubId);
    if (subObj) {
      const subNameLower = subObj.name?.toLowerCase().trim() || '';
      const subNameAr = subObj.nameAr?.trim() || '';
      
      if (prodSub === subNameLower) return true;
      if (prodSubAr === subNameAr) return true;
    }
  }
  
  return false;
}

