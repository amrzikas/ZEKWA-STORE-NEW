import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingBag, ShieldCheck, Truck, RefreshCw, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Review } from '../types';

interface ProductDetailProps {
  product: Product;
  reviews: Review[];
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  isArabic: boolean;
  onAddReview: (comment: string, rating: number, userName: string) => Promise<void>;
}

export default function ProductDetail({
  product,
  reviews,
  onBack,
  onAddToCart,
  isArabic,
  onAddReview
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Product Image Panel */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border-2 border-slate-100 bg-white shadow-xl">
              <img
                src={selectedImage || product.image}
                alt={isArabic ? product.nameAr : product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-all duration-300"
              />
            </div>
            {/* Gallery thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-wrap gap-2.5 py-1">
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
                    <img src={imgUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Purchasing Control Panel */}
          <div className="lg:col-span-6 flex flex-col" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest mb-2 block">
              {isArabic ? product.categoryAr : product.category.toUpperCase()}
            </span>
            <h1 className="text-3xl font-black text-slate-800 mb-3">
              {isArabic ? product.nameAr : product.name}
            </h1>

            {/* Ratings Row */}
            <div className="flex items-center gap-2 mb-6 border-b border-indigo-50 pb-4">
              <div className="flex items-center text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-extrabold text-slate-800">{product.rating}</span>
              <span className="text-xs text-slate-500">
                ({product.reviewsCount} {isArabic ? 'تقييم من عملائنا' : 'customer reviews'})
              </span>
            </div>

            {/* Price Tag */}
            <div className="mb-6">
              <span className="text-3xl font-black text-indigo-600">${product.price}</span>
              <span className="text-xs font-bold text-slate-400 ml-2 block sm:inline">
                {isArabic ? 'شامل ضريبة القيمة المضافة' : 'VAT inclusive'}
              </span>
            </div>

            {/* Product Brief Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-8 font-medium">
              {isArabic ? product.descriptionAr : product.description}
            </p>

            {/* Add To Cart Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-8">
              <button
                onClick={() => onAddToCart(product)}
                disabled={product.stock === 0}
                className={`w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg ${
                  product.stock === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-600/20'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {product.stock === 0
                    ? (isArabic ? 'نفذت الكمية' : 'Out of Stock')
                    : (isArabic ? 'إضافة إلى حقيبة التسوق' : 'Add to Shopping Bag')}
                </span>
              </button>
            </div>

            {/* High-end Badges Row */}
            <div className="grid grid-cols-3 gap-4 border-t border-indigo-50 pt-6 text-center text-slate-500">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-indigo-600 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                  {isArabic ? 'أصلي 100%' : '100% Authentic'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {isArabic ? 'جودة مضمونة' : 'Guaranteed quality'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <Truck className="w-5 h-5 text-indigo-600 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                  {isArabic ? 'شحن مميز' : 'Premium Delivery'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {isArabic ? 'سريع وآمن' : 'Fast and tracked'}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-indigo-600 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                  {isArabic ? 'إرجاع سهل' : 'Easy Return'}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {isArabic ? 'خلال 14 يوماً' : 'Within 14 days'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Panel */}
        <div className="border-b border-indigo-50 mb-8 flex justify-center gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 text-sm font-black tracking-wider uppercase cursor-pointer transition-all border-b-2 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-400 hover:text-indigo-600'
            }`}
          >
            {isArabic ? 'مواصفات القطعة' : 'Product Specs'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-black tracking-wider uppercase cursor-pointer transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-400 hover:text-indigo-600'
            }`}
          >
            <span>{isArabic ? 'تقييمات مجتمع زيوكا' : 'ZEWKA Community Reviews'}</span>
            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
              {displayedReviews.length}
            </span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto mb-20" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'details' ? (
              <motion.div
                key="details-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Features List */}
                <div>
                  <h3 className="text-base font-black text-slate-800 mb-4">
                    {isArabic ? 'المميزات الرئيسية:' : 'Key Features:'}
                  </h3>
                  <ul className="space-y-3">
                    {(isArabic ? product.featuresAr : product.features).map((feat, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technical specs grid */}
                <div className="border-t border-indigo-50 pt-8">
                  <h3 className="text-base font-black text-slate-800 mb-4">
                    {isArabic ? 'المواصفات الفنية:' : 'Technical Specifications:'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(isArabic ? product.specsAr : product.specs).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-2.5 border-b border-indigo-50/50 text-sm">
                        <span className="text-slate-400 font-bold">{key}</span>
                        <span className="font-black text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reviews-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                {/* Write a review form */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-indigo-50 shadow-xl">
                  <h3 className="text-base font-black text-slate-800 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-spin fill-yellow-500" />
                    <span>{isArabic ? 'اكتب تقييمك ودع ذكاء زيوكا يحلله تلقائياً' : 'Write a review & ZEWKA AI will analyze it'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mb-5">
                    {isArabic 
                      ? 'بمجرد كتابة تعليقك، سيقوم الذكاء الاصطناعي باستخراج الكلمات المفتاحية وصياغة رد فوري يناسب فخامتك.' 
                      : 'Our Gemini AI will auto-extract positive tags and compose a beautiful boutique response instantly.'}
                  </p>

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black text-slate-800 uppercase block mb-1">
                          {isArabic ? 'اسمك الكريم' : 'Your Noble Name'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          placeholder={isArabic ? 'مثال: أحمد العتيبي' : 'e.g. Eleanor Vance'}
                          className="w-full px-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
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
      </div>
    </div>
  );
}