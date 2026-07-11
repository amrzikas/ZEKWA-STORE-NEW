import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, Sparkles, CheckCircle2, ChevronRight, ShoppingBag, Check, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, CustomerInfo, Order, ShippingStatus } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { formatPrice } from '../utils';

interface CheckoutWizardProps {
  cart: CartItem[];
  subtotal: number;
  discountRate: number;
  couponCode: string;
  onComplete: (order: Order) => void;
  onCancel: () => void;
  isArabic: boolean;
  currency?: string;
}

export default function CheckoutWizard({
  cart,
  subtotal,
  discountRate,
  couponCode,
  onComplete,
  onCancel,
  isArabic,
  currency = 'SAR'
}: CheckoutWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Delivery, 2: Payment, 3: Processing
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFocused, setIsCardFocused] = useState(false);

  // Dynamic Gateways & Shipping Plans
  const [gateways, setGateways] = useState<any[]>([]);
  const [shippingPlans, setShippingPlans] = useState<any[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('credit_card');
  const [selectedShippingPlan, setSelectedShippingPlan] = useState<any | null>(null);

  // Manual Receipt verification state
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptError, setReceiptError] = useState<string>('');

  useEffect(() => {
    // Fetch active gateways from Firestore
    getDocs(collection(db, 'gateways')).then(snap => {
      const fetched: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.status === 'active') fetched.push(data);
      });
      // Always include standard credit card as default
      const defaultCard = {
        id: 'credit_card',
        name: 'Credit Card',
        nameAr: 'البطاقة الائتمانية',
        description: 'Secure credit card payment.',
        descriptionAr: 'الدفع المباشر والآمن عبر بطاقتك الائتمانية.'
      };
      // Always include Cash on Delivery as a default option
      const defaultCod = {
        id: 'cod',
        name: 'Cash on Delivery',
        nameAr: 'الدفع عند الاستلام',
        description: 'Pay cash upon receiving your order.',
        descriptionAr: 'ادفع نقداً عند استلام طلبك.'
      };
      setGateways([defaultCard, defaultCod, ...fetched]);
    }).catch(err => console.error("Error fetching checkout gateways: ", err));

    // Fetch active shipping plans from Firestore
    getDocs(collection(db, 'shippingPlans')).then(snap => {
      const fetched: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.status === 'active') fetched.push(data);
      });

      // Filter or sort shipping plans based on product custom shipping plan if defined
      const productShippingPlanIds = cart
        .map(item => item.product?.shippingPlanId)
        .filter(Boolean);

      let finalPlans = fetched;
      if (productShippingPlanIds.length > 0) {
        const matchedPlans = fetched.filter(plan => productShippingPlanIds.includes(plan.id));
        if (matchedPlans.length > 0) {
          finalPlans = matchedPlans;
        }
      }

      setShippingPlans(finalPlans);
      if (finalPlans.length > 0) {
        setSelectedShippingPlan(finalPlans[0]);
      }
    }).catch(err => console.error("Error fetching checkout shipping: ", err));
  }, []);

  const discountAmount = subtotal * discountRate;
  
  // Fallback to default shipping if no dynamic plans found
  const shippingCost = selectedShippingPlan 
    ? selectedShippingPlan.cost 
    : (subtotal >= 150 ? 0 : 25);
    
  const total = subtotal - discountAmount + shippingCost;

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setReceiptImage(dataUrl);
        setReceiptError('');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate manual receipt if manual gateway is chosen (excluding credit card and COD)
    if (selectedGatewayId !== 'credit_card' && selectedGatewayId !== 'cod') {
      if (!receiptImage) {
        setReceiptError(isArabic 
          ? 'يرجى رفع صورة إثبات التحويل أولاً لإتمام الطلب.' 
          : 'Please upload the transfer confirmation receipt first.'
        );
        return;
      }
    }

    setStep(3);

    // Simulate luxury order verification processing
    setTimeout(() => {
      const customerInfo: CustomerInfo = {
        fullName,
        email,
        phone,
        address,
        city,
        postalCode
      };

      const trackingNumber = `ZW-${Math.floor(10000 + Math.random() * 90000)}-${city.slice(0, 3).toUpperCase()}`;
      const chosenGateway = gateways.find(g => g.id === selectedGatewayId);
      const newOrder: Order = {
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        items: [...cart],
        subtotal,
        discount: discountAmount,
        total,
        customerInfo,
        shippingStatus: 'placed' as ShippingStatus,
        date: new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US'),
        trackingNumber,
        paymentGatewayId: selectedGatewayId,
        paymentGatewayName: chosenGateway ? (isArabic ? chosenGateway.nameAr : chosenGateway.name) : 'Credit Card',
        paymentStatus: selectedGatewayId === 'credit_card' ? 'verified' : 'pending_verification',
        receiptImage: (selectedGatewayId === 'credit_card' || selectedGatewayId === 'cod') ? '' : receiptImage
      };

      onComplete(newOrder);
    }, 3000);
  };

  return (
    <div className="bg-[#FBFBFA] min-h-screen py-12" id="checkout-wizard-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back control */}
        {step < 3 && (
          <button
            onClick={step === 2 ? () => setStep(1) : onCancel}
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#6C6B67] hover:text-[#1D1D1C] mb-8 cursor-pointer"
          >
            <ArrowLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
            <span>{step === 2 ? (isArabic ? 'الرجوع للعنوان' : 'Back to Delivery') : (isArabic ? 'الرجوع للمتجر' : 'Back to Cart')}</span>
          </button>
        )}

        {/* Steps header */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-4 mb-10 text-xs font-bold font-mono tracking-wider">
            <span className={`${step === 1 ? 'text-[#1D1D1C]' : 'text-[#8E8D8A]'}`}>
              {isArabic ? '01. عنوان التوصيل' : '01. DELIVERY'}
            </span>
            <span className="text-[#EAEAE8]">/</span>
            <span className={`${step === 2 ? 'text-[#1D1D1C]' : 'text-[#8E8D8A]'}`}>
              {isArabic ? '02. تفاصيل الدفع' : '02. PAYMENT'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Action Forms */}
          <div className="lg:col-span-7" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-delivery"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEAE8] shadow-sm space-y-6"
                >
                  <h2 className="text-lg font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                    {isArabic ? 'أين نسلم مشترياتك الفاخرة؟' : 'Where should we deliver your luxury?'}
                  </h2>

                  <form onSubmit={handleDeliverySubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                        {isArabic ? 'الاسم الكامل للعميل' : 'Noble Customer Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isArabic ? 'أحمد بن خالد العتيبي' : 'Lord Arthur Pendragon'}
                        className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                          {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@zewkaboutique.com"
                          className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                          {isArabic ? 'رقم الهاتف' : 'Telephone Number'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+966 50 123 4567"
                          className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                        {isArabic ? 'عنوان الشارع والحي بالتفصيل' : 'Street Address & District'}
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={isArabic ? 'شارع العليا العام، حي الياسمين، عمارة 14' : 'Elite Residency, Suite 24B'}
                        className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                          {isArabic ? 'المدينة' : 'City'}
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={isArabic ? 'الرياض' : 'Riyadh'}
                          className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                          {isArabic ? 'الرمز البريدي' : 'Postal / Zip Code'}
                        </label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="12345"
                          className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Shipping Plans Selector */}
                    {shippingPlans.length > 0 && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase tracking-wider">
                          {isArabic ? 'خطة الشحن الفاخرة' : 'Preferred Premium Carriage'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {shippingPlans.map((plan) => (
                            <div
                              key={plan.id}
                              onClick={() => setSelectedShippingPlan(plan)}
                              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                selectedShippingPlan?.id === plan.id
                                  ? 'border-[#C5A880] bg-[#FBFBFA]'
                                  : 'border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-[#1D1D1C]">{isArabic ? plan.nameAr : plan.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{isArabic ? plan.deliveryTimeAr : plan.deliveryTime}</p>
                              </div>
                              <span className="text-xs font-bold font-mono text-[#C5A880]">
                                {plan.cost === 0 ? (isArabic ? 'مجاني' : 'FREE') : formatPrice(plan.cost, currency, isArabic)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mt-4"
                    >
                      <span>{isArabic ? 'الانتقال لخطوة الدفع' : 'Proceed to Payment'}</span>
                      <ChevronRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-payment"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-[#EAEAE8] shadow-sm space-y-6"
                >
                  <h2 className="text-lg font-extrabold text-[#1D1D1C] uppercase tracking-wider">
                    {isArabic ? 'تأمين بوابة الدفع الفاخرة' : 'Secure Boutique Settlement'}
                  </h2>

                  {/* Gateways Selector */}
                  {gateways.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-slate-100">
                      <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase tracking-wider">
                        {isArabic ? 'بوابة الدفع المفضلة' : 'Preferred Payment Gateway'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {gateways.map((gw) => (
                          <div
                            key={gw.id}
                            onClick={() => setSelectedGatewayId(gw.id)}
                            className={`p-3 rounded-2xl border-2 text-center cursor-pointer transition-all flex flex-col justify-center items-center gap-1 ${
                              selectedGatewayId === gw.id
                                ? 'border-[#C5A880] bg-[#FBFBFA] text-[#1D1D1C]'
                                : 'border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <span className="text-xs font-bold whitespace-nowrap">{isArabic ? gw.nameAr : gw.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedGatewayId !== 'credit_card' ? (
                    selectedGatewayId === 'cod' ? (
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center space-y-4 font-sans text-xs text-slate-800 w-full">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                          <Truck className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#1D1D1C] text-sm">
                            {isArabic ? 'الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD)'}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            {isArabic ? 'سداد قيمة الطلب نقداً للمندوب فور وصول الشحنة لموقعك.' : 'Pay in cash directly to the courier agent upon arrival.'}
                          </p>
                        </div>

                        {/* Explicit Crucial Warning Requested by User */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] leading-relaxed max-w-sm mx-auto text-amber-900 font-bold flex items-start gap-2.5" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                          <span className="text-sm shrink-0">⚠️</span>
                          <div className="text-right">
                            <p className="font-black text-amber-950 mb-0.5">{isArabic ? 'تنبيه هام ومُلزم:' : 'Important Binding Notice:'}</p>
                            <p className="font-bold text-amber-900">
                              {isArabic 
                                ? 'في حال رفض استلام الطلب عند التوصيل، يرجى العلم بأنه سيتم تحصيل رسوم الشحن فقط كتعويض للمندوب وتكاليف النقل.' 
                                : 'If the order is rejected upon delivery, please note that shipping fees will still be collected to cover courier dispatch and logistics.'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePaymentSubmit()}
                          className="w-full py-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg"
                        >
                          <Truck className="w-4 h-4" />
                          <span>{isArabic ? `تأكيد الطلب والدفع عند الاستلام` : `Confirm Order (Cash on Delivery)`}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 bg-amber-50/40 border border-amber-100 rounded-3xl text-center space-y-4 font-sans text-xs text-slate-800">
                      <div className="w-12 h-12 bg-[#C5A880]/10 rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5 text-[#C5A880]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-[#1D1D1C] text-sm">
                          {isArabic ? 'بوابة دفع معتمدة' : 'Verified Gateway Checkout'}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {isArabic ? 'لقد اخترت الدفع عبر:' : 'You have chosen settlement via:'} <span className="font-bold text-[#C5A880]">{isArabic ? gateways.find(g => g.id === selectedGatewayId)?.nameAr : gateways.find(g => g.id === selectedGatewayId)?.name}</span>
                        </p>
                      </div>
                      
                      {/* Gateway Payment Transfer Info */}
                      {(() => {
                        const currentGateway = gateways.find(g => g.id === selectedGatewayId);
                        if (!currentGateway) return null;
                        const hasPhone = !!currentGateway.phone;
                        const hasAddress = !!currentGateway.paymentAddress;
                        if (!hasPhone && !hasAddress) return null;
                        
                        return (
                          <div className="p-4 bg-white/80 border border-[#EAEAE8] rounded-2xl text-[11px] space-y-2 text-right font-bold max-w-sm mx-auto animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            <p className="font-black text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5">{isArabic ? 'بيانات التحويل السريع:' : 'Boutique Settlement Account:'}</p>
                            {hasPhone && (
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-slate-400">{isArabic ? 'رقم الهاتف للتحويل:' : 'Transfer Phone / Mobile:'}</span>
                                <span className="font-mono text-xs text-[#C5A880] font-black">{currentGateway.phone}</span>
                              </div>
                            )}
                            {hasAddress && (
                              <div className="flex justify-between items-center gap-4 pt-1 border-t border-slate-50">
                                <span className="text-slate-400">{isArabic ? 'عنوان الدفع / الحساب:' : 'Payment Address / Account:'}</span>
                                <span className="font-mono text-xs text-[#C5A880] font-black">{currentGateway.paymentAddress}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Manual Receipt Upload Form */}
                      <div className="p-5 bg-white border border-slate-200 rounded-3xl max-w-sm mx-auto text-center space-y-3 shadow-sm">
                        <p className="font-extrabold text-[#1D1D1C] text-[11px] uppercase tracking-wider">
                          {isArabic ? 'رفع صورة إثبات التحويل (مطلوب)' : 'Upload Transfer Receipt (Required)'}
                        </p>
                        
                        {receiptImage ? (
                          <div className="space-y-2">
                            <img src={receiptImage} alt="Receipt Preview" className="w-24 h-24 object-cover mx-auto rounded-xl border border-slate-200 shadow-sm" />
                            <button 
                              type="button" 
                              onClick={() => setReceiptImage('')}
                              className="text-[10px] text-red-500 font-bold hover:underline block mx-auto cursor-pointer"
                            >
                              {isArabic ? 'حذف الصورة وإعادة الرفع' : 'Remove & Re-upload'}
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-slate-200 hover:border-[#C5A880] rounded-2xl p-4 cursor-pointer relative transition-all bg-slate-50/50 hover:bg-slate-50">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleReceiptUpload} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            <p className="text-[10px] text-slate-500 font-bold leading-normal">
                              {isArabic ? 'اضغط هنا لرفع صورة الإيصال أو اسحبها' : 'Click to upload receipt photo or drag here'}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1">JPEG, PNG</p>
                          </div>
                        )}
                        {receiptError && (
                          <p className="text-[10px] text-red-500 font-bold">{receiptError}</p>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal max-w-sm mx-auto font-medium">
                        {isArabic 
                          ? 'يرجى تحويل المبلغ الإجمالي إلى تفاصيل السداد الموضحة أعلاه، ورفع صورة التحويل، ثم الضغط أدناه لتأكيد الطلب لتتحقق الإدارة منه.' 
                          : 'Please transfer the grand total to the details shown above, upload the screenshot, and click below to place your order for verification.'}
                      </p>

                      <button
                        onClick={() => handlePaymentSubmit()}
                        className="w-full py-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{isArabic ? `تأكيد الطلب بقيمة ${formatPrice(total, currency, isArabic)}` : `Confirm Order ${formatPrice(total, currency, isArabic)}`}</span>
                      </button>
                    </div>
                    )
                  ) : (
                    <>
                      {/* Elegant Credit Card Mockup */}
                      <div className="relative w-full h-48 rounded-2xl bg-gradient-to-tr from-[#1D1D1C] to-[#454543] p-6 text-white overflow-hidden shadow-xl border border-white/10 mb-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase">ZEWKA SELECT</span>
                          <CreditCard className="w-8 h-8 text-[#C5A880] opacity-80" />
                        </div>

                        {/* Card Number display */}
                        <div className="text-base sm:text-lg font-mono tracking-[0.2em] mb-6">
                          {cardNumber ? cardNumber : '•••• •••• •••• ••••'}
                        </div>

                        {/* Footer info inside card */}
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-[8px] font-mono text-[#8E8D8A] block uppercase mb-0.5">
                              {isArabic ? 'حامل البطاقة' : 'Cardholder'}
                            </span>
                            <span className="text-xs font-bold tracking-wider uppercase font-sans">
                              {cardName ? cardName : (isArabic ? 'الاسم الكريم' : 'Your Noble Name')}
                            </span>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <span className="text-[8px] font-mono text-[#8E8D8A] block uppercase mb-0.5">EXP</span>
                              <span className="text-xs font-mono font-bold">{cardExpiry ? cardExpiry : 'MM/YY'}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-mono text-[#8E8D8A] block uppercase mb-0.5">CVV</span>
                              <span className="text-xs font-mono font-bold">{cardCvv ? cardCvv : '•••'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment form */}
                      <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                            {isArabic ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                          </label>
                          <input
                            type="text"
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                            {isArabic ? 'رقم بطاقة الائتمان' : 'Credit Card Number'}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                              // Auto format spacing
                              const v = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                              setCardNumber(v);
                            }}
                            placeholder="4123 4567 8901 2345"
                            className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                              {isArabic ? 'تاريخ الانتهاء' : 'Expiration Date'}
                            </label>
                            <input
                              type="text"
                              required
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value;
                                if (v.length === 2 && !v.includes('/')) v += '/';
                                setCardExpiry(v);
                              }}
                              placeholder="MM/YY"
                              className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#1D1D1C] block uppercase mb-1">
                              CVV
                            </label>
                            <input
                              type="password"
                              required
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              className="w-full px-4 py-3 bg-[#F5F5F3] border border-transparent rounded-full text-xs text-[#1D1D1C] focus:bg-white focus:border-[#C5A880] focus:outline-none transition-all font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 py-2 text-[#8E8D8A] text-[10px] leading-relaxed">
                          <Lock className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span>{isArabic ? 'بيانات بطاقتك الائتمانية مشفرة بالكامل بمعيار AES-256.' : 'Your billing data is fully secured with certified AES-256 cryptography.'}</span>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-4 bg-[#1D1D1C] hover:bg-[#C5A880] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span>{isArabic ? `دفع ${formatPrice(total, currency, isArabic)} بأمان` : `Pay ${formatPrice(total, currency, isArabic)} Securely`}</span>
                        </button>
                      </form>
                    </>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-8 sm:p-12 rounded-3xl border border-[#EAEAE8] text-center space-y-6 shadow-sm"
                >
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-[#C5A880]/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#C5A880] border-t-transparent rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-[#C5A880] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-extrabold text-[#1D1D1C]">
                      {isArabic ? 'تأمين طلبك الفاخر...' : 'Securing Your Luxury Order...'}
                    </h2>
                    <p className="text-xs text-[#6C6B67] leading-relaxed max-w-sm mx-auto">
                      {isArabic
                        ? 'يرجى الانتظار بينما نقوم بالتحقق من معلومات البنك وإعداد طرد التغليف الفاخر الخاص بك في بوتيك زيوكا.'
                        : 'Please wait briefly while we settle the transaction and prepare your custom premium package wrapping.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout pricing summary right side */}
          {step < 3 && (
            <div className="lg:col-span-5 bg-[#F5F5F3] p-6 sm:p-8 rounded-3xl border border-[#EAEAE8]" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              <h3 className="text-sm font-bold text-[#1D1D1C] uppercase tracking-wider mb-4 pb-2 border-b border-[#EAEAE8]">
                {isArabic ? 'ملخص مقتنياتك' : 'Bag Summary'}
              </h3>

              {/* Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto mb-6 pr-1.5 scrollbar-none">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3 text-xs">
                    <div className="w-12 h-16 bg-white rounded-lg border border-[#EAEAE8] overflow-hidden flex-shrink-0">
                      <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-bold text-[#1D1D1C] line-clamp-1">{isArabic ? item.product.nameAr : item.product.name}</h4>
                        <span className="text-[10px] text-[#8E8D8A]">{isArabic ? 'الكمية' : 'Qty'} {item.quantity}</span>
                      </div>
                      <span className="font-bold font-mono">{formatPrice(item.product.price * item.quantity, currency, isArabic)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Prices */}
              <div className="space-y-2.5 pt-4 border-t border-[#EAEAE8] text-xs">
                <div className="flex justify-between text-[#6C6B67]">
                  <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="font-mono font-bold">{formatPrice(subtotal, currency, isArabic)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>{isArabic ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                    <span className="font-mono">-{formatPrice(discountAmount, currency, isArabic)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#6C6B67]">
                  <span>{isArabic ? 'قيمة الشحن المميز' : 'Premium Carriage'}</span>
                  <span className="font-mono font-bold">
                    {shippingCost === 0 ? (isArabic ? 'مجاني' : 'FREE') : formatPrice(shippingCost, currency, isArabic)}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-[#1D1D1C] pt-3 border-t border-[#EAEAE8]">
                  <span>{isArabic ? 'المجموع النهائي' : 'Grand Total'}</span>
                  <span className="font-mono">{formatPrice(total, currency, isArabic)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
