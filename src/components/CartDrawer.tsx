import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Ticket, Gift, Sparkles, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem } from '../types';
import { COUPONS } from '../data';
import { formatPrice, isProductOnOffer } from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (discountRate: number, couponCode: string) => void;
  isArabic: boolean;
  currency?: string;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isArabic,
  currency = 'SAR'
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [couponError, setCouponError] = useState('');
  
  // Gift Wheel Game state
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonCoupon, setWonCoupon] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (isProductOnOffer(item.product) && item.product.discountPrice ? item.product.discountPrice : item.product.price) * item.quantity, 0);
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
              <div className="p-6 border-b border-[#EAEAE8] flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                    {isArabic ? 'حقيبة مقتنياتك' : 'My Bag'}
                  </span>
                  <span className="text-[10px] bg-[#1D1D1C] text-white font-mono font-bold px-2 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-[#F5F5F3] rounded-full text-[#6C6B67] hover:text-[#1D1D1C] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-[#F5F5F3] rounded-full flex items-center justify-center text-[#8E8D8A]">
                      <Gift className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#1D1D1C]">
                        {isArabic ? 'حقيبتك فارغة تماماً' : 'Your bag is empty'}
                      </h3>
                      <p className="text-[10px] text-[#8E8D8A] mt-1 max-w-xs mx-auto">
                        {isArabic
                          ? 'استكشف مقتنياتنا الفاخرة وأضف لمستك الخاصة لحقيبة المشتريات.'
                          : 'Discover our luxury collection and place beautiful things in your life.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Items */}
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex gap-4 p-4 bg-white border border-[#EAEAE8] rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                          id={`cart-item-${item.product.id}`}
                        >
                          <div className="w-20 h-24 bg-[#F5F5F3] rounded-xl overflow-hidden shrink-0 border border-[#EAEAE8]">
                            <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-xs font-bold text-[#1D1D1C] line-clamp-1">
                                  {isArabic ? item.product.nameAr : item.product.name}
                                </h4>
                                <button
                                  onClick={() => onRemoveItem(item.product.id)}
                                  className="text-slate-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-[9px] font-mono text-[#8E8D8A] uppercase tracking-wider block mt-0.5">
                                {isArabic ? item.product.categoryAr : item.product.category}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              {/* Quantity Control */}
                              <div className="flex items-center gap-1.5 bg-[#F5F5F3] rounded-full px-2.5 py-1">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                  className="text-[#6C6B67] hover:text-[#1D1D1C] p-0.5 transition-colors disabled:opacity-40 cursor-pointer"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold font-mono text-[#1D1D1C] px-1.5 min-w-[12px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                  className="text-[#6C6B67] hover:text-[#1D1D1C] p-0.5 transition-colors cursor-pointer"
                                  disabled={item.quantity >= item.product.stock}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="flex flex-col items-end">
                                {isProductOnOffer(item.product) && item.product.discountPrice ? (
                                  <>
                                    <span className="text-xs font-bold font-mono text-rose-600">
                                      {formatPrice(item.product.discountPrice * item.quantity, currency, isArabic)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 line-through font-mono">
                                      {formatPrice(item.product.price * item.quantity, currency, isArabic)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs font-bold font-mono text-[#1D1D1C]">
                                    {formatPrice(item.product.price * item.quantity, currency, isArabic)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer pricing */}
              {cart.length > 0 && (
                <div className="p-6 bg-white border-t border-[#EAEAE8] space-y-4">
                  {/* Coupon section */}
                  <div className="space-y-1.5" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={isArabic ? 'أدخل كود الخصم (مثل VIP40)' : 'PROMO / VOUCHER (e.g. VIP40)'}
                        className="flex-1 px-4 py-2 bg-[#F5F5F3] border border-transparent rounded-full text-[10px] text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all font-mono uppercase tracking-wider"
                      />
                      <button
                        onClick={() => handleApplyCoupon(couponCode)}
                        className="px-4 py-2 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-[10px] font-bold uppercase rounded-full transition-colors cursor-pointer"
                      >
                        {isArabic ? 'تطبيق' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-[9px] text-red-500 font-bold px-2">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between px-3 py-1 bg-green-50 text-green-700 text-[10px] rounded-full font-bold">
                        <span>{isArabic ? `تم تطبيق الكوبون (${appliedCoupon})` : `Coupon Applied (${appliedCoupon})`}</span>
                        <span>-{discountRate * 100}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#F5F5F3] text-xs">
                    <div className="flex justify-between text-[#6C6B67]">
                      <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                      <span className="font-mono font-bold">{formatPrice(subtotal, currency, isArabic)}</span>
                    </div>

                    {discountRate > 0 && (
                      <div className="flex justify-between text-green-700 font-bold">
                        <span>{isArabic ? 'خصم مخصص للعميل' : 'Customer Discount'}</span>
                        <span className="font-mono">-{formatPrice(discountAmount, currency, isArabic)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6C6B67]">
                      <span>{isArabic ? 'تكلفة التوصيل الفاخر' : 'Premium Delivery'}</span>
                      <span className="font-mono font-bold">
                        {shippingCost === 0 ? (isArabic ? 'مجاني' : 'FREE') : formatPrice(shippingCost, currency, isArabic)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm font-extrabold text-[#1D1D1C] pt-2 border-t border-[#F5F5F3]">
                      <span>{isArabic ? 'المجموع الإجمالي لتأكيد الطلب' : 'Grand Total Due'}</span>
                      <span className="font-mono">{formatPrice(total, currency, isArabic)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onCheckout(discountRate, appliedCoupon)}
                    className="w-full py-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{isArabic ? 'تأكيد وحجز الطلب الفاخر' : 'Secure Checkout Now'}</span>
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
