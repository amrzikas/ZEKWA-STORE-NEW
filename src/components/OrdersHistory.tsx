import React from 'react';
import { X, ClipboardList, Package, Truck, Compass, CheckCircle2, ShoppingBag, UserPlus, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Order } from '../types';
import { formatPrice } from '../utils';

interface OrdersHistoryProps {
  orders: Order[];
  onClose: () => void;
  isArabic: boolean;
  currency?: string;
  user?: any;
  onSignIn?: () => void;
}

export default function OrdersHistory({ orders, onClose, isArabic, currency = 'SAR', user, onSignIn }: OrdersHistoryProps) {
  const steps = [
    { id: 'placed', labelAr: 'تم تقديم الطلب', labelEn: 'Order Placed', icon: Package },
    { id: 'processing', labelAr: 'جارِ التجهيز والتغليف', labelEn: 'Packaging', icon: Compass },
    { id: 'shipped', labelAr: 'خرج مع الناقل', labelEn: 'In Transit', icon: Truck },
    { id: 'delivered', labelAr: 'تم التوصيل بنجاح', labelEn: 'Delivered', icon: CheckCircle2 }
  ];

  return (
    <div className="bg-[#FBFBFA] min-h-screen py-10" id="orders-history-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#EAEAE8] pb-6 mb-8">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-[#C5A880]" />
            <div>
              <h1 className="text-xl font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                {isArabic ? 'صندوق المشتريات والطلبات' : 'My Orders & Tracking'}
              </h1>
              <span className="text-xs text-[#8E8D8A] block mt-0.5">
                {isArabic ? 'تتبع فوري ومباشر لجميع مشترياتك الفاخرة' : 'Real-time state tracking for your boutique items'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F5F5F3] hover:bg-[#1D1D1C] hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer"
          >
            {isArabic ? 'العودة للتسوق' : 'Close Portal'}
          </button>
        </div>

        {/* Guest account registration suggestion banner */}
        {!user && orders.length > 0 && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-xl border border-slate-800 animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A880]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-[#C5A880]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                    {isArabic ? 'عرض خاص للنخبة والزوار' : 'EXCLUSIVE GUEST REWARD'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  {isArabic 
                    ? 'هل ترغب في تتبع طلبك وحفظ بياناتك مع الحصول على خصومات حصرية؟' 
                    : 'Track your package & save details with exclusive VIP discounts!'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                  {isArabic 
                    ? 'لقد أتممت الطلب بنجاح كزائر! نوصيك بشدة بتسجيل حسابك الآن لتتمكن من تتبع مسار شحنتك المباشر في أي وقت، وحفظ عناوين الشحن لتسوق أسرع مستقبلاً، بالإضافة للحصول على كوبونات خصم حصرية للأعضاء المسجلين.'
                    : 'You have completed checkout as a guest! We highly recommend registering your account to track your package live, save your addresses for faster checkout, and unlock exclusive VIP discounts on future purchases.'}
                </p>
                
                {/* Benefits List */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#C5A880]">✓</span>
                    <span>{isArabic ? 'تتبع فوري ومباشر للشحنة' : 'Real-time live tracking'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#C5A880]">✓</span>
                    <span>{isArabic ? 'حفظ عناوين توصيل متعددة' : 'Save multi-addresses'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#C5A880]">✓</span>
                    <span>{isArabic ? 'خصومات حصرية للأعضاء' : 'Exclusive VIP discounts'}</span>
                  </div>
                </div>
              </div>

              {onSignIn && (
                <button
                  onClick={onSignIn}
                  className="px-6 py-3.5 bg-white text-slate-900 hover:bg-[#C5A880] hover:text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-2 shrink-0 border border-transparent"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isArabic ? 'سجل حسابك الآن مجاناً' : 'Register Account Free'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content list */}
        {orders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-[#F5F5F3] rounded-full flex items-center justify-center text-[#8E8D8A]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1D1C]">{isArabic ? 'لا توجد طلبات مسجلة' : 'No Placed Orders Yet'}</h2>
              <p className="text-xs text-[#8E8D8A] mt-1 max-w-sm">
                {isArabic
                  ? 'لم تقم بإتمام أي عملية شراء بعد. مقتنياتنا الفاخرة بانتظار تزيين سلتك.'
                  : 'Start shopping to create premium orders and track their delivery status in real-time.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {orders.map((order) => {
              // Map shippingStatus index
              const currentStepIndex = steps.findIndex((s) => s.id === order.shippingStatus);
              const isRejected = order.shippingStatus === 'rejected';

              return (
                <div key={order.id} className="bg-white border border-[#EAEAE8] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  {/* Order meta row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F5F3]">
                    <div style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                      <span className="text-[9px] font-mono tracking-widest text-[#C5A880] uppercase block">
                        {isArabic ? 'رقم التتبع المباشر' : 'Live Tracking ID'}
                      </span>
                      <span className="text-sm font-extrabold text-[#1D1D1C] font-mono">{order.trackingNumber}</span>
                    </div>

                    <div className="flex gap-6 text-xs text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-[#8E8D8A] block uppercase">
                          {isArabic ? 'تاريخ الطلب' : 'Placed Date'}
                        </span>
                        <span className="font-bold text-[#1D1D1C]">{order.date}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-[#8E8D8A] block uppercase">
                          {isArabic ? 'المبلغ الإجمالي' : 'Settlement Total'}
                        </span>
                        <span className="font-bold text-[#1D1D1C] font-mono">{formatPrice(order.total, currency, isArabic)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Status Visual Track bar */}
                  {isRejected ? (
                    <div className="py-4 px-6 bg-red-50 border border-red-200/60 rounded-2xl flex items-center gap-3 text-red-700" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                      <X className="w-5 h-5 stroke-[2.5] text-red-600 shrink-0" />
                      <div>
                        <p className="text-xs font-black">{isArabic ? 'تم رفض هذا الطلب وإلغاؤه' : 'This order has been rejected & canceled'}</p>
                        <p className="text-[10px] text-red-500 font-bold mt-0.5 font-sans leading-relaxed">
                          {isArabic 
                            ? 'لقد تم رفض عملية الدفع أو الطلب من قبل الإدارة. يرجى التواصل مع الدعم الفني للاستفسار.' 
                            : 'The payment verification or order has been rejected by administration. Please contact customer support.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-6">
                      <div className="grid grid-cols-4 gap-2 text-center relative">
                        {/* Connection Line */}
                        <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-[#EAEAE8] -z-10">
                          <div
                            className="bg-[#C5A880] h-full transition-all duration-1000"
                            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                          />
                        </div>

                        {steps.map((st, sIdx) => {
                          const Icon = st.icon;
                          const isDone = sIdx <= currentStepIndex;
                          const isCurrent = sIdx === currentStepIndex;

                          return (
                            <div key={st.id} className="flex flex-col items-center">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                  isDone
                                    ? 'bg-[#1D1D1C] text-[#C5A880] border-[#C5A880]'
                                    : 'bg-white text-[#A09F9C] border-[#EAEAE8]'
                                } ${isCurrent ? 'ring-4 ring-[#C5A880]/20 scale-105' : ''}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[9px] sm:text-[10px] font-bold mt-2 tracking-tight ${
                                  isDone ? 'text-[#1D1D1C]' : 'text-[#8E8D8A]'
                                }`}
                              >
                                {isArabic ? st.labelAr : st.labelEn}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order breakdown summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F5F5F3]">
                    {/* Item list */}
                    <div className="space-y-3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1C]">
                        {isArabic ? 'القطع المشتراة' : 'Purchased Items'}
                      </h4>
                      <div className="space-y-2">
                        {order.items.map((it) => (
                          <div key={it.product.id} className="flex justify-between items-center text-xs py-1.5 border-b border-[#F5F5F3]">
                            <span className="text-[#6C6B67]">
                              {isArabic ? it.product.nameAr : it.product.name}{' '}
                              <span className="font-mono font-bold text-[#1D1D1C]">×{it.quantity}</span>
                            </span>
                            <span className="font-mono font-bold">{formatPrice(it.product.price * it.quantity, currency, isArabic)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery addresses */}
                    <div className="space-y-3 text-xs" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1C]">
                        {isArabic ? 'وجهة التسليم ومعلومات العميل' : 'Boutique Destination Address'}
                      </h4>
                      <div className="p-3 bg-[#F5F5F3] rounded-2xl space-y-1.5 text-[#6C6B67]">
                        <p className="font-bold text-[#1D1D1C]">{order.customerInfo.fullName}</p>
                        <p>{order.customerInfo.phone}</p>
                        <p>{order.customerInfo.address}, {order.customerInfo.city}</p>
                        <p className="font-mono">{order.customerInfo.postalCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
