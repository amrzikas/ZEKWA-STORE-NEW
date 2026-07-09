import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, 
  SlidersHorizontal, 
  ChevronDown, 
  Star, 
  Check, 
  X, 
  RotateCcw, 
  ArrowUpDown, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Product, Category } from '../types';
import ProductCard from './ProductCard';
import { formatPrice } from '../utils';

interface AllCollectionProps {
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubcategory?: string;
  onSubcategoryChange?: (subcategory: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isArabic: boolean;
  categories: Category[];
  currency?: string;
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'reviews';

export default function AllCollection({
  products,
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onAddToCart,
  isArabic,
  categories,
  currency = 'SAR'
}: AllCollectionProps) {
  // Filters state
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [minRating, setMinRating] = useState<number>(0); // 0 means all
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Helper to count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Handle price presets
  const handlePricePreset = (max: number) => {
    setMaxPrice(max);
  };

  // Reset all filters
  const handleResetFilters = () => {
    onCategoryChange('all');
    if (onSubcategoryChange) onSubcategoryChange('');
    setMaxPrice(350);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('default');
    onSearchChange('');
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedCategory !== 'all' ||
      !!selectedSubcategory ||
      maxPrice < 350 ||
      minRating > 0 ||
      inStockOnly ||
      searchQuery.trim().length > 0
    );
  }, [selectedCategory, selectedSubcategory, maxPrice, minRating, inStockOnly, searchQuery]);

  // Process and filter products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(prod => 
        prod.name.toLowerCase().includes(query) ||
        prod.nameAr.includes(query) ||
        prod.description.toLowerCase().includes(query) ||
        prod.descriptionAr.includes(query) ||
        prod.categoryAr.includes(query)
      );
    }

    // 2. Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(prod => prod.category === selectedCategory);
    }

    // 2b. Subcategory Filter
    if (selectedCategory !== 'all' && selectedSubcategory) {
      result = result.filter(prod => prod.subcategory === selectedSubcategory);
    }

    // 3. Price Filter
    result = result.filter(prod => prod.price <= maxPrice);

    // 4. Rating Filter
    if (minRating > 0) {
      result = result.filter(prod => prod.rating >= minRating);
    }

    // 5. Stock Filter
    if (inStockOnly) {
      result = result.filter(prod => prod.stock > 0);
    }

    // 6. Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      case 'default':
      default:
        // Featured products first, then by rating
        result.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    return result;
  }, [products, selectedCategory, selectedSubcategory, searchQuery, maxPrice, minRating, inStockOnly, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="all-collection-section">
      {/* Title & Stats Bar */}
      <div 
        className="flex flex-col md:flex-row items-center justify-between border-b border-indigo-50/80 pb-6 mb-8 gap-4" 
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5 justify-center md:justify-start">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-800 font-sans">
              {isArabic ? 'صالة العرض المتكاملة' : 'ALL COLLECTION'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 text-center md:text-start font-medium">
            {isArabic 
              ? 'تصفح تشكيلتنا الفاخرة كاملة مع إمكانيات فرز وتصفية متقدمة تناسب ذوقك' 
              : 'Browse our entire luxury coordinates with bespoke advanced filtering and sorting'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Active indicator status */}
          <span className="text-xs font-mono font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            {filteredAndSortedProducts.length} {isArabic ? 'مقتنيات متطابقة' : 'matching items'}
          </span>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200 rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إعادة تعيين' : 'Reset Filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid & Filter Sidebar Container */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start" 
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        
        {/* ================= DESKTOP FILTER SIDEBAR ================= */}
        <aside className="hidden lg:flex flex-col gap-6 bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm sticky top-28">
          
          {/* Search indicator within the filter sidebar */}
          {searchQuery && (
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] text-slate-400 block">{isArabic ? 'البحث الحالي:' : 'Current Search:'}</span>
                <span className="text-xs font-bold text-indigo-600 truncate block">"{searchQuery}"</span>
              </div>
              <button 
                onClick={() => onSearchChange('')}
                className="p-1 hover:bg-indigo-100 rounded-full text-indigo-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section: Category Selection */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              {isArabic ? 'التصنيف' : 'Category'}
            </h3>
            <div className="space-y-1.5">
              {/* All Collection option */}
              <button
                onClick={() => {
                  onCategoryChange('all');
                  if (onSubcategoryChange) onSubcategoryChange('');
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/15'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                }`}
              >
                <span>{isArabic ? 'كل المجموعة' : 'All Collection'}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCategory === 'all' ? 'bg-indigo-700/50 text-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const count = products.filter(p => p.category === cat.id).length;
                return (
                  <div key={cat.id} className="space-y-1">
                    <button
                      onClick={() => {
                        onCategoryChange(cat.id);
                        if (onSubcategoryChange) onSubcategoryChange('');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                        isActive && !selectedSubcategory
                          ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/15'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                      }`}
                    >
                      <span>{isArabic ? cat.nameAr : cat.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive && !selectedSubcategory ? 'bg-indigo-700/50 text-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                        {count}
                      </span>
                    </button>

                    {/* Subcategories nested under active main category */}
                    {isActive && cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="pl-4 pr-1 py-1.5 space-y-1 bg-slate-50 rounded-xl border border-indigo-50/50 mt-1">
                        {cat.subcategories.map((sub) => {
                          const isSubActive = selectedSubcategory === sub.id;
                          const subCount = products.filter(p => p.category === cat.id && p.subcategory === sub.id).length;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => {
                                if (onSubcategoryChange) onSubcategoryChange(sub.id);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 cursor-pointer ${
                                isSubActive
                                  ? 'text-indigo-600 font-black'
                                  : 'text-slate-500 hover:text-indigo-500 hover:bg-white'
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <span>↳</span>
                                <span>{isArabic ? sub.nameAr : sub.name}</span>
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                ({subCount})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Price Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                {isArabic ? 'الحد الأقصى للسعر' : 'Max Price'}
              </h3>
              <span className="text-sm font-black text-indigo-600 font-mono">{formatPrice(maxPrice, currency, isArabic)}</span>
            </div>
            
            <input
              type="range"
              min="30"
              max="350"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-4"
            />

            {/* Price Presets */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePricePreset(50)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border text-center cursor-pointer transition-all ${
                  maxPrice === 50
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {isArabic ? `تحت ${formatPrice(50, currency, isArabic)}` : `Under ${formatPrice(50, currency, isArabic)}`}
              </button>
              <button
                onClick={() => handlePricePreset(100)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border text-center cursor-pointer transition-all ${
                  maxPrice === 100
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {isArabic ? `تحت ${formatPrice(100, currency, isArabic)}` : `Under ${formatPrice(100, currency, isArabic)}`}
              </button>
              <button
                onClick={() => handlePricePreset(200)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border text-center cursor-pointer transition-all ${
                  maxPrice === 200
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {isArabic ? `تحت ${formatPrice(200, currency, isArabic)}` : `Under ${formatPrice(200, currency, isArabic)}`}
              </button>
              <button
                onClick={() => handlePricePreset(350)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border text-center cursor-pointer transition-all ${
                  maxPrice === 350
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                {isArabic ? 'كل الأسعار' : 'All Prices'}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Customer Rating */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              {isArabic ? 'تقييم مجتمع زيوكا' : 'ZEWKA Rating'}
            </h3>
            <div className="space-y-2">
              {[0, 4.8, 4.6, 4.5].map((rating) => {
                const isActive = minRating === rating;
                return (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600 font-black border border-indigo-200' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    {rating === 0 ? (
                      <span>{isArabic ? 'جميع التقييمات' : 'All Ratings'}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-mono">{rating}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{isArabic ? 'فما فوق' : '& up'}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section: Availability */}
          <div>
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                inStockOnly
                  ? 'bg-indigo-50 text-indigo-600 font-black border-indigo-200'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                  inStockOnly ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {inStockOnly && <Check className="w-3 h-3 stroke-[3]" />}
                </span>
                <span>{isArabic ? 'المتوفر في المخزن فقط' : 'In Stock Only'}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
                {products.filter(p => p.stock > 0).length}
              </span>
            </button>
          </div>

        </aside>

        {/* ================= PRODUCTS VIEW & HEADER ================= */}
        <section className="lg:col-span-3 flex flex-col gap-6">

          {/* Controls Bar (Mobile Filters Button + Sort Select) */}
          <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-4">
            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              <span>{isArabic ? 'الفلاتر والتصفية' : 'Filters'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
              )}
            </button>

            {/* Sorting Dropdown container */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline flex-shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 inline-block mr-1" />
                {isArabic ? 'ترتيب حسب:' : 'Sort By:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="default">{isArabic ? 'الموصى به (الأكثر مبيعاً)' : 'Recommended (Bestsellers)'}</option>
                <option value="price-asc">{isArabic ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price-desc">{isArabic ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                <option value="rating">{isArabic ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
                <option value="reviews">{isArabic ? 'عدد المراجعات' : 'Most Reviewed'}</option>
              </select>
            </div>

            {/* Desktop Count indicator */}
            <span className="hidden sm:inline text-xs text-slate-400 font-bold">
              {filteredAndSortedProducts.length} {isArabic ? 'قطعة معروضة' : 'pieces shown'}
            </span>
          </div>

          {/* Active Filter Pills (Visible when filters are active) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-bold text-slate-400">{isArabic ? 'فلاتر نشطة:' : 'Active Filters:'}</span>
              
              {/* Category Pill */}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                  <span>{isArabic ? categories.find(c => c.id === selectedCategory)?.nameAr : categories.find(c => c.id === selectedCategory)?.name}</span>
                  <button onClick={() => onCategoryChange('all')} className="hover:bg-indigo-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Price Pill */}
              {maxPrice < 350 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                  <span>{isArabic ? `حتى ${formatPrice(maxPrice, currency, isArabic)}` : `Max ${formatPrice(maxPrice, currency, isArabic)}`}</span>
                  <button onClick={() => setMaxPrice(350)} className="hover:bg-indigo-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Rating Pill */}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                  <span className="flex items-center gap-0.5">★ {minRating} {isArabic ? 'وأعلى' : '& up'}</span>
                  <button onClick={() => setMinRating(0)} className="hover:bg-indigo-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Stock Pill */}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                  <span>{isArabic ? 'المتوفر فقط' : 'In Stock Only'}</span>
                  <button onClick={() => setInStockOnly(false)} className="hover:bg-indigo-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              )}

              {/* Search Pill */}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100">
                  <span className="truncate max-w-[120px]">"{searchQuery}"</span>
                  <button onClick={() => onSearchChange('')} className="hover:bg-indigo-100 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Products Grid */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">
                  {isArabic ? 'لا توجد قطع تطابق اختياراتك' : 'No pieces match your filters'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {isArabic 
                    ? 'جرب تقليل الفلاتر المحددة أو تصفح كامل مجموعتنا لتجد ما تبحث عنه' 
                    : 'Try loosening your filter metrics or reset search query to see other pieces'}
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
              >
                {isArabic ? 'عرض كافة المجموعة' : 'Show All Collection'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map(prod => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  isArabic={isArabic}
                  currency={currency}
                />
              ))}
            </div>
          )}

        </section>
      </div>

      {/* ================= MOBILE FILTERS DRAWER ================= */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-default"
            />

            {/* Slide up Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-[2.5rem] z-50 overflow-y-auto shadow-2xl p-6 pb-12 flex flex-col"
              style={{ direction: isArabic ? 'rtl' : 'ltr' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-800 uppercase">
                    {isArabic ? 'الفلاتر والخيارات' : 'Filters & Options'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Panels */}
              <div className="space-y-6 overflow-y-auto flex-1 pr-1 pl-1">
                {/* 1. Category */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                    {isArabic ? 'تصنيف القطع' : 'Category Collection'}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => {
                        onCategoryChange('all');
                        if (onSubcategoryChange) onSubcategoryChange('');
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/15'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isArabic ? 'كل المجموعة' : 'All Collection'}
                    </button>
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            onCategoryChange(cat.id);
                            if (onSubcategoryChange) onSubcategoryChange('');
                          }}
                          className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isActive && !selectedSubcategory
                              ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/15'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isArabic ? cat.nameAr : cat.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Subcategories in mobile drawer if category is active */}
                  {selectedCategory !== 'all' && (
                    (() => {
                      const activeCat = categories.find(c => c.id === selectedCategory);
                      if (activeCat && activeCat.subcategories && activeCat.subcategories.length > 0) {
                        return (
                          <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 border border-indigo-50/50">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                              {isArabic ? 'الفئات الفرعية' : 'Subcategories'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {activeCat.subcategories.map((sub) => {
                                const isSubActive = selectedSubcategory === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      if (onSubcategoryChange) onSubcategoryChange(sub.id);
                                    }}
                                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                      isSubActive
                                        ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/15'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {isArabic ? sub.nameAr : sub.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* 2. Price Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {isArabic ? 'السعر الأقصى' : 'Max Price'}
                    </h3>
                    <span className="text-xs font-black text-indigo-600 font-mono">${maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="350"
                    step="5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 mb-3"
                  />
                  <div className="grid grid-cols-4 gap-1.5">
                    {[50, 100, 200, 350].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setMaxPrice(preset)}
                        className={`py-1 text-[10px] font-black rounded-lg text-center cursor-pointer border ${
                          maxPrice === preset
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 text-slate-500'
                        }`}
                      >
                        {preset === 350 ? (isArabic ? 'الكل' : 'All') : `$${preset}`}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* 3. Ratings */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                    {isArabic ? 'تقييم مجتمع زيوكا' : 'ZEWKA Rating'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 4.8, 4.6, 4.5].map((rating) => {
                      const isActive = minRating === rating;
                      return (
                        <button
                          key={rating}
                          onClick={() => setMinRating(rating)}
                          className={`py-2 px-3 border rounded-xl text-xs font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {rating === 0 ? (
                            <span>{isArabic ? 'جميع التقييمات' : 'All Ratings'}</span>
                          ) : (
                            <>
                              <span className="font-mono">{rating}</span>
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>{isArabic ? 'وأعلى' : '& up'}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* 4. Stock Availability */}
                <div>
                  <button
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      inStockOnly
                        ? 'bg-indigo-50 text-indigo-600 font-black border-indigo-200'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        inStockOnly ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                      }`}>
                        {inStockOnly && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{isArabic ? 'المتوفر في المخزن فقط' : 'In Stock Only'}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
                      {products.filter(p => p.stock > 0).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex gap-3 pt-5 mt-4 border-t border-slate-100">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl cursor-pointer transition-colors"
                >
                  {isArabic ? 'إعادة تعيين' : 'Reset All'}
                </button>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer transition-colors"
                >
                  {isArabic ? 'تطبيق الفلاتر' : 'Apply Filters'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
