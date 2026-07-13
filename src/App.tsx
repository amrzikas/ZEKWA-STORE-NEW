import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import CheckoutWizard from './components/CheckoutWizard';
import AiAssistant from './components/AiAssistant';
import OrdersHistory from './components/OrdersHistory';
import AllCollection from './components/AllCollection';

import { CartItem, Product, Review, Order, ShippingStatus, Category } from './types';
import { matchProductCategory, cleanUndefined } from './utils';
import { Facebook, Instagram, Twitter, AlertTriangle, X, ExternalLink, Copy, Check } from 'lucide-react';

// Firebase Imports
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [view, setView] = useState<'home' | 'catalog' | 'detail' | 'checkout' | 'orders' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Real mobile screen detection (independent of the viewport scale)
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.screen.width < 768 || window.innerWidth < 1024;
      setIsMobileScreen(isMobileUA || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isArabic, setIsArabic] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Site Settings State (Synchronized in Real-time)
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'ZEWKA',
    storeNameAr: 'زيوكا',
    tagline: 'Luxury Apparel & Accessories Boutique',
    taglineAr: 'بوتيك الملابس والإكسسوارات الفاخرة الحصرية',
    currency: 'SAR',
    vatPercent: 15,
    supportEmail: 'support@zewka.com',
    supportPhone: '+966500000000',
    heroTitle: 'THE Pinnacle of Exclusive Apparel',
    heroTitleAr: 'قمة الأناقة الفاخرة',
    heroSubtitle: 'Handcrafted luxury pieces designed for the modern elite.',
    heroSubtitleAr: 'قطع فاخرة مصنوعة يدوياً مصممة خصيصاً للنخبة العصرية.',
    heroBg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
    heroBg2: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
    heroBg3: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1600&auto=format&fit=crop',
    heroBg4: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop',
    heroLayout: 'standard', // 'standard' or 'carousel'
    maintenanceMode: false,
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
  });

  // Real-time Settings Listener
  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        setStoreSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, (error) => {
      console.error("Settings subscription error: ", error);
    });

    return () => unsubscribeSettings();
  }, []);

  // Firebase Auth and Cart Sync States
  const [user, setUser] = useState<User | null>(null);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [authError, setAuthError] = useState<any | null>(null);

  // Handle redirect result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Signed in via redirect:", result.user);
        }
      })
      .catch((error: any) => {
        console.error("Redirect auth error:", error);
        setAuthError(error);
      });
  }, []);

  // Authentication Handlers
  const handleSignIn = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Authentication failed: ", error);
      setAuthError(error);
    }
  };

  const handleSignInRedirect = async () => {
    try {
      setAuthError(null);
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Redirect Sign in failed: ", error);
      setAuthError(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed: ", error);
    }
  };

  // Real-time Reviews Listener (Publicly accessible)
  useEffect(() => {
    const reviewsColRef = collection(db, 'reviews');
    
    const unsubscribeReviews = onSnapshot(reviewsColRef, async (snapshot) => {
      const fetchedReviews: Review[] = [];
      snapshot.forEach((docSnap) => {
        fetchedReviews.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });

      fetchedReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReviews(fetchedReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => unsubscribeReviews();
  }, []);

  // Real-time Products Listener (Publicly accessible)
  useEffect(() => {
    const productsColRef = collection(db, 'products');
    
    const unsubscribeProducts = onSnapshot(productsColRef, async (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        fetchedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });

      setProducts(fetchedProducts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribeProducts();
  }, []);

  // Real-time Categories Listener (Publicly accessible)
  useEffect(() => {
    const categoriesColRef = collection(db, 'categories');
    
    const unsubscribeCategories = onSnapshot(categoriesColRef, async (snapshot) => {
      const fetchedCategories: Category[] = [];
      snapshot.forEach((docSnap) => {
        fetchedCategories.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });

      setCategories(fetchedCategories);
    }, (error) => {
      console.error("Categories subscription error: ", error);
    });

    return () => unsubscribeCategories();
  }, []);

  // Firebase Auth and User Data/Orders Listener
  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clean up previous order subscription if exists
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
      }
      
      if (currentUser) {
        setIsCartLoaded(false);
        try {
          // 1. Synchronize & Fetch user's cart
          const cartDocRef = doc(db, 'carts', currentUser.uid);
          const cartDocSnap = await getDoc(cartDocRef);
          
          if (cartDocSnap.exists()) {
            const data = cartDocSnap.data();
            setCart(data.items || []);
          } else {
            const localCartStr = localStorage.getItem('zewka_cart');
            const localCart = localCartStr ? JSON.parse(localCartStr) : [];
            await setDoc(cartDocRef, {
              userId: currentUser.uid,
              items: localCart,
              updatedAt: new Date().toISOString()
            });
            setCart(localCart);
          }
          setIsCartLoaded(true);

          // 2. Load user's orders in real-time
          const ordersQuery = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid)
          );
          
          unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            const fetchedOrders: Order[] = [];
            snapshot.forEach((docSnap) => {
              fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
            });
            fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setOrders(fetchedOrders);
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'orders');
          });
        } catch (error) {
          console.error("Error syncing on login: ", error);
          setIsCartLoaded(true);
        }
      } else {
        setIsCartLoaded(true);
        // Guest mode fallback
        const savedCart = localStorage.getItem('zewka_cart');
        const savedOrders = localStorage.getItem('zewka_orders');
        setCart(savedCart ? JSON.parse(savedCart) : []);
        setOrders(savedOrders ? JSON.parse(savedOrders) : []);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
    };
  }, []);

  // Save changes to Local Storage and Firestore Cart
  useEffect(() => {
    localStorage.setItem('zewka_cart', JSON.stringify(cart));

    if (user && isCartLoaded) {
      const updateCloudCart = async () => {
        try {
          await setDoc(doc(db, 'carts', user.uid), cleanUndefined({
            userId: user.uid,
            items: cart,
            updatedAt: new Date().toISOString()
          }));
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `carts/${user.uid}`);
        }
      };
      updateCloudCart();
    }
  }, [cart, user, isCartLoaded]);

  // Guest Only Orders local backup
  useEffect(() => {
    if (!user) {
      localStorage.setItem('zewka_orders', JSON.stringify(orders));
    }
  }, [orders, user]);

  // Simulate shipping state updates for placed orders periodically
  useEffect(() => {
    if (orders.length === 0) return;

    const interval = setInterval(() => {
      let changed = false;
      const updatedOrders = orders.map(order => {
        let nextStatus: ShippingStatus | null = null;
        if (order.shippingStatus === 'placed') {
          nextStatus = 'processing';
        } else if (order.shippingStatus === 'processing') {
          nextStatus = 'shipped';
        } else if (order.shippingStatus === 'shipped') {
          nextStatus = 'delivered';
        }

        if (nextStatus) {
          changed = true;
          const updated = { ...order, shippingStatus: nextStatus };
          
          setDoc(doc(db, 'orders', order.id), cleanUndefined(updated)).catch(err => {
            console.error("Error progressing order status in Firestore: ", err);
          });
          return updated;
        }
        return order;
      });

      if (changed && !user) {
        setOrders(updatedOrders);
        localStorage.setItem('zewka_orders', JSON.stringify(updatedOrders));
      }
    }, 40000);

    return () => clearInterval(interval);
  }, [orders, user]);

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, product.stock);
        return prevCart.map(item =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });

    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddReview = async (comment: string, rating: number, userName: string) => {
    if (!selectedProduct) return;

    const reviewId = `rev-${selectedProduct.id}-${Date.now()}`;
    let tags = [isArabic ? 'تقييم العميل' : 'Customer Review'];
    let merchantResponse = isArabic ? 'نشكرك على مراجعتك اللطيفة!' : 'Thank you for your review!';

    try {
      const response = await fetch('/api/analyze-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, rating })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.tags) tags = data.tags;
        if (data.merchantResponse) merchantResponse = data.merchantResponse;
      }
    } catch (err) {
      console.warn("Review analysis API failed, using elegant defaults: ", err);
      if (isArabic) {
        tags = ['خدمة ممتازة', 'منتج رائع'];
        merchantResponse = 'نشكرك على مشاركة رأيك القيم معنا في بوتيك زيوكا الفاخر!';
      } else {
        tags = ['Excellent Service', 'Great Product'];
        merchantResponse = 'Thank you for sharing your valuable feedback with us at ZEWKA Luxury Boutique!';
      }
    }

    const newReview: Review = {
      id: reviewId,
      userName,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
      tags,
      merchantResponse
    };

    try {
      const reviewToSave = {
        ...newReview,
        productId: selectedProduct.id,
        userId: user?.uid || 'guest',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'reviews', reviewId), cleanUndefined(reviewToSave));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  const handleCompleteCheckout = async (newOrder: Order) => {
    // Subtract stock levels in Firestore
    newOrder.items.forEach(async (item) => {
      try {
        const prodRef = doc(db, 'products', item.product.id);
        const currentStock = item.product.stock;
        const newStock = Math.max(currentStock - item.quantity, 0);
        await updateDoc(prodRef, { stock: newStock });
      } catch (error) {
        console.error("Error updating stock inside Firestore: ", error);
      }
    });

    const orderToSave = {
      ...newOrder,
      userId: user ? user.uid : 'guest',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'orders', newOrder.id), cleanUndefined(orderToSave));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
    }

    if (user) {
      try {
        await setDoc(doc(db, 'carts', user.uid), cleanUndefined({
          userId: user.uid,
          items: [],
          updatedAt: new Date().toISOString()
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `carts/${user.uid}`);
      }
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }

    setCart([]);
    setView('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter products by search & category
  const filteredProducts = products.filter(prod => {
    const matchesCategory = selectedCategory === 'all' || matchProductCategory(prod, selectedCategory, categories);
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      prod.name.toLowerCase().includes(query) ||
      prod.nameAr.includes(query) ||
      prod.description.toLowerCase().includes(query) ||
      prod.descriptionAr.includes(query) ||
      prod.categoryAr.includes(query);

    return matchesCategory && matchesSearch;
  });

  // دالة مساعدة للحصول على صورة الفئة
  const getCategoryImage = (cat: Category): string => {
    // إذا كانت الفئة تحتوي على صورة مخصصة، استخدمها
    if (cat.image) {
      return cat.image;
    }
    // وإلا ابحث عن أول منتج في الفئة
    const catProduct = products.find(p => matchProductCategory(p, cat.id, categories));
    if (catProduct?.image) {
      return catProduct.image;
    }
    // صورة افتراضية
    return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop';
  };

  if (storeSettings.maintenanceMode && !(user && user.email?.trim().toLowerCase() === 'amrzikas20@gmail.com')) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans text-center relative selection:bg-indigo-500/30">
        {/* Absolute branding background blur */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-lg space-y-6">
          <span className="text-3xl sm:text-4xl font-black tracking-widest text-indigo-400">
            ZEWKA
          </span>
          <div className="w-12 h-0.5 bg-indigo-500 mx-auto" />
          
          <div className="space-y-4 pt-4">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide leading-relaxed">
              {isArabic 
                ? 'نعمل حالياً على تحديث مقتنياتنا الفاخرة' 
                : 'Elevating Our Curation Collections'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {isArabic 
                ? 'نحن نقوم الآن بإجراء بعض التحديثات الدورية لإضفاء مزيد من الرقي على مجموعاتنا وموقعنا. سنكون جاهزين لاستقبالكم وتلبية طلباتكم الراقية قريباً جداً.' 
                : 'We are currently performing scheduled enhancements to our boutique curation. We will be back online with a brand new refined experience very soon.'}
            </p>
          </div>

          <div className="pt-8 flex flex-col gap-3 justify-center items-center">
            <button
              onClick={handleSignIn}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {isArabic ? 'تسجيل دخول المشرف' : 'Administrator Access'}
            </button>
            <p className="text-[10px] text-slate-500 font-mono">
              {isArabic ? 'يتطلب بريد إلكتروني معتمد للأدمن' : 'Requires authorized admin credentials'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FBFBFA] min-h-screen text-[#1D1D1C] flex flex-col selection:bg-[#C5A880]/30 select-none">
      {/* Header bar */}
      <Header
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => setView('orders')}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          if (query.trim() && view !== 'catalog') {
            setView('catalog');
          }
        }}
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubcategory('');
          setView('catalog');
        }}
        selectedSubcategory={selectedSubcategory}
        onSubcategoryChange={setSelectedSubcategory}
        isArabic={isArabic}
        onToggleLang={() => setIsArabic(!isArabic)}
        currentView={view}
        onViewChange={(targetView) => {
          setView(targetView);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        categories={categories}
        currency={storeSettings.currency}
      />

      {/* Main Container Section */}
      <main className="flex-1">
        {view === 'home' && (
          <div className="space-y-16 pb-24">
            {/* Hero Section Banner */}
            <Hero
              isArabic={isArabic}
              onExploreClick={() => {
                setView('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAiClick={() => {
                const trigger = document.getElementById('ai-trigger-button');
                if (trigger) {
                  trigger.click();
                } else {
                  const box = document.getElementById('ai-chatbox-panel');
                  if (box) box.style.display = 'flex';
                }
              }}
              heroTitle={storeSettings.heroTitle}
              heroTitleAr={storeSettings.heroTitleAr}
              heroSubtitle={storeSettings.heroSubtitle}
              heroSubtitleAr={storeSettings.heroSubtitleAr}
              heroBg={storeSettings.heroBg}
              heroBg2={storeSettings.heroBg2}
              heroBg3={storeSettings.heroBg3}
              heroBg4={storeSettings.heroBg4}
              heroLayout={storeSettings.heroLayout}
            />

            {/* Curated Categories Visual Blocks - Dynamic from Firestore */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="curated-categories-block">
              <div className="text-center space-y-2 mb-10" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] text-indigo-600 uppercase">
                  {isArabic ? 'تشكيلات منسقة بعناية' : 'Curated Masterpieces'}
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-slate-800 font-sans tracking-tight">
                  {isArabic ? 'تصفح حسب فئات زيوكا الفاخرة' : 'EXPLORE BY ZEWKA CATEGORY'}
                </h2>
                <p className="text-xs text-slate-400 max-w-lg mx-auto font-medium">
                  {isArabic 
                    ? 'اكتشف مجموعتنا الحصرية المختارة من أرقى خطوط الموضة، العناية، الديكور المنزلي، والتقنيات' 
                    : 'Discover our exclusive coordinate layers covering fashion, wellness, design, and tech'}
                </p>
              </div>

              <div 
                className={`${isMobileScreen ? 'flex overflow-x-auto pb-4 gap-6 scroll-smooth snap-x snap-mandatory scrollbar-thin' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}`}
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                {categories.length > 0 ? (
                  categories.map((cat, index) => {
                    const imageUrl = getCategoryImage(cat);
                    
                    // Dynamic grid and height span classes for a luxurious, editorial Bento Layout
                    let spanClass = 'w-full h-96';
                    let titleSize = 'text-lg sm:text-xl';
                    let isFeaturedBento = false;

                    if (!isMobileScreen) {
                      const total = categories.length;
                      if (total === 1) {
                        spanClass = 'col-span-full h-[500px]';
                        titleSize = 'text-2xl sm:text-3xl lg:text-4xl';
                        isFeaturedBento = true;
                      } else if (total === 2) {
                        spanClass = 'col-span-1 h-[480px]';
                        titleSize = 'text-xl sm:text-2xl';
                      } else {
                        // 3 or more categories
                        if (index === 0) {
                          spanClass = 'col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2 h-[500px] lg:h-[550px]';
                          titleSize = 'text-2xl sm:text-3xl lg:text-4xl';
                          isFeaturedBento = true;
                        } else if (index === 1) {
                          spanClass = 'col-span-1 lg:row-span-2 h-[500px] lg:h-[550px]';
                          titleSize = 'text-xl sm:text-2xl';
                          isFeaturedBento = true;
                        } else {
                          spanClass = 'col-span-1 h-[263px]';
                          titleSize = 'text-base sm:text-lg lg:text-xl';
                        }
                      }
                    } else {
                      spanClass = 'min-w-[290px] flex-shrink-0 snap-start h-[420px]';
                    }

                    return (
                      <motion.div
                        key={cat.id}
                        whileHover={{ y: -6, scale: 1.01 }}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedSubcategory('');
                          setView('catalog');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`relative rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-indigo-600/10 transition-all duration-500 border-2 border-transparent hover:border-indigo-100/40 ${spanClass}`}
                      >
                        {/* Radial Hover glow */}
                        <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_bottom_left,rgba(197,168,128,0.15),transparent_60%)] transition-opacity duration-700 pointer-events-none" />

                        {/* Solid refined gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-900/10 z-10 transition-colors duration-500 group-hover:from-slate-950/95" />
                        
                        <img
                          src={imageUrl}
                          alt={isArabic ? cat.nameAr : cat.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />

                        <div className="absolute inset-0 p-8 z-20 flex flex-col justify-end h-full text-white" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                          <span className="text-[9px] font-black tracking-widest text-[#C5A880] uppercase bg-white/10 px-3 py-1 rounded-full w-max mb-3 backdrop-blur-md border border-white/5">
                            {cat.subcategories && cat.subcategories.length > 0 
                              ? `${cat.subcategories.length} ${isArabic ? 'تصنيفات فرعية' : 'Subcategories'}`
                              : isArabic ? 'مجموعة حصرية' : 'Exclusive Collection'}
                          </span>
                          
                          <h3 className={`${titleSize} font-black tracking-wide leading-tight group-hover:text-indigo-200 transition-colors duration-300`}>
                            {isArabic ? cat.nameAr : cat.name}
                          </h3>
                          
                          <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-2 leading-relaxed max-w-md opacity-85 group-hover:opacity-100 transition-opacity duration-300">
                            {cat.subcategories && cat.subcategories.length > 0
                              ? isArabic 
                                ? `تشمل أرقى ${cat.subcategories.slice(0, 3).map(s => s.nameAr).join('، ')}${cat.subcategories.length > 3 ? '...' : ''} المصممة لتلائم تطلعاتك الفاخرة.`
                                : `Including premier selections of ${cat.subcategories.slice(0, 3).map(s => s.name).join(', ')}${cat.subcategories.length > 3 ? '...' : ''} tailored to your premium lifestyle.`
                              : isArabic
                                ? 'استكشف قطعنا الفاخرة المنسقة بعناية لتمثل قمة الأناقة والجودة العالية.'
                                : 'Explore our hand-curated premium pieces representing the absolute pinnacle of elite design and quality.'}
                          </p>

                          {/* Subcategories interactive capsules */}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3.5 z-30 relative max-w-full">
                              {cat.subcategories.slice(0, isFeaturedBento ? 4 : 2).map((sub) => (
                                <span
                                  key={sub.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(cat.id);
                                    setSelectedSubcategory(sub.id);
                                    setView('catalog');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-white/10 hover:bg-[#C5A880] hover:text-slate-950 text-white backdrop-blur-md border border-white/5 transition-all duration-300 hover:scale-105"
                                >
                                  {isArabic ? sub.nameAr : sub.name}
                                </span>
                              ))}
                              {cat.subcategories.length > (isFeaturedBento ? 4 : 2) && (
                                <span className="px-2 py-0.5 text-[9px] font-black rounded-lg bg-white/5 text-slate-300 backdrop-blur-md border border-white/5">
                                  +{cat.subcategories.length - (isFeaturedBento ? 4 : 2)}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-5 flex items-center gap-1.5 text-xs font-black text-[#C5A880] group-hover:text-white transition-colors duration-300">
                            <span>{isArabic ? 'استكشف المجموعة' : 'Explore Curation'}</span>
                            <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-400 text-sm">
                      {isArabic 
                        ? '⚠️ لم يتم إضافة أي فئات بعد. يرجى استخدام لوحة التحكم لإضافة فئات جديدة.' 
                        : '⚠️ No categories added yet. Please use the admin dashboard to add new categories.'}
                    </p>
                    <button
                      onClick={() => setView('admin')}
                      className="mt-4 px-6 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      {isArabic ? 'فتح لوحة التحكم' : 'Open Admin Dashboard'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Curation Showcase / Bestsellers */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between border-b border-indigo-50/80 pb-5 mb-10 gap-3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <div className="text-center md:text-start">
                  <span className="text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase block mb-1">
                    {isArabic ? 'مقتنيات حصرية متميزة' : 'EXCLUSIVE HIGHLIGHTS'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-800 font-sans">
                    {isArabic ? 'المنتجات المميزة' : 'FEATURED PRODUCTS'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-md font-medium">
                    {isArabic ? 'مجموعة مختارة بعناية فائقة تمثل جوهر الفخامة الهادئة والجودة الحرفية الفريدة' : 'Selected items representing the absolute pinnacle of silent luxury'}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setView('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-indigo-600/5"
                >
                  {isArabic ? 'عرض كافة المنتجات' : 'Browse All Curation'}
                </button>
              </div>

              <div 
                className={`${isMobileScreen ? 'flex overflow-x-auto pb-4 gap-6 scroll-smooth snap-x snap-mandatory scrollbar-thin' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8'}`}
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                {products.filter(p => p.isFeatured).slice(0, 4).map(prod => (
                  <div key={prod.id} className={isMobileScreen ? 'min-w-[285px] flex-shrink-0 snap-start animate-fade-in' : 'w-full'}>
                    <ProductCard
                      product={prod}
                      onSelect={handleSelectProduct}
                      onAddToCart={handleAddToCart}
                      isArabic={isArabic}
                      currency={storeSettings.currency}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Category Showcase Sections - Dynamic from Firestore */}
            {categories.map((cat, idx) => {
              const catProducts = products.filter(p => matchProductCategory(p, cat.id, categories));
              const isEven = idx % 2 === 0;
              
              // إذا لم يكن هناك منتجات في هذه الفئة، تخطى العرض
              if (catProducts.length === 0) return null;

              const imageUrl = getCategoryImage(cat);

              return (
                <div key={cat.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {isMobileScreen ? (
                    /* Mobile Single Horizontal Swipe Track */
                    <div className="space-y-4" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-black text-slate-800">
                            {isArabic ? cat.nameAr : cat.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {isArabic ? 'اسحب لمشاهدة الكل' : 'Swipe to see all'}
                        </span>
                      </div>
                      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory scrollbar-thin">
                        {/* 1. The Category Banner Card adapted for mobile track */}
                        <div className="min-w-[240px] max-w-[240px] flex-shrink-0 snap-start rounded-[2.5rem] relative overflow-hidden text-white bg-slate-900 group h-[350px] p-6 flex flex-col justify-between shadow-md">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20 z-10" />
                          <img 
                            src={imageUrl} 
                            alt={isArabic ? cat.nameAr : cat.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="relative z-20 space-y-1">
                            <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-500/20 w-max block">
                              {isArabic ? 'تشكيلة مميزة' : 'FEATURED'}
                            </span>
                            <h3 className="text-base font-black font-sans leading-tight">
                              {isArabic ? cat.nameAr : cat.name}
                            </h3>
                          </div>
                          <div className="relative z-20">
                            <button
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setView('catalog');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="w-full py-2.5 px-4 bg-white hover:bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <span>{isArabic ? 'عرض الفئة' : 'Explore'}</span>
                              <span className={isArabic ? 'rotate-180' : ''}>→</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. The Products in this Category */}
                        {catProducts.map(prod => (
                          <div key={prod.id} className="min-w-[220px] max-w-[220px] flex-shrink-0 snap-start animate-fade-in">
                            <ProductCard
                              product={prod}
                              onSelect={handleSelectProduct}
                              onAddToCart={handleAddToCart}
                              isArabic={isArabic}
                              isCompact={true}
                              currency={storeSettings.currency}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Desktop Grid layout */
                    <div 
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
                      style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    >
                      {/* Category Banner Card */}
                      <div className={`lg:col-span-4 flex flex-col justify-between p-8 rounded-[2.5rem] relative overflow-hidden text-white bg-slate-900 group min-h-[350px] lg:min-h-full ${
                        isEven ? 'lg:order-first' : 'lg:order-last'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20 z-10" />
                        <img 
                          src={imageUrl} 
                          alt={isArabic ? cat.nameAr : cat.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />

                        <div className="relative z-20 space-y-3">
                          <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20 w-max block">
                            {isArabic ? 'فئة متميزة' : 'FEATURED CATEGORY'}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black font-sans leading-tight">
                            {isArabic ? cat.nameAr : cat.name}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {cat.subcategories && cat.subcategories.length > 0
                              ? isArabic 
                                ? `يشمل ${cat.subcategories.length} فئات فرعية: ${cat.subcategories.map(s => s.nameAr).join('، ')}`
                                : `Includes ${cat.subcategories.length} subcategories: ${cat.subcategories.map(s => s.name).join(', ')}`
                              : isArabic
                                ? 'مجموعة متنوعة من المنتجات الفاخرة'
                                : 'A diverse collection of luxury products'}
                          </p>
                        </div>

                        <div className="relative z-20 pt-6">
                          <button
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setView('catalog');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-3.5 px-5 bg-white hover:bg-indigo-50 text-indigo-600 text-xs font-black rounded-2xl shadow-lg shadow-white/5 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>{isArabic ? `عرض كل ${cat.nameAr}` : `View All ${cat.name}`}</span>
                            <span className={isArabic ? 'rotate-180' : ''}>→</span>
                          </button>
                        </div>
                      </div>

                      {/* Associated Category Products */}
                      <div className="lg:col-span-8 flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {isArabic ? 'اسحب لتصفح المنتجات' : 'Swipe / Scroll to browse'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                const el = document.getElementById(`strip-${cat.id}`);
                                if (el) el.scrollBy({ left: isArabic ? 240 : -240, behavior: 'smooth' });
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <span className="block text-xs font-black">←</span>
                            </button>
                            <button 
                              onClick={() => {
                                const el = document.getElementById(`strip-${cat.id}`);
                                if (el) el.scrollBy({ left: isArabic ? -240 : 240, behavior: 'smooth' });
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <span className="block text-xs font-black">→</span>
                            </button>
                          </div>
                        </div>

                        <div 
                          className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          id={`strip-${cat.id}`}
                        >
                          {catProducts.map(prod => (
                            <div key={prod.id} className="min-w-[190px] sm:min-w-[220px] max-w-[220px] flex-shrink-0 snap-start animate-fade-in">
                              <ProductCard
                                product={prod}
                                onSelect={handleSelectProduct}
                                onAddToCart={handleAddToCart}
                                isArabic={isArabic}
                                isCompact={true}
                                currency={storeSettings.currency}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Experience Bento Block */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div 
                className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-14 overflow-hidden relative shadow-2xl animate-fade-in"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-5 space-y-5 text-center lg:text-start">
                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/60 px-3.5 py-1.5 rounded-full border border-indigo-500/20">
                      {isArabic ? 'فلسفة بوتيك زيوكا' : 'The ZEWKA Philosophy'}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                      {isArabic ? 'الفخامة الهادئة بلمسة معاصرة غنية' : 'Quiet Luxury with Modern Refinement'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                      {isArabic 
                        ? 'في زيوكا، نحن لا نبيع مجرد مقتنيات. نحن نصمم تجارب جمالية متكاملة تضفي طابعاً من الرقي والأصالة على تفاصيل حياتك اليومية، من الملابس المنتقاة بعناية لخطوط العناية العضوية الفريدة.'
                        : 'At ZEWKA, we define lifestyle coordinates. We cultivate custom aesthetic coordinates to reflect modern quiet luxury, handcrafted with meticulous tailoring and care.'}
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setView('catalog');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer transition-colors"
                      >
                        {isArabic ? 'ابدأ التسوق الفاخر' : 'Start Luxe Shopping'}
                      </button>
                      <button
                        onClick={() => {
                          const trigger = document.getElementById('ai-trigger-button');
                          if (trigger) trigger.click();
                        }}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl cursor-pointer transition-colors border border-slate-700"
                      >
                        {isArabic ? 'استشارة المساعد الذكي' : 'Consult AI Stylist'}
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      {
                        titleAr: 'حرفية إيطالية يدوية',
                        titleEn: 'Italian Craftsmanship',
                        descAr: 'حياكة يدوية دقيقة وتفاصيل تعيش لأجيال متعاقبة.',
                        descEn: 'Meticulous details and fine tailoring to endure generations.',
                        icon: '🧵'
                      },
                      {
                        titleAr: 'مواد عضوية 100%',
                        titleEn: 'Organic Materials',
                        descAr: 'صوف ميرينو طبيعي، زيوت مستخلصة نقية، وسيراميك يدوي صحي.',
                        descEn: 'Pure merino fabrics, distilled natural aromatic oils.',
                        icon: '🌿'
                      },
                      {
                        titleAr: 'توصيل عابر للحدود',
                        titleEn: 'Express Logistics',
                        descAr: 'تغليف هدايا فاخر وشحن جوي آمن مع تتبع ذكي متكامل.',
                        descEn: 'Premium luxury packaging and fully tracked courier.',
                        icon: '✈️'
                      }
                    ].map((item, index) => (
                      <div 
                        key={index} 
                        className="p-6 bg-slate-800/40 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all duration-300"
                      >
                        <span className="text-3xl block mb-4">{item.icon}</span>
                        <h4 className="text-sm font-black mb-1.5">
                          {isArabic ? item.titleAr : item.titleEn}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          {isArabic ? item.descAr : item.descEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'catalog' && (
          <div className="space-y-4 pb-24 animate-fade-in">
            <AllCollection
              products={products}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setSelectedSubcategory('');
              }}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={setSelectedSubcategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              isArabic={isArabic}
              categories={categories}
              currency={storeSettings.currency}
            />
          </div>
        )}

        {view === 'admin' && (
          <AdminDashboard
            onClose={() => setView('home')}
            isArabic={isArabic}
            user={user}
          />
        )}

        {view === 'detail' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            reviews={reviews}
            onBack={() => setView('catalog')}
            onAddToCart={handleAddToCart}
            isArabic={isArabic}
            onAddReview={handleAddReview}
            allProducts={products}
            onSelectProduct={handleSelectProduct}
            currency={storeSettings.currency}
          />
        )}

        {view === 'checkout' && (
          <CheckoutWizard
            cart={cart}
            subtotal={cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)}
            discountRate={0}
            couponCode=""
            onComplete={handleCompleteCheckout}
            onCancel={() => setView('catalog')}
            isArabic={isArabic}
            currency={storeSettings.currency}
          />
        )}

        {view === 'orders' && (
          <OrdersHistory
            orders={orders}
            onClose={() => setView('catalog')}
            isArabic={isArabic}
            user={user}
            onSignIn={handleSignIn}
            currency={storeSettings.currency}
          />
        )}
      </main>

      {/* Cart Side Slider Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={(discRate, code) => {
          setIsCartOpen(false);
          setView('checkout');
        }}
        isArabic={isArabic}
        currency={storeSettings.currency}
      />

      {/* Floating Vertical Social Rail */}
      <div className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5 sm:gap-3.5 bg-white/80 hover:bg-white/95 backdrop-blur-md border border-slate-200/50 p-2 rounded-2xl shadow-xl transition-all duration-300" id="social-vertical-rail">
        {storeSettings.facebook && (
          <motion.a
            whileHover={{ scale: 1.15, rotate: 5 }}
            href={storeSettings.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50/50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
            title="Facebook"
          >
            <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.a>
        )}
        {storeSettings.instagram && (
          <motion.a
            whileHover={{ scale: 1.15, rotate: -5 }}
            href={storeSettings.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50/50 hover:bg-pink-50 border border-slate-100 hover:border-pink-200 flex items-center justify-center text-slate-500 hover:text-pink-600 transition-colors"
            title="Instagram"
          >
            <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.a>
        )}
        {storeSettings.twitter && (
          <motion.a
            whileHover={{ scale: 1.15, rotate: 5 }}
            href={storeSettings.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            title="Twitter / X"
          >
            <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.a>
        )}
        {storeSettings.tiktok && (
          <motion.a
            whileHover={{ scale: 1.15, rotate: -5 }}
            href={storeSettings.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50/50 hover:bg-slate-100 border border-slate-100 hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            title="TikTok"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.54-4.06-1.42-.45-.34-.83-.73-1.15-1.18V14.5c0 1.78-.49 3.58-1.57 4.97-1.44 1.83-3.72 2.92-6.02 2.9C6.8 22.31 4 20.08 3.12 17.3c-.92-2.91.07-6.39 2.5-8.23 1.54-1.16 3.51-1.63 5.42-1.39V11.8c-1.04-.3-2.19-.15-3.09.43-.9.58-1.45 1.62-1.43 2.72.03 1.84 1.77 3.33 3.59 3.12 1.4-.16 2.52-1.25 2.76-2.63.15-.84.03-11.45.03-11.45.36.03.73.02 1.1-.02-.1-.01-.1-.01-.1-.01z"/>
            </svg>
          </motion.a>
        )}
      </div>

      {/* Corner Floating Smart shopping consultant chatbot */}
      <AiAssistant isArabic={isArabic} />

      {/* Standard luxury footer */}
      <footer className="bg-[#1D1D1C] text-[#8E8D8A] py-12 border-t border-white/5" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
          <div className="space-y-3">
            <span className="text-2xl font-extrabold tracking-[0.2em] text-white">ZEWKA</span>
            <p className="text-xs text-[#8E8D8A] max-w-sm mx-auto md:mx-0 leading-relaxed">
              {isArabic 
                ? 'بوتيك زيوكا يقدم أفخر المنتجات العصرية المنسقة بلمسة من الفخامة الهادئة والتفاصيل اليدوية الإيطالية الدقيقة.' 
                : 'ZEWKA Boutique presents the finest lifestyle coordinates styled with quiet luxury and meticulous hand-tailoring.'}
            </p>
          </div>
          <div>
            <h4 className="text-white text-xs font-bold tracking-wider uppercase mb-3">{isArabic ? 'مجموعاتنا' : 'Categories'}</h4>
            <ul className="text-xs space-y-2 text-[#8E8D8A]">
              {categories.slice(0, 4).map(cat => (
                <li 
                  key={cat.id} 
                  className="hover:text-white cursor-pointer transition-colors flex items-center gap-2"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setView('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {cat.image && (
                    <img 
                      src={cat.image} 
                      alt="" 
                      className="w-4 h-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span>{isArabic ? cat.nameAr : cat.name}</span>
                </li>
              ))}
              {categories.length === 0 && (
                <li>{isArabic ? 'لا توجد فئات' : 'No categories'}</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-white text-xs font-bold tracking-wider uppercase mb-3">{isArabic ? 'الدعم والمساعدة' : 'Client Services'}</h4>
            <ul className="text-xs space-y-2 text-[#8E8D8A]">
              {storeSettings.supportPhone && (
                <li>
                  {isArabic ? 'الهاتف: ' : 'Phone: '}
                  <a href={`tel:${storeSettings.supportPhone}`} className="hover:text-white transition-colors font-mono">
                    {storeSettings.supportPhone}
                  </a>
                </li>
              )}
              {storeSettings.supportEmail && (
                <li>
                  {isArabic ? 'البريد الإلكتروني: ' : 'Email: '}
                  <a href={`mailto:${storeSettings.supportEmail}`} className="hover:text-white transition-colors">
                    {storeSettings.supportEmail}
                  </a>
                </li>
              )}
              <li>{isArabic ? 'شروط التوصيل والاسترجاع' : 'Delivery & Returns policy'}</li>
              <li>{isArabic ? 'سياسة الخصوصية والأمان' : 'Secure privacy rules'}</li>
              <li>{isArabic ? 'حقوق الطبع والنشر © 2026 زيوكا' : 'Copyright © 2026 ZEWKA. All Rights Reserved.'}</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* Diagnostics and Fallback Login Modal (Vercel domain issue helper) */}
      {authError && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden text-right"
          >
            {/* Header */}
            <div className="bg-indigo-50/50 p-6 border-b border-indigo-50 flex items-center justify-between" style={{ flexDirection: isArabic ? 'row' : 'row-reverse' }}>
              <div className="flex items-center gap-3" style={{ flexDirection: isArabic ? 'row' : 'row-reverse' }}>
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
                  <h3 className="text-sm font-black text-slate-950">
                    {isArabic ? 'تنبيه إعدادات تسجيل الدخول' : 'Login Setup Alert'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {isArabic ? 'تشخيص خطأ Firebase Auth على Vercel' : 'Diagnostics for Firebase Auth on Vercel'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAuthError(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {/* Detailed error if domain is unauthorized */}
              {(authError?.code === 'auth/unauthorized-domain' || authError?.message?.includes('unauthorized-domain')) ? (
                <div className="space-y-3.5">
                  <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl text-xs text-red-950 font-bold leading-relaxed">
                    {isArabic 
                      ? `عذراً، لم يتم السماح بتسجيل الدخول للنطاق الحالي (${window.location.hostname}) في إعدادات مشروع Firebase الخاص بك.`
                      : `The domain "${window.location.hostname}" is not authorized in your Firebase Project for OAuth sign-in.`}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900">
                      {isArabic ? 'كيفية حل المشكلة بخطوات بسيطة:' : 'How to resolve in 3 simple steps:'}
                    </h4>
                    
                    <ol className="text-xs text-slate-600 font-bold space-y-2 list-decimal list-inside bg-slate-50 p-4 rounded-2xl leading-relaxed">
                      <li>
                        {isArabic ? 'انسخ النطاق الحالي الخاص بموقعك:' : 'Copy your current website domain:'}
                        <div className="mt-2 flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 px-3.5" style={{ flexDirection: isArabic ? 'row-reverse' : 'row' }}>
                          <span className="font-mono text-[11px] text-slate-800 select-all truncate flex-1 text-center">{window.location.hostname}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.hostname);
                              setCopiedDomain(true);
                              setTimeout(() => setCopiedDomain(false), 2000);
                            }}
                            className="p-1.5 hover:bg-slate-50 rounded-lg text-indigo-600 font-black flex items-center gap-1 text-[10px] border border-indigo-50 shrink-0"
                          >
                            {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedDomain ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ النطاق' : 'Copy')}</span>
                          </button>
                        </div>
                      </li>
                      <li>
                        {isArabic 
                          ? 'انتقل إلى لوحة تحكم Firebase (Firebase Console) الخاصة بمشروعك.' 
                          : 'Go to your Firebase Console project.'}
                      </li>
                      <li>
                        {isArabic 
                          ? 'اذهب إلى Authentication 🡒 Settings 🡒 Authorized domains واضغط على Add Domain، ثم الصق النطاق الذي نسخته واحفظ التغييرات.' 
                          : 'Navigate to Authentication ➔ Settings ➔ Authorized domains, click "Add Domain", paste the domain, and save.'}
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (authError?.code === 'auth/popup-blocked' || authError?.message?.includes('popup-blocked')) ? (
                <div className="space-y-3.5">
                  <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl text-xs text-amber-950 font-bold leading-relaxed">
                    {isArabic 
                      ? 'تم حظر النوافذ المنبثقة بواسطة متصفحك. يرجى تفعيل السماح بالنوافذ المنبثقة، أو تجربة استخدام طريقة تسجيل الدخول بإعادة التوجيه (Redirect) المتاحة بالأسفل.'
                      : 'The login popup was blocked by your browser. Please allow popups for this site, or use the Redirect Sign-In method below.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="p-4 bg-red-50/70 border border-red-100 rounded-2xl text-xs text-red-950 font-bold leading-relaxed">
                    {isArabic 
                      ? 'حدث خطأ أثناء الاتصال بـ Firebase Auth.' 
                      : 'An error occurred while connecting to Firebase Auth.'}
                    <div className="mt-2 font-mono text-[10px] text-red-700 bg-white p-2.5 rounded-xl border border-red-100/50 break-all max-h-24 overflow-y-auto text-left">
                      Code: {authError?.code || 'N/A'}<br />
                      Message: {authError?.message || String(authError)}
                    </div>
                  </div>
                </div>
              )}

              {/* Try Redirect Sign In as alternative */}
              <div className="p-4 bg-indigo-50/30 border border-indigo-100/30 rounded-2xl space-y-2">
                <h4 className="text-xs font-black text-indigo-950">
                  {isArabic ? 'حل فوري بديل (عبر إعادة التوجيه):' : 'Instant Alternative (Redirect Sign-In):'}
                </h4>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  {isArabic 
                    ? 'في بعض المتصفحات أو الأجهزة المحمولة، تنجح طريقة "إعادة التوجيه" عندما تفشل النوافذ المنبثقة. اضغط على الزر أدناه لتجربتها.'
                    : 'In some mobile browsers or iframe contexts, the redirect method works when popups are blocked. Click below to try.'}
                </p>
                <button
                  type="button"
                  onClick={handleSignInRedirect}
                  className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تسجيل الدخول عبر إعادة التوجيه' : 'Try Redirect Sign-In'}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}