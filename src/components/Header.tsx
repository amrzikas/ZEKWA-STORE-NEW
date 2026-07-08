import React, { useState } from 'react';
import { ShoppingBag, Search, ClipboardList, Globe, Sparkles, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
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
  currentView: 'home' | 'catalog' | 'detail' | 'checkout' | 'orders' | 'admin';
  onViewChange: (view: 'home' | 'catalog' | 'detail' | 'checkout' | 'orders' | 'admin') => void;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
  categories: Category[];
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
  categories
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-indigo-50 shadow-sm" id="zewka-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className="flex items-center justify-between py-1.5 border-b border-indigo-50 text-[11px] text-slate-500 font-bold tracking-wider">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>{isArabic ? 'شحن مجاني للطلبات فوق $150' : 'Free worldwide shipping on orders over $150'}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleLang}
              className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <Globe className="w-3 h-3 text-indigo-600" />
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
                <span className="text-2xl sm:text-3xl font-black tracking-tighter text-indigo-600 font-sans">
                  ZEWKA
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-500 uppercase -mt-1 whitespace-nowrap">
                  {isArabic ? 'بوتيك الأناقة الفاخرة' : 'Vibrant Luxury Boutique'}
                </span>
              </motion.div>

              {/* Mobile Actions Container */}
              <div className="flex md:hidden items-center gap-2">
                {/* Auth Button */}
                {user ? (
                  <button
                    onClick={onSignOut}
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center"
                    title={isArabic ? 'تسجيل الخروج' : 'Sign Out'}
                    id="signout-button-mobile"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={onSignIn}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center"
                    title={isArabic ? 'تسجيل الدخول' : 'Sign In'}
                    id="signin-button-mobile"
                  >
                    <UserIcon className="w-5 h-5" />
                  </button>
                )}

                {/* Orders Tracking */}
                <button
                  onClick={onOpenOrders}
                  className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-300 cursor-pointer"
                  title={isArabic ? 'طلباتي ومشترياتي' : 'My Orders & Tracking'}
                  id="orders-button-mobile"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>

                {/* Cart Button */}
                <button
                  onClick={onOpenCart}
                  className="relative p-2.5 text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-105 rounded-full transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
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
              className="hidden md:flex items-center gap-2 border-l border-indigo-50/50 pl-3 pr-1"
              style={{ 
                borderLeftWidth: isArabic ? 0 : '1px', 
                borderRightWidth: isArabic ? '1px' : 0,
                borderColor: 'rgb(224 231 255 / 0.5)',
                paddingLeft: isArabic ? 0 : '0.75rem',
                paddingRight: isArabic ? '0.75rem' : 0
              }}
            >
              <button
                onClick={() => onViewChange('home')}
                className={`text-xs font-black tracking-wider transition-all duration-300 cursor-pointer py-1.5 px-3 rounded-xl ${
                  currentView === 'home'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {isArabic ? 'الرئيسية' : 'HOME'}
              </button>

              {user?.email?.toLowerCase() === 'amrzikas20@gmail.com' && (
                <button
                  onClick={() => onViewChange('admin')}
                  className={`text-xs font-black tracking-wider transition-all duration-300 cursor-pointer py-1.5 px-3 rounded-xl flex items-center gap-1.5 border border-dashed ${
                    currentView === 'admin'
                      ? 'text-amber-600 bg-amber-50 border-amber-300'
                      : 'text-amber-500 border-amber-200/50 bg-amber-50/10 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{isArabic ? 'لوحة التحكم للادمن' : 'ADMIN PANEL'}</span>
                </button>
              )}
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="flex md:hidden items-center gap-3.5 pb-1 border-b border-indigo-50/50">
              <button
                onClick={() => onViewChange('home')}
                className={`text-xs font-bold pb-1 transition-all cursor-pointer ${
                  currentView === 'home'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 font-black'
                    : 'text-slate-500'
                }`}
              >
                {isArabic ? 'الصفحة الرئيسية' : 'Home'}
              </button>

              {user?.email?.toLowerCase() === 'amrzikas20@gmail.com' && (
                <button
                  onClick={() => onViewChange('admin')}
                  className={`text-xs font-bold pb-1 transition-all cursor-pointer flex items-center gap-1 ${
                    currentView === 'admin'
                      ? 'text-amber-600 border-b-2 border-amber-600 font-black'
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
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all duration-300 cursor-pointer shadow-sm shadow-indigo-600/5 whitespace-nowrap"
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
                className="w-full pl-4 pr-10 py-2 sm:py-2.5 bg-slate-100 border border-transparent rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all duration-300"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                id="search-input"
              />
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isArabic ? 'left-3.5' : 'right-3.5'}`} />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            {/* User Profile / Auth Action */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 p-1 px-2.5 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-xl transition-all duration-300 cursor-pointer"
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
                  <span className="text-xs font-black text-slate-700 hidden sm:inline max-w-[100px] truncate">
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
                className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-100 hover:border-indigo-200 text-xs font-black text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all duration-300 cursor-pointer shadow-sm shadow-indigo-600/5 whitespace-nowrap"
                id="signin-button"
              >
                <UserIcon className="w-4 h-4" />
                <span>{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            )}

            {/* Orders Tracking */}
            <button
              onClick={onOpenOrders}
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-300 cursor-pointer"
              title={isArabic ? 'طلباتي ومشترياتي' : 'My Orders & Tracking'}
              id="orders-button"
            >
              <ClipboardList className="w-5 h-5" />
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 text-white bg-indigo-600 hover:bg-indigo-700 hover:scale-105 rounded-full transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
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
