import React from 'react';
import { Star, Eye, ShoppingCart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isArabic: boolean;
  isCompact?: boolean;
}

export default function ProductCard({ product, onSelect, onAddToCart, isArabic, isCompact = false }: ProductCardProps) {
  const isLowStock = product.stock <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className={`group relative flex flex-col bg-white border-2 border-slate-100 hover:border-indigo-500 overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 ${
        isCompact ? 'rounded-2xl max-w-sm' : 'rounded-[2rem]'
      }`}
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className={`relative overflow-hidden bg-[#F5F5F3] cursor-pointer ${
        isCompact ? 'aspect-square' : 'aspect-[3/4]'
      }`} onClick={() => onSelect(product)}>
        <img
          src={product.image}
          alt={isArabic ? product.nameAr : product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Low Stock Indicator */}
        {isLowStock && (
          <div className={`absolute top-2.5 ${isArabic ? 'right-2.5' : 'left-2.5'} bg-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-md z-10`}>
            {isArabic ? `متبقي ${product.stock}` : `${product.stock} left`}
          </div>
        )}

        {/* Featured Tag */}
        {product.isFeatured && (
          <div className={`absolute top-2.5 ${isArabic ? 'left-2.5' : 'right-2.5'} bg-yellow-400 text-indigo-950 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-1 z-10 shadow-md`}>
            <Sparkles className="w-2.5 h-2.5 text-indigo-950 fill-indigo-950" />
            <span>{isArabic ? 'مميز' : 'POPULAR'}</span>
          </div>
        )}

        {/* Action Overlay Hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="p-2.5 bg-white text-[#1D1D1C] hover:bg-[#1D1D1C] hover:text-white rounded-full shadow-lg transition-all duration-300 transform scale-90 group-hover:scale-100 cursor-pointer"
            title={isArabic ? 'عرض التفاصيل' : 'View Details'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Block */}
      <div className={`${isCompact ? 'p-3.5' : 'p-5'} flex flex-col flex-1`} style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        <span className="text-[9px] font-mono text-[#8E8D8A] uppercase tracking-wider mb-0.5">
          {isArabic ? product.categoryAr : product.category.toUpperCase()}
        </span>

        <h3 
          onClick={() => onSelect(product)}
          className={`font-bold text-slate-800 hover:text-indigo-600 cursor-pointer line-clamp-1 mb-1 transition-colors ${
            isCompact ? 'text-xs' : 'text-base'
          }`}
        >
          {isArabic ? product.nameAr : product.name}
        </h3>

        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-2.5">
          <div className="flex items-center text-[#F59E0B]">
            <Star className="w-2.5 h-2.5 fill-current" />
          </div>
          <span className="text-[10px] font-bold text-[#1D1D1C]">{product.rating}</span>
          <span className="text-[9px] text-[#8E8D8A]">({product.reviewsCount})</span>
        </div>

        {/* Price & Add to Cart row */}
        <div className={`flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100`}>
          <div>
            <span className="text-[9px] text-slate-400 block -mb-0.5">{isArabic ? 'السعر' : 'Price'}</span>
            <span className={`${isCompact ? 'text-base' : 'text-xl'} font-black text-indigo-600`}>${product.price}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={product.stock === 0}
            className={`transition-all duration-300 flex items-center gap-1 cursor-pointer ${
              isCompact ? 'px-2.5 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'
            } font-black rounded-lg ${
              product.stock === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-md shadow-indigo-600/10'
            }`}
          >
            <ShoppingCart className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
            <span>{product.stock === 0 ? (isArabic ? 'نفذ' : 'Out') : (isArabic ? 'أضف' : 'Add')}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
