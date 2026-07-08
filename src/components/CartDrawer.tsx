import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Ticket, Gift, Sparkles, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { COUPONS } from '../data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (discountRate: number, couponCode: string) => void;
  isArabic: boolean;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isArabic
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [couponError, setCouponError] = useState('');
  
  // Gift Wheel Game state
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonCoupon, setWonCoupon] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 150;
  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 25;
  const discountAmount = subtotal * discountRate;
  const total = subtotal - discountAmount + shippingCost;

  const handleApplyCoupon = (code: string) => {
    const formattedCode = code.trim().toUpperCase();
    if (COUPONS[formattedCode]) {
      setAppliedCoupon(formattedCode);
      setDiscountRate(COUPONS[formattedCode]);
      setCouponError('');
      setCouponCode('');
    } else {
      setCouponError(isArabic ? 'رمز الكوبون غير صالح' : 'Invalid coupon code');
    }
  };

  const handleSpinWheel = () => {
    if (hasSpun || isSpinning) return;
    setIsSpinning(true);
    
    // Simulate high-end spin animation duration
    setTimeout(() => {
      // Elegant coupons to win
      const options = ['WELCOME30', 'VIP40', 'ZEWKA20'];
      const won = options[Math.floor(Math.random() * options.length)];
      setWonCoupon(won);
      setIsSpinning(false);
      setHasSpun(true);
      
      // Auto apply won coupon
      setAppliedCoupon(won);
      setDiscountRate(COUPONS[won]);
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer container */}
          <div className={`absolute inset-y-0 ${isArabic ? 'left-0' : 'right-0'} max-w-full flex`}>
            <motion.div
              initial={{ x: isArabic ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#FBFBFA] shadow-2xl flex flex-col border-l border-[#EAEAE8]"
              style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              id="cart-drawer-container"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#EAEAE8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C5A880]" />
                  <h2 className="text-base font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                    {isArabic ? 'حقيبة التسوق' : 'Shopping Bag'}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 bg-[#F5F5F3] text-[#1D1D1C] font-mono rounded-full font-bold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-[#8E8D8A] hover:text-[#1D1D1C] hover:bg-[#F5F5F3] rounded-full transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Cart Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                {/* Free Shipping Progress Indicator */}
                {subtotal > 0 && (
                  <div className="p-4 bg-white border border-[#EAEAE8] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1D1D1C]">
                        {subtotal >= freeShippingThreshold
                          ? (isArabic ? 'لقد حصلت على شحن مجاني مميز!' : 'You unlocked Free Premium Shipping!')
                          : (isArabic ? 'الشحن المجاني المخصص' : 'Premium Free Shipping')}
                      </span>
                      <span className="font-mono text-[#8E8D8A]">
                        {subtotal >= freeShippingThreshold ? '$0' : `$${freeShippingThreshold - subtotal} left`}
                      </span>
                    </div>
                    <div className="w-full bg-[#F5F5F3] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C5A880] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                      />
                    </div>
                    {subtotal < freeShippingThreshold && (
                      <p className="text-[10px] text-[#8E8D8A] leading-relaxed">
                        {isArabic
                          ? `أضف بقيمة $${freeShippingThreshold - subtotal} أخرى لتجنب دفع $25 قيمة شحن.`
                          : `Spend $${freeShippingThreshold - subtotal} more to save $25 on luxury carriage.`}
                      </p>
                    )}
                  </div>
                )}

                {/* Gift Spinning Promo Wheel */}
                {subtotal > 0 && (
                  <div className="p-5 bg-[#C5A880]/10 border border-[#C5A880]/20 rounded-2xl text-center space-y-4">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#A88C5E]">
                      <Gift className="w-4 h-4 text-[#C5A880]" />
                      <span>{isArabic ? 'عجلة الحظ لبوتيك زيوكا الفاخر' : 'ZEWKA Exclusive Promo Wheel'}</span>
                    </div>

                    {!hasSpun ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-[#6C6B67] leading-relaxed">
                          {isArabic
                            ? 'أدر العجلة الآن للفوز بخصم فوري يصل إلى 40٪ على مشترياتك!'
                            : 'Spin the premium wheel to win an instant discount code up to 40% off!'}
                        </p>
                        <button
                          onClick={handleSpinWheel}
                          disabled={isSpinning}
                          className="w-full py-2.5 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-[11px] font-mono font-bold tracking-widest rounded-full uppercase transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isSpinning ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{isArabic ? 'جارِ الدوران الفاخر...' : 'Luxury Spinning...'}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                              <span>{isArabic ? 'أدر العجلة واربح' : 'Spin the Wheel'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/60 border border-[#C5A880]/30 rounded-xl space-y-1.5 animate-bounce">
                        <span className="text-[9px] font-mono tracking-widest text-[#8E8D8A] block uppercase">
                          {isArabic ? 'تهانينا الحارة من زيوكا!' : 'Congratulations! You Won:'}
                        </span>
                        <div className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#D97706] font-mono">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>{wonCoupon} ({(COUPONS[wonCoupon] * 100)}% OFF)</span>
                        </div>
                        <p className="text-[10px] text-[#6C6B67]">
                          {isArabic
                            ? 'تم تطبيق الخصم تلقائياً على مشترياتك الحالية.'
                            : 'Discount has been automatically applied to your checkout.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Cart Items List */}
                {cart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-[#F5F5F3] rounded-full flex items-center justify-center text-[#8E8D8A]">
                      <Gift className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1D1D1C]">{isArabic ? 'حقيبتك فارغة تماماً' : 'Your Bag is Empty'}</h3>
                      <p className="text-xs text-[#8E8D8A] mt-1">
                        {isArabic
                          ? 'استكشف قطعنا الفاخرة وأضف لمسة من الأناقة ليومك.'
                          : 'Explore our collection to add elements of pure luxury.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-4 p-4 bg-white border border-[#EAEAE8] rounded-2xl">
                        <div className="w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5F5F3] border border-[#EAEAE8]">
                          <img
                            src={item.product.image}
                            alt={isArabic ? item.product.nameAr : item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-[#1D1D1C] line-clamp-1">
                                {isArabic ? item.product.nameAr : item.product.name}
                              </h4>
                              <button
                                onClick={() => onRemoveItem(item.product.id)}
                                className="text-[#8E8D8A] hover:text-red-600 p-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-[10px] text-[#C5A880] font-mono uppercase tracking-wider">
                              {isArabic ? item.product.categoryAr : item.product.category}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            {/* Quantity buttons */}
                            <div className="flex items-center border border-[#EAEAE8] rounded-full bg-[#F5F5F3]">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 px-2 text-[#6C6B67] hover:text-[#1D1D1C] cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-mono font-bold px-1.5 text-[#1D1D1C]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 px-2 text-[#6C6B67] hover:text-[#1D1D1C] cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Price */}
                            <span className="text-xs font-extrabold text-[#1D1D1C]">
                              ${item.product.price * item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkout pricing summary footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-[#EAEAE8] bg-white space-y-4">
                  {/* Coupon Form */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder={isArabic ? 'رمز كوبون الخصم...' : 'Promo coupon...'}
                          className="w-full pl-4 pr-10 py-2 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                        />
                        <Ticket className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09F9C] ${isArabic ? 'left-3.5' : 'right-3.5'}`} />
                      </div>
                      <button
                        onClick={() => handleApplyCoupon(couponCode)}
                        className="px-4 py-2 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
                      >
                        {isArabic ? 'تطبيق' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-[10px] text-red-600 px-3">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold rounded-full">
                        <Check className="w-3 h-3 text-green-600" />
                        <span>{isArabic ? `تم تطبيق ${appliedCoupon} (${discountRate * 100}%)` : `Applied ${appliedCoupon} (${discountRate * 100}%)`}</span>
                      </div>
                    )}
                  </div>

                  {/* Calculations breakdown */}
                  <div className="space-y-2.5 pt-2 border-t border-[#F5F5F3] text-xs">
                    <div className="flex justify-between text-[#6C6B67]">
                      <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                      <span className="font-mono font-bold">${subtotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-700 font-bold">
                        <span>{isArabic ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                        <span className="font-mono">-${discountAmount.toFixed(1)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6C6B67]">
                      <span>{isArabic ? 'قيمة الشحن المميز' : 'Premium Carriage'}</span>
                      <span className="font-mono font-bold">
                        {shippingCost === 0 ? (isArabic ? 'مجاني' : 'FREE') : `$${shippingCost}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-base font-extrabold text-[#1D1D1C] pt-2 border-t border-[#F5F5F3]">
                      <span>{isArabic ? 'المجموع الإجمالي' : 'Grand Total'}</span>
                      <span className="font-mono">${total.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={() => onCheckout(discountRate, appliedCoupon)}
                    className="w-full py-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-lg shadow-[#1d1d1c]/10"
                  >
                    <span>{isArabic ? 'إتمام الشراء والدفع' : 'Proceed to Checkout'}</span>
                    <ChevronRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
