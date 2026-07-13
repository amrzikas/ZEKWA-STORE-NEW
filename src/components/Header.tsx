import React, { useState } from 'react';
import { ShoppingBag, Search, ClipboardList, Globe, Sparkles, ChevronDown, User as UserIcon, LogOut, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import { CartItem, Category } from '../types';

interface HeaderProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenOrders: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedSubcategory?: string;
  onSubcategoryChange?: (subcategory: string) => void;
  isArabic: boolean;
  onToggleLang: () => void;
  currentView: 'home' | 'catalog' | 'detail' | 'checkout' | 'orders' | 'admin' | 'offers';
  onViewChange: (view: 'home' | 'catalog' | 'detail' | 'checkout' | 'orders' | 'admin' | 'offers') => void;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
  categories: Category[];
  currency?: string;
}

export default function Header({
  cart,
  onOpenCart,
  onOpenOrders,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  isArabic,
  onToggleLang,
  currentView,
  onViewChange,
  user,
  onSignIn,
  onSignOut,
  categories,
  currency = 'SAR'
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic Free shipping threshold text based on selected currency
  const getFreeShippingText = () => {
    if (isArabic) {
      if (currency === 'SAR') return 'شحن مجاني للطلبات فوق 500 ر.س';
      if (currency === 'USD') return 'شحن مجاني للطلبات فوق $150';
      if (currency === 'AED') return 'شحن مجاني للطلبات فوق 500 د.إ';
      if (currency === 'KWD') return 'شحن مجاني للطلبات فوق 40 د.ك';
      if (currency === 'EGP') return 'شحن مجاني للطلبات فوق 1500 ج.م';
      if (currency === 'EUR') return 'شحن مجاني للطلبات فوق 130 €';
      return `شحن مجاني للطلبات فوق 500 ${currency}`;
    } else {
      if (currency === 'SAR') return 'Free worldwide shipping on orders over 500 SAR';
      if (currency === 'USD') return 'Free worldwide shipping on orders over $150';
      if (currency === 'AED') return 'Free worldwide shipping on orders over 500 AED';
      if (currency === 'KWD') return 'Free worldwide shipping on orders over 40 KWD';
      if (currency === 'EGP') return 'Free worldwide shipping on orders over 1500 EGP';
      if (currency === 'EUR') return 'Free worldwide shipping on orders over 130 EUR';
      return `Free worldwide shipping on orders over 500 ${currency}`;
    }
  };

  const isHome = currentView === 'home';

  return (
    <header 
      className={`z-40 transition-all duration-500 border-b ${
        isHome 
          ? 'absolute top-0 left-0 right-0 bg-gradient-to-b from-slate-950/95 via-slate-950/40 to-transparent border-transparent text-white' 
          : 'sticky top-0 bg-white/95 backdrop-blur-md border-indigo-50 shadow-sm text-slate-800'
      }`} 
      id="zewka-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className={`flex items-center justify-between py-1.5 border-b text-[11px] font-bold tracking-wider transition-all duration-300 ${
          isHome 
            ? 'border-white/5 text-slate-300' 
            : 'border-indigo-50 text-slate-500'
        }`}>
          <div className="flex items-center gap-1">
            <Sparkles className={`w-3.5 h-3.5 ${isHome ? 'text-[#C5A880]' : 'text-indigo-600'} animate-pulse`} />
            <span>{getFreeShippingText()}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleLang}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                isHome ? 'hover:text-[#C5A880]' : 'hover:text-indigo-600'
              }`}
            >
              <Globe className={`w-3 h-3 ${isHome ? 'text-[#C5A880]' : 'text-indigo-600'}`} />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </button>
            <span>{isArabic ? 'توصيل سريع وآمن' : 'Secure Premium Delivery'}</span>
          </div>
        </div>

        {/* Combined Header Row */}
        <div 
          className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3 md:gap-6 min-h-[4rem]"
          style={{ direction: isArabic ? 'rtl' : 'ltr' }}
        >
          {/* Brand Logo, Nav Links & Mobile Action buttons */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => onViewChange('home')}
                className="cursor-pointer flex flex-col animate-fade-in"
                id="brand-logo"
              >
                <span className={`text-2xl sm:text-3xl font-black tracking-tighter font-sans transition-colors duration-500 ${
                  isHome ? 'text-[#C5A880]' : 'text-indigo-600'
                }`}>
                  ZEWKA
                </span>
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase -mt-1 whitespace-nowrap transition-colors duration-500 ${
                  isHome ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {isArabic ? 'بوتيك الأناقة الفاخرة' : 'Vibrant Luxury Boutique'}
                </span>
              </motion.div>

              {/* Mobile Actions Container */}
              <div className="flex md:hidden items-center gap-2">
                {/* Auth Button */}
                {user ? (
                  <button
                    onClick={onSignOut}
                    className={`p-2 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                      isHome ? 'text-slate-300 hover:text-red-400 hover:bg-white/10' : 'text-slate-600 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title={isArabic ? 'تسجيل الخروج' : 'Sign Out'}
                    id="signout-button-mobile"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={onSignIn}
                    className={`p-2 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                      isHome ? 'text-slate-300 hover:text-[#C5A880] hover:bg-white/10' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                    title={isArabic ? 'تسجيل الدخول' : 'Sign In'}
                    id="signin-button-mobile"
                  >
                    <UserIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Orders Tracking */}
                <button
                  onClick={onOpenOrders}
                  className={`relative p-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isHome ? 'text-slate-300 hover:text-[#C5A880] hover:bg-white/10' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title={isArabic ? 'طلباتي ومشترياتي' : 'My Orders & Tracking'}
                  id="orders-button-mobile"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>

                {/* Cart Button */}
                <button
                  onClick={onOpenCart}
                  className={`relative p-2.5 rounded-full transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-md ${
                    isHome 
                      ? 'bg-gradient-to-r from-[#C5A880] to-[#E5C8A0] text-[#0A0D14] shadow-[#C5A880]/15 hover:scale-105' 
                      : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 hover:scale-105'
                  }`}
                  id="cart-button-mobile"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="text-[10px] font-bold bg-pink-500 text-white px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1.5 min-w-[18px] text-center shadow-md">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div 
              className="hidden md:flex items-center gap-2 border-l pl-3 pr-1"
              style={{ 
                borderLeftWidth: isArabic ? 0 : '1px', 
                borderRightWidth: isArabic ? '1px' : 0,
                borderColor: isHome ? 'rgba(255, 255, 255, 0.1)' : 'rgb(224 231 255 / 0.5)',
                paddingLeft: isArabic ? 0 : '0.75rem',
                paddingRight: isArabic ? '0.75rem' : 0
              }}
            >
              <button
                onClick={() => onViewChange('home')}
                className={`text-xs font-black tracking-wider transition-all duration-300 cursor-pointer py-1.5 px-3 rounded-xl ${
                  currentView === 'home'
                    ? isHome
                      ? 'text-[#C5A880] bg-white/10'
                      : 'text-indigo-600 bg-indigo-50'
                    : isHome
                      ? 'text-slate-300 hover:text-[#C5A880] hover:bg-white/5'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {isArabic ? 'الرئيسية' : 'HOME'}
              </button>

              <button
                onClick={() => onViewChange('offers')}
                className={`text-xs font-black tracking-wider transition-all duration-300 cursor-pointer py-1.5 px-3 rounded-xl flex items-center gap-1.5 ${
                  currentView === 'offers'
                    ? 'text-rose-600 bg-rose-50 font-black shadow-sm'
                    : isHome
                      ? 'text-rose-400 hover:text-rose-300 hover:bg-white/5 font-bold'
                      : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50/50'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{isArabic ? 'العروض الخاصة' : 'OFFERS'}</span>
              </button>

              {user?.email?.toLowerCase() === 'amrzikas20@gmail.com' && (
                <button
                  onClick={() => onViewChange('admin')}
                  className={`text-xs font-black tracking-wider transition-all duration-300 cursor-pointer py-1.5 px-3 rounded-xl flex items-center gap-1.5 border border-dashed ${
                    currentView === 'admin'
                      ? 'text-amber-600 bg-amber-50 border-amber-300'
                      : isHome
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-amber-500 border-amber-200/50 bg-amber-50/10 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{isArabic ? 'لوحة التحكم للادمن' : 'ADMIN PANEL'}</span>
                </button>
              )}
            </div>

            {/* Mobile Navigation Tabs */}
            <div className={`flex md:hidden items-center gap-3.5 pb-1 border-b transition-colors duration-500 ${isHome ? 'border-white/5' : 'border-indigo-50/50'}`}>
              <button
                onClick={() => onViewChange('home')}
                className={`text-xs font-bold pb-1 transition-all cursor-pointer ${
                  currentView === 'home'
                    ? isHome
                      ? 'text-[#C5A880] border-b-2 border-[#C5A880] font-black'
                      : 'text-indigo-600 border-b-2 border-indigo-600 font-black'
                    : isHome
                      ? 'text-slate-300'
                      : 'text-slate-500'
                }`}
              >
                {isArabic ? 'الصفحة الرئيسية' : 'Home'}
              </button>

              <button
                onClick={() => onViewChange('offers')}
                className={`text-xs font-bold pb-1 transition-all cursor-pointer flex items-center gap-1 ${
                  currentView === 'offers'
                    ? isHome
                      ? 'text-rose-400 border-b-2 border-rose-400 font-black'
                      : 'text-rose-600 border-b-2 border-rose-600 font-black'
                    : isHome
                      ? 'text-rose-400'
                      : 'text-rose-500'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>{isArabic ? 'العروض' : 'Offers'}</span>
              </button>

              {user?.email?.toLowerCase() === 'amrzikas20@gmail.com' && (
                <button
                  onClick={() => onViewChange('admin')}
                  className={`text-xs font-bold pb-1 transition-all cursor-pointer flex items-center gap-1 ${
                    currentView === 'admin'
                      ? 'text-amber-600 border-b-2 border-amber-600 font-black'
                      : isHome
                        ? 'text-amber-400'
                        : 'text-amber-500'
                  }`}
                >
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  <span>{isArabic ? 'لوحة الادمن' : 'Admin'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Categories Dropdown & Search Bar */}
          <div 
            className="flex items-center gap-2 sm:gap-3 flex-1 w-full max-w-full md:max-w-xl"
            id="categories-nav"
          >
            {/* Category Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black rounded-xl transition-all duration-300 cursor-pointer shadow-sm whitespace-nowrap ${
                  isHome 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/5 shadow-black/20' 
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 shadow-indigo-600/5'
                }`}
                id="category-dropdown-btn"
              >
                <span>
                  {selectedCategory === 'all' 
                    ? (isArabic ? 'كل المجموعة' : 'ALL COLLECTION') 
                    : (isArabic 
                        ? (categories.find(c => c.id === selectedCategory)?.nameAr || selectedCategory)
                        : (categories.find(c => c.id === selectedCategory)?.name?.toUpperCase() || selectedCategory.toUpperCase()))}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop to close */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`absolute top-full mt-2 w-64 max-h-96 overflow-y-auto bg-white border-2 border-indigo-50 rounded-2xl shadow-2xl z-50 py-2 ${
                      isArabic ? 'right-0' : 'left-0'
                    }`}
                  >
                    {/* All collection button */}
                    <button
                      onClick={() => {
                        onCategoryChange('all');
                        if (onSubcategoryChange) onSubcategoryChange('');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-indigo-600 text-white font-black'
                          : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                      style={{ flexDirection: isArabic ? 'row-reverse' : 'row' }}
                    >
                      <span>{isArabic ? 'كل المجموعة' : 'All Collection'}</span>
                      {selectedCategory === 'all' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      )}
                    </button>

                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <div key={cat.id} className="border-t border-slate-50">
                          <button
                            onClick={() => {
                              onCategoryChange(cat.id);
                              if (onSubcategoryChange) onSubcategoryChange('');
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isActive && !selectedSubcategory
                                ? 'bg-indigo-600 text-white font-black'
                                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                            style={{ flexDirection: isArabic ? 'row-reverse' : 'row' }}
                          >
                            <span>{isArabic ? cat.nameAr : cat.name}</span>
                            {isActive && !selectedSubcategory && (
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            )}
                          </button>
                          
                          {/* Render Subcategories inside dropdown */}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="bg-slate-50/50 py-1">
                              {cat.subcategories.map((sub) => {
                                const isSubActive = selectedCategory === cat.id && selectedSubcategory === sub.id;
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      onCategoryChange(cat.id);
                                      if (onSubcategoryChange) onSubcategoryChange(sub.id);
                                      setIsDropdownOpen(false);
                                    }}
                                    className={`w-full py-2 text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                                      isSubActive
                                        ? 'text-indigo-600 font-black bg-indigo-50/30'
                                        : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/20'
                                    }`}
                                    style={{ 
                                      paddingLeft: isArabic ? '1rem' : '1.75rem',
                                      paddingRight: isArabic ? '1.75rem' : '1rem',
                                      flexDirection: isArabic ? 'row-reverse' : 'row'
                                    }}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span>↳</span>
                                      <span>{isArabic ? sub.nameAr : sub.name}</span>
                                    </span>
                                    {isSubActive && (
                                      <span className="w-1 h-1 rounded-full bg-indigo-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                </>
              )}
            </div>

            {/* Search Bar next to it */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isArabic ? 'ابحث عن قطعة فاخرة...' : 'Search luxury pieces...'}
                className={`w-full pl-4 pr-10 py-2 sm:py-2.5 border rounded-xl text-xs transition-all duration-300 focus:outline-none focus:ring-2 ${
                  isHome 
                    ? 'bg-white/10 border-white/5 text-white placeholder-slate-400 focus:bg-white/25 focus:border-[#C5A880] focus:ring-[#C5A880]/10' 
                    : 'bg-slate-100 border-transparent text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:ring-indigo-100'
                }`}
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                id="search-input"
              />
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 ${isArabic ? 'left-3.5' : 'right-3.5'} ${isHome ? 'text-slate-300' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            {/* User Profile / Auth Action */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-1.5 p-1 px-2.5 border rounded-xl transition-all duration-300 cursor-pointer ${
                    isHome 
                      ? 'border-white/15 hover:border-white/30 hover:bg-white/10' 
                      : 'border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                  id="profile-dropdown-btn"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black uppercase shadow-sm">
                      {user.displayName ? user.displayName.slice(0, 2) : (user.email ? user.email.slice(0, 2) : 'U')}
                    </div>
                  )}
                  <span className={`text-xs font-black hidden sm:inline max-w-[100px] truncate ${isHome ? 'text-slate-200' : 'text-slate-700'}`}>
                    {user.displayName || (isArabic ? 'الحساب' : 'Account')}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute top-full mt-2 w-56 bg-white border-2 border-indigo-50 rounded-2xl shadow-2xl z-50 p-3.5 ${
                        isArabic ? 'left-0' : 'right-0'
                      }`}
                    >
                      <div className="mb-2.5 pb-2.5 border-b border-indigo-50" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                        <p className="text-xs font-black text-slate-800 truncate">
                          {user.displayName || (isArabic ? 'عميل زيوكا الفاخر' : 'Luxury ZEWKA Client')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onSignOut();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 cursor-pointer"
                        style={{ flexDirection: isArabic ? 'row-reverse' : 'row' }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-black rounded-xl transition-all duration-300 cursor-pointer shadow-sm whitespace-nowrap ${
                  isHome 
                    ? 'border-white/15 hover:border-white/30 text-white hover:bg-white/10' 
                    : 'border-indigo-100 hover:border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 shadow-indigo-600/5'
                }`}
                id="signin-button"
              >
                <UserIcon className="w-4 h-4" />
                <span>{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            )}

            {/* Orders Tracking */}
            <button
              onClick={onOpenOrders}
              className={`relative p-2 rounded-full transition-all duration-300 cursor-pointer ${
                isHome ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              title={isArabic ? 'طلباتي ومشترياتي' : 'My Orders & Tracking'}
              id="orders-button"
            >
              <ClipboardList className="w-5 h-5" />
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className={`relative p-2.5 rounded-full transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-md ${
                isHome 
                  ? 'bg-gradient-to-r from-[#C5A880] to-[#E5C8A0] text-[#0A0D14] shadow-[#C5A880]/15 hover:scale-105' 
                  : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 hover:scale-105'
              }`}
              id="cart-button"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="text-[10px] font-bold bg-pink-500 text-white px-1.5 py-0.5 rounded-full absolute -top-1.5 -right-1.5 min-w-[18px] text-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
