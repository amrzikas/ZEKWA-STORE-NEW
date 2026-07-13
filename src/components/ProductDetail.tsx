import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingBag, ShieldCheck, Truck, RefreshCw, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, Review } from '../types';
import { formatPrice, isProductOnOffer } from '../utils';
import ProductCard from './ProductCard';

interface ProductDetailProps {
  product: Product;
  reviews: Review[];
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  isArabic: boolean;
  onAddReview: (comment: string, rating: number, userName: string) => Promise<void>;
  currency?: string;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export default function ProductDetail({
  product,
  reviews,
  onBack,
  onAddToCart,
  isArabic,
  onAddReview,
  currency = 'SAR',
  allProducts = [],
  onSelectProduct
}: ProductDetailProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewName, setNewReviewName] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedImage(product.image);
  }, [product]);

  const productReviews = reviews.filter(r => r.id.startsWith(`rev-${product.id}`) || r.id === product.id || (reviews.indexOf(r) > 2 && r.comment.includes(product.nameAr) || r.comment.includes(product.name)));

  // Fallback if no specific reviews found
  const displayedReviews = productReviews.length > 0 ? productReviews : reviews.slice(0, 2);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !newReviewName.trim()) return;

    setIsSubmittingReview(true);
    setReviewSuccessMessage('');
    try {
      await onAddReview(newReviewComment, newReviewRating, newReviewName);
      setNewReviewComment('');
      setNewReviewName('');
      setNewReviewRating(5);
      setReviewSuccessMessage(isArabic ? 'شكراً لك! تم تحليل مراجعتك تلقائياً بواسطة الذكاء الاصطناعي وإضافة الرد.' : 'Thank you! Your review was automatically analyzed by AI and a response was added.');
      setTimeout(() => setReviewSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="bg-[#FBFBFA] min-h-screen py-10" id="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 mb-8 group cursor-pointer"
        >
          <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isArabic ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
          <span>{isArabic ? 'العودة للمتجر' : 'Back to Store'}</span>
        </button>

        {/* Product Brief Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Product Image Panel - Left Side */}
          <div className="lg:col-span-6 flex flex-row gap-4">
            {/* Thumbnails - Vertical on the LEFT side */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-col gap-2.5 w-16 shrink-0">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      (selectedImage === imgUrl || (!selectedImage && idx === 0))
                        ? 'border-indigo-600 scale-105 shadow-md'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      alt={`Product ${idx + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative aspect-[4/5] rounded-[2rem] overflow-hidden border-2 border-slate-100 bg-white shadow-xl">
              <img
                src={selectedImage || product.image}
                alt={isArabic ? product.nameAr : product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-4 transition-all duration-300"
              />
            </div>
          </div>

          {/* Product Info - Right Side */}
          <div className="lg:col-span-6 space-y-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <span className="text-xs font-bold font-mono tracking-widest text-[#C5A880] uppercase block">
              {isArabic ? product.categoryAr : product.category.toUpperCase()}
            </span>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1C] tracking-tight">
                {isArabic ? product.nameAr : product.name}
              </h1>
              {/* Stars rating */}
              <div className="flex items-center gap-1.5 pt-1">
                <div className="flex items-center text-[#F59E0B]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? 'fill-current' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-800">{product.rating}</span>
                <span className="text-xs text-slate-400 font-bold">({product.reviewsCount} {isArabic ? 'مراجعة موثقة' : 'Verified Reviews'})</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-6 bg-slate-50 border border-[#EAEAE8] rounded-3xl flex justify-between items-center max-w-md">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">{isArabic ? 'القيمة الاستثمارية' : 'Boutique Pricing'}</span>
                {isProductOnOffer(product) && product.discountPrice ? (
                  <div className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                      {formatPrice(product.discountPrice, currency, isArabic)}
                    </span>
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {formatPrice(product.price, currency, isArabic)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-indigo-600 font-mono">
                    {formatPrice(product.price, currency, isArabic)}
                  </span>
                )}
              </div>
              <div className="text-left font-sans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.stock > 0 ? (isArabic ? 'متوفر للتسليم السريع' : 'In Premium Stock') : (isArabic ? 'نفذت الكمية' : 'Out of Stock')}
                </span>
                {product.stock > 0 && product.stock <= 5 && (
                  <p className="text-[10px] font-bold text-pink-500 mt-1.5">{isArabic ? `متبقي قطع قليلة جداً (${product.stock})` : `Extremely Limited (${product.stock} left)`}</p>
                )}
              </div>
            </div>

            {/* Description Paragraph */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#1D1D1C] uppercase tracking-wider">
                {isArabic ? 'مواصفات القطعة وتفاصيلها' : 'Artisanal Description'}
              </h3>
              <p className="text-xs text-[#6C6B67] leading-relaxed max-w-xl font-medium">
                {isArabic ? product.descriptionAr : product.description}
              </p>
            </div>

            {/* Specifications Lists */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="space-y-2 max-w-md">
                <h3 className="text-xs font-bold text-[#1D1D1C] uppercase tracking-wider">
                  {isArabic ? 'المواصفات الفنية للقطعة' : 'Boutique Spec Sheet'}
                </h3>
                <div className="border border-[#EAEAE8] rounded-2xl overflow-hidden divide-y divide-[#EAEAE8] text-xs">
                  {Object.entries(product.specs).map(([key, val], sIdx) => {
                    const arabicKey = product.specsAr ? Object.keys(product.specsAr)[sIdx] || key : key;
                    const arabicVal = product.specsAr ? Object.values(product.specsAr)[sIdx] || val : val;
                    return (
                      <div key={sIdx} className="grid grid-cols-3 p-3 bg-white">
                        <span className="font-bold text-[#1D1D1C]">{isArabic ? arabicKey : key}</span>
                        <span className="col-span-2 text-slate-600 font-medium">{isArabic ? arabicVal : val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4 max-w-md">
              <button
                onClick={() => onAddToCart(product)}
                disabled={product.stock === 0}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-600/10 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.stock === 0 ? (isArabic ? 'غير متوفر مؤقتاً' : 'Temporarily Out') : (isArabic ? 'إضافة لحقيبة المشتريات' : 'Secure In Shopping Bag')}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#EAEAE8] text-center text-[#8E8D8A] font-sans">
              <div className="space-y-1">
                <ShieldCheck className="w-5 h-5 text-[#C5A880] mx-auto" />
                <span className="text-[9px] font-bold block uppercase tracking-wider text-[#1D1D1C]">{isArabic ? 'ضمان ممتد' : 'Boutique Certified'}</span>
                <span className="text-[8px] block">{isArabic ? 'أصلي 100% ومفحوص' : '100% Original authenticity'}</span>
              </div>
              <div className="space-y-1">
                <Truck className="w-5 h-5 text-[#C5A880] mx-auto" />
                <span className="text-[9px] font-bold block uppercase tracking-wider text-[#1D1D1C]">{isArabic ? 'شحن مدرع' : 'Armored Carriage'}</span>
                <span className="text-[8px] block">{isArabic ? 'توصيل مأمن وسريع' : 'Insured door-step carriage'}</span>
              </div>
              <div className="space-y-1">
                <RefreshCw className="w-5 h-5 text-[#C5A880] mx-auto" />
                <span className="text-[9px] font-bold block uppercase tracking-wider text-[#1D1D1C]">{isArabic ? 'تبديل فوري' : 'Secure Returns'}</span>
                <span className="text-[8px] block">{isArabic ? 'خلال 14 يوم مجاناً' : 'Elite exchange window'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Reviews Tabs Area */}
        <div className="border-t border-[#EAEAE8] pt-10">
          <div className="flex gap-6 border-b border-[#EAEAE8] mb-8 text-xs font-mono font-bold tracking-wider uppercase">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'details' ? 'border-[#1D1D1C] text-[#1D1D1C]' : 'border-transparent text-[#8E8D8A]'
              }`}
            >
              {isArabic ? 'المواصفات والضمان' : 'Boutique Details'}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'reviews' ? 'border-[#1D1D1C] text-[#1D1D1C]' : 'border-transparent text-[#8E8D8A]'
              }`}
            >
              {isArabic ? `آراء النخبة والعملاء (${displayedReviews.length})` : `Elite Customer Reviews (${displayedReviews.length})`}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'details' && (
              <motion.div
                key="tab-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                <div className="space-y-4">
                  <h4 className="font-extrabold text-[#1D1D1C] uppercase tracking-wider">{isArabic ? 'ضمان الأصالة والمصدر' : 'LIFETIME ORIGINALITY GUARANTEE'}</h4>
                  <p className="text-[#6C6B67] leading-relaxed max-w-md font-medium">
                    {isArabic
                      ? 'جميع القطع المعروضة في بوتيك زيوكا الفاخر أصلية ومستوردة من دور التصميم العالمية مباشرة في ميلان، باريس ولندن. تخضع كل قطعة لثلاث مراحل فحص دقيقة قبل إدراجها، وتأتي مصحوبة بشهادة المنشأ ورقم تسلسلي خاص بالبوتيك مسجل للعميل.'
                      : 'Every single artifact presented by ZEWKA Select is directly sourced from premier luxury design houses across Milan, Paris, and London. We certify full legal authenticity with structured original brand certificates and strict serial tags assigned to your portfolio.'}
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-extrabold text-[#1D1D1C] uppercase tracking-wider">{isArabic ? 'تفاصيل التغليف المميز والشحن' : 'INSURED PACKAGING & DELIVERY'}</h4>
                  <p className="text-[#6C6B67] leading-relaxed max-w-md font-medium">
                    {isArabic
                      ? 'يتم تغليف القطع يدوياً في طرود بوتيك زيوكا المدرعة مع بطاقة إهداء مخصصة للعميل، لضمان وصولها بحالتها المثالية. نستخدم خطوط نقل خاصة مأمنة ومبردة بالكامل لحماية الجلود والمنسوجات الحساسة حتى وصولها لباب منزلك.'
                      : 'We wrap all assets manually inside heavy duty customized ZEWKA wooden-reinforced secure packaging with custom hand-written elite client cards. Delivered exclusively via climate-controlled custom transport lines protecting sensitive fabric assets.'}
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="tab-reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Submit review */}
                <div className="p-6 sm:p-8 bg-slate-50 border border-[#EAEAE8] rounded-3xl space-y-4" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                      {isArabic ? 'شاركنا انطباعك وتقييمك الفاخر' : 'Share Your Boutique Impressions'}
                    </h3>
                    <p className="text-[11px] text-[#8E8D8A] mt-0.5">
                      {isArabic ? 'يقوم نظام الذكاء الاصطناعي بتحليل لغتك واستخراج التقييم والرد فورياً.' : 'Our AI system analyzes your comments to extract traits and reply in real-time.'}
                    </p>
                  </div>

                  {reviewSuccessMessage && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-2xl">
                      {reviewSuccessMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-800 uppercase block mb-1">
                          {isArabic ? 'الاسم الكريم' : 'Your Noble Name'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          placeholder={isArabic ? 'الشيخ عبد الرحمن بن فهد' : 'Duke Christopher'}
                          className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-full text-xs text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-slate-800 uppercase block mb-1">
                          {isArabic ? 'التقييم' : 'Noble Rating'}
                        </label>
                        <div className="flex items-center gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewRating(star)}
                              className="text-[#F59E0B] focus:outline-none cursor-pointer"
                            >
                              <Star className={`w-6 h-6 ${star <= newReviewRating ? 'fill-current' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-800 uppercase block mb-1">
                        {isArabic ? 'تعليقك وتقييمك الصادق' : 'Your Authentic Feedback'}
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        placeholder={isArabic ? 'اكتب انطباعك عن ملمس القطعة، تغليفها، ومستوى الخدمة الفاخرة...' : 'Describe your feelings on material, luxurious packaging, and delivery comfort...'}
                        className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-2xl text-xs text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !newReviewComment.trim() || !newReviewName.trim()}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer"
                      >
                        {isSubmittingReview ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{isArabic ? 'جارِ التحليل...' : 'Analyzing...'}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'إرسال التقييم الذكي' : 'Submit Smart Review'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {displayedReviews.map((rev) => (
                    <div key={rev.id} className="p-6 bg-white border-2 border-indigo-50 rounded-[2rem] space-y-4 shadow-md">
                      {/* Name & stars */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{rev.userName}</h4>
                          <span className="text-[10px] font-bold text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex items-center text-[#F59E0B]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {rev.comment}
                      </p>

                      {/* AI Extracted Tags */}
                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rev.tags.map((tg, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-400/20 border border-yellow-400/50 text-[10px] font-black text-indigo-900 rounded-full">
                              <Sparkles className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                              <span>{tg}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Merchant/Boutique Response */}
                      {rev.merchantResponse && (
                        <div className="mt-4 p-4 bg-indigo-50/50 border-r-4 border-indigo-600 rounded-xl text-xs space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                            {isArabic ? 'رد إدارة بوتيك زيوكا (مستند للذكاء الاصطناعي):' : 'ZEWKA Boutique Management Response:'}
                          </span>
                          <p className="text-slate-600 italic leading-relaxed font-medium">
                            {rev.merchantResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Products You Might Like Section */}
        {allProducts && allProducts.length > 0 && (
          (() => {
            const relatedProducts = allProducts
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 4);

            const finalRelated = relatedProducts.length > 0 
              ? relatedProducts 
              : allProducts.filter(p => p.id !== product.id).slice(0, 4);

            if (finalRelated.length === 0) return null;

            return (
              <div className="border-t border-[#EAEAE8] mt-16 pt-12" id="related-products-section">
                <div className="text-center mb-8">
                  <span className="text-xs font-bold font-mono tracking-widest text-[#C5A880] uppercase block mb-1">
                    {isArabic ? 'اختيارات مميزة لك' : 'CURATED FOR YOU'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                    {isArabic ? 'منتجات قد تعجبك' : 'Products You Might Like'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {finalRelated.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={onSelectProduct}
                      onAddToCart={onAddToCart}
                      isArabic={isArabic}
                      isCompact={true}
                      currency={currency}
                    />
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}