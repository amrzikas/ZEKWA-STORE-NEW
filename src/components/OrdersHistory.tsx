import React from 'react';
import { X, ClipboardList, Package, Truck, Compass, CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { Order } from '../types';
import { formatPrice } from '../utils';

interface OrdersHistoryProps {
  orders: Order[];
  onClose: () => void;
  isArabic: boolean;
  currency?: string;
}

export default function OrdersHistory({ orders, onClose, isArabic, currency = 'SAR' }: OrdersHistoryProps) {
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
