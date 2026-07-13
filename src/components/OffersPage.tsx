import React, { useState, useMemo } from 'react';
import { Sparkles, ArrowLeft, Search, SlidersHorizontal, Tag, Percent, Calendar, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { isProductOnOffer } from '../utils';

interface OffersPageProps {
  products: Product[];
  categories: any[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isArabic: boolean;
  currency?: string;
  onBackToHome: () => void;
}

export default function OffersPage({
  products,
  categories,
  onSelectProduct,
  onAddToCart,
  isArabic,
  currency = 'SAR',
  onBackToHome
}: OffersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'discount' | 'price-asc' | 'price-desc'>('discount');

  // Filter only products that have isOnOffer and discountPrice
  const offersProducts = useMemo(() => {
    return products.filter(p => isProductOnOffer(p));
  }, [products]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let result = [...offersProducts];

    // Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Search Query Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.nameAr.includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.descriptionAr && p.descriptionAr.includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'discount') {
        const discountA = ((a.price - (a.discountPrice || 0)) / a.price);
        const discountB = ((b.price - (b.discountPrice || 0)) / b.price);
        return discountB - discountA; // high discount first
      } else if (sortBy === 'price-asc') {
        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
      } else if (sortBy === 'price-desc') {
        return (b.discountPrice || b.price) - (a.discountPrice || a.price);
      }
      return 0;
    });

    return result;
  }, [offersProducts, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#FBFBFA] pb-24" id="offers-page-root">
      {/* Summer 2026 Promo Banner Hero */}
      <div className="relative h-[40vh] sm:h-[45vh] bg-slate-900 overflow-hidden flex items-center justify-center">
        {/* Decorative background image with low opacity */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop"
            alt="Summer Background"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFA] via-black/40 to-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl space-y-4" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/90 text-white text-[10px] font-black tracking-widest shadow-lg uppercase"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>{isArabic ? 'عروض صيف 2026 الحصرية' : 'EXCLUSIVE SUMMER 2026 OFFERS'}</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none"
          >
            {isArabic ? 'بوابة العروض والتخفيضات' : 'The Luxury Sale Portal'}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-200 font-bold max-w-xl mx-auto"
          >
            {isArabic 
              ? 'تذوق المعنى الحقيقي للأناقة الفاخرة بأسعار استثنائية. خصومات حصرية لفترة محدودة على تشكيلة الصيف المنسقة.' 
              : 'Taste the meaning of absolute elegance at exceptional rates. Limited-time curated savings on selected items.'}
          </motion.p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Navigation & Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-6 border-b border-slate-200/60" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black rounded-full transition shadow-sm cursor-pointer"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
            <span>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </button>

          {/* Search and Filters group */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Search Input */}
            <div className="relative min-w-[200px] w-full sm:w-auto">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder={isArabic ? 'ابحث في العروض...' : 'Search offers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-400 transition shadow-sm"
              />
            </div>

            {/* Sorting Select */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-2 shadow-sm text-xs font-bold text-slate-600">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer p-0 text-xs font-bold text-slate-700"
              >
                <option value="discount">{isArabic ? 'الأعلى خصماً أولاً' : 'Highest Discount'}</option>
                <option value="price-asc">{isArabic ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price-desc">{isArabic ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs Row */}
        <div className="flex overflow-x-auto gap-2 py-4 scrollbar-none justify-start" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/10'
                : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
            }`}
          >
            {isArabic ? 'جميع عروض الصيف' : 'All Summer Deals'}
          </button>
          {categories.map((cat) => {
            // Count products on offer under this category
            const count = offersProducts.filter(p => p.category === cat.id).length;
            if (count === 0) return null;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
                }`}
              >
                <span>{isArabic ? cat.nameAr : cat.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Offers Grid */}
        <div className="mt-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200/60 rounded-[2rem] p-8 max-w-xl mx-auto mt-8">
              <Tag className="w-12 h-12 text-rose-300 mx-auto mb-4 animate-bounce" />
              <h3 className="text-sm font-black text-slate-800">
                {isArabic ? 'لم نعثر على عروض مطابقة' : 'No matching offers found'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 font-bold">
                {isArabic 
                  ? 'يرجى مراجعة خيارات الفرز والتصفية أو إعادة البحث بكلمات أخرى.' 
                  : 'Please check your category filters or try searching for another product name.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  isArabic={isArabic}
                  currency={currency}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
