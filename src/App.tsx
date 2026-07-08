import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import CheckoutWizard from './components/CheckoutWizard';
import AiAssistant from './components/AiAssistant';
import OrdersHistory from './components/OrdersHistory';
import AllCollection from './components/AllCollection';

import { PRODUCTS, INITIAL_REVIEWS } from './data';
import { CartItem, Product, Review, Order, ShippingStatus, Category } from './types';

// Firebase Imports
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import AdminDashboard from './components/AdminDashboard';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'apparel',
    name: 'Luxury Apparel',
    nameAr: 'الملابس والموضة',
    subcategories: [
      { id: 'sweatshirts', name: 'Premium Sweatshirts', nameAr: 'سويت شيرتات راقية' },
      { id: 'tshirts', name: 'Artisan Tees', nameAr: 'تيشرتات مميزة' },
      { id: 'caps', name: 'Designer Caps', nameAr: 'قبعات مصممة' }
    ]
  },
  {
    id: 'wellness',
    name: 'Aromatherapy & Wellness',
    nameAr: 'العناية والعطور',
    subcategories: [
      { id: 'perfumes', name: 'Niche Perfumes', nameAr: 'عطور نادرة' },
      { id: 'candles', name: 'Scented Candles', nameAr: 'شموع معطرة' }
    ]
  },
  {
    id: 'home',
    name: 'Artisan Home Decor',
    nameAr: 'المنزل العصري',
    subcategories: [
      { id: 'vases', name: 'Ceramic Vases', nameAr: 'مزهريات سيراميك' },
      { id: 'cushions', name: 'Bespoke Cushions', nameAr: 'وسائد فاخرة' }
    ]
  },
  {
    id: 'tech',
    name: 'Bespoke Tech Accents',
    nameAr: 'إكسسوارات تقنية',
    subcategories: [
      { id: 'cases', name: 'Leather Cases', nameAr: 'حافظات جلدية' },
      { id: 'stands', name: 'Wooden Stands', nameAr: 'مساند خشبية' }
    ]
  }
];

export default function App() {
  const [view, setView] = useState<'home' | 'catalog' | 'detail' | 'checkout' | 'orders' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isArabic, setIsArabic] = useState(true); // Defaults to Arabic as requested by user
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Firebase Auth and Cart Sync States
  const [user, setUser] = useState<User | null>(null);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Authentication Handlers
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication failed: ", error);
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
      let fetchedReviews: Review[] = [];
      snapshot.forEach((docSnap) => {
        fetchedReviews.push(docSnap.data() as Review);
      });
      
      if (fetchedReviews.length === 0) {
        // Seed initial reviews to Firestore if database is empty AND user is admin
        if (auth.currentUser?.email?.toLowerCase() === 'amrzikas20@gmail.com') {
          try {
            for (const rev of INITIAL_REVIEWS) {
              const rId = rev.id;
              await setDoc(doc(db, 'reviews', rId), {
                ...rev,
                productId: PRODUCTS[0].id,
                userId: 'seeded-system-user',
                createdAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error("Error seeding default reviews: ", error);
          }
        } else {
          // Fallback to local INITIAL_REVIEWS
          setReviews(INITIAL_REVIEWS);
        }
      } else {
        // Sort reviews by date descending
        fetchedReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setReviews(fetchedReviews);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reviews');
    });

    return () => unsubscribeReviews();
  }, []);

  // Real-time Products Listener (Publicly accessible)
  useEffect(() => {
    const productsColRef = collection(db, 'products');
    
    const unsubscribeProducts = onSnapshot(productsColRef, async (snapshot) => {
      let fetchedProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        fetchedProducts.push(docSnap.data() as Product);
      });
      
      if (fetchedProducts.length === 0) {
        // Seed initial products to Firestore if empty AND user is admin
        if (auth.currentUser?.email?.toLowerCase() === 'amrzikas20@gmail.com') {
          try {
            for (const prod of PRODUCTS) {
              await setDoc(doc(db, 'products', prod.id), prod);
            }
          } catch (error) {
            console.error("Error seeding default products: ", error);
          }
        } else {
          // Fallback to local PRODUCTS
          setProducts(PRODUCTS);
        }
      } else {
        setProducts(fetchedProducts);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribeProducts();
  }, []);

  // Real-time Categories Listener (Publicly accessible)
  useEffect(() => {
    const categoriesColRef = collection(db, 'categories');
    
    const unsubscribeCategories = onSnapshot(categoriesColRef, async (snapshot) => {
      let fetchedCategories: Category[] = [];
      snapshot.forEach((docSnap) => {
        fetchedCategories.push(docSnap.data() as Category);
      });
      
      if (fetchedCategories.length === 0) {
        // Seed default categories to Firestore if empty AND user is admin
        if (auth.currentUser?.email?.toLowerCase() === 'amrzikas20@gmail.com') {
          try {
            for (const cat of DEFAULT_CATEGORIES) {
              await setDoc(doc(db, 'categories', cat.id), cat);
            }
          } catch (error) {
            console.error("Error seeding default categories: ", error);
          }
        } else {
          // Fallback to default categories
          setCategories(DEFAULT_CATEGORIES);
        }
      } else {
        setCategories(fetchedCategories);
      }
    }, (error) => {
      console.error("Categories subscription error: ", error);
    });

    return () => unsubscribeCategories();
  }, []);

  // Firebase Auth and User Data/Orders Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
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
          
          const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            const fetchedOrders: Order[] = [];
            snapshot.forEach((docSnap) => {
              fetchedOrders.push(docSnap.data() as Order);
            });
            fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setOrders(fetchedOrders);
          }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'orders');
          });

          return () => {
            unsubscribeOrders();
          };
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

    return () => unsubscribeAuth();
  }, []);

  // Save changes to Local Storage and Firestore Cart
  useEffect(() => {
    localStorage.setItem('zewka_cart', JSON.stringify(cart));

    if (user && isCartLoaded) {
      const updateCloudCart = async () => {
        try {
          await setDoc(doc(db, 'carts', user.uid), {
            userId: user.uid,
            items: cart,
            updatedAt: new Date().toISOString()
          });
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
          
          setDoc(doc(db, 'orders', order.id), updated).catch(err => {
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
    }, 40000); // Progress shipping state every 40 seconds

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

    // Save to Firestore
    try {
      const reviewToSave = {
        ...newReview,
        productId: selectedProduct.id,
        userId: user?.uid || 'guest',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'reviews', reviewId), reviewToSave);
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

    // Save to Firestore for both logged-in users and guests
    try {
      await setDoc(doc(db, 'orders', newOrder.id), orderToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${newOrder.id}`);
    }

    if (user) {
      // Empty user cart in Firestore
      try {
        await setDoc(doc(db, 'carts', user.uid), {
          userId: user.uid,
          items: [],
          updatedAt: new Date().toISOString()
        });
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
  const filteredProducts = (products.length > 0 ? products : PRODUCTS).filter(prod => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      prod.name.toLowerCase().includes(query) ||
      prod.nameAr.includes(query) ||
      prod.description.toLowerCase().includes(query) ||
      prod.descriptionAr.includes(query) ||
      prod.categoryAr.includes(query);

    return matchesCategory && matchesSearch;
  });

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
            />

            {/* Curated Categories Visual Blocks */}
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                {[
                  {
                    id: 'apparel',
                    titleAr: 'الملابس والموضة',
                    titleEn: 'Apparel & Fashion',
                    descAr: 'معاطف من الصوف الإيطالي وحقائب جلدية مخيطة يدويًا',
                    descEn: 'Premium merino coats and hand-stitched full-grain bags',
                    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
                    badgeAr: 'فخامة هادئة',
                    badgeEn: 'Quiet Luxury'
                  },
                  {
                    id: 'wellness',
                    titleAr: 'العناية والعطور الطبيعية',
                    titleEn: 'Wellness & Scents',
                    descAr: 'زيوت عطرية وشموع فاخرة بالعود والمسك والعنبر الصافي',
                    descEn: 'Artisanal oud, amber oils and organic atmosphere candles',
                    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop',
                    badgeAr: 'مستخلص طبيعي',
                    badgeEn: '100% Organic'
                  },
                  {
                    id: 'home',
                    titleAr: 'المنزل والقطع الفنية',
                    titleEn: 'Modern Home Decor',
                    descAr: 'أكواب سيراميك مصنوعة يدويًا ومفارش من الكتان الطبيعي',
                    descEn: 'Handmade studio ceramics and raw linen luxury bedding',
                    image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=600&auto=format&fit=crop',
                    badgeAr: 'حرفية يدوية',
                    badgeEn: 'Artisanal Studio'
                  },
                  {
                    id: 'tech',
                    titleAr: 'الإكسسوارات التقنية',
                    titleEn: 'Bespoke Tech Accents',
                    descAr: 'حافظات ومساند جلدية من الجلد الطبيعي للأجهزة اللوحية',
                    descEn: 'Handcrafted calfskin sleeves and gold-brushed desk details',
                    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop',
                    badgeAr: 'إصدار محدود',
                    badgeEn: 'Limited Edition'
                  }
                ].map((cat) => (
                  <motion.div
                    key={cat.id}
                    whileHover={{ y: -6, scale: 1.01 }}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setView('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative h-96 rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-indigo-600/10 transition-all duration-300 border-2 border-transparent hover:border-indigo-100"
                  >
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-900/10 z-10" />
                    <img
                      src={cat.image}
                      alt={cat.titleEn}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Content */}
                    <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end h-full text-white">
                      <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/80 px-2.5 py-1 rounded-full w-max mb-3 backdrop-blur-md border border-indigo-500/20">
                        {isArabic ? cat.badgeAr : cat.badgeEn}
                      </span>
                      <h3 className="text-lg font-black tracking-wide">
                        {isArabic ? cat.titleAr : cat.titleEn}
                      </h3>
                      <p className="text-[11px] text-slate-300 font-medium mt-1.5 leading-relaxed">
                        {isArabic ? cat.descAr : cat.descEn}
                      </p>

                      <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-indigo-300 group-hover:text-indigo-200 transition-colors">
                        <span>{isArabic ? 'استكشف المجموعة' : 'Explore Curation'}</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                {(products.length > 0 ? products : PRODUCTS).filter(p => p.isFeatured).slice(0, 4).map(prod => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={handleSelectProduct}
                    onAddToCart={handleAddToCart}
                    isArabic={isArabic}
                  />
                ))}
              </div>
            </div>

            {/* Category Showcase Sections */}
            {(() => {
              const homeCategories = [
                {
                  id: 'apparel',
                  titleAr: 'الملابس والموضة',
                  titleEn: 'Luxury Apparel & Fashion',
                  descAr: 'تصاميم كلاسيكية خالدة مصنوعة من أرقى خامات الصوف الإيطالي والكتان الفاخر لتناسب مظهرك الأنيق والفريد.',
                  descEn: 'Timeless classic designs crafted from the finest Italian wool and luxury linen to suit your refined lifestyle.',
                  image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
                },
                {
                  id: 'wellness',
                  titleAr: 'العناية والعطور الطبيعية',
                  titleEn: 'Aromatherapy & Wellness',
                  descAr: 'رحلة حسية غنية مع شموع الصويا الطبيعية والزيوت العطرية النقية المستخلصة من العود والمسك والعنبر النادر.',
                  descEn: 'A sensory journey with organic soy candles and pure distilled aromatic oils of oud, musk, and rare amber.',
                  image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop',
                },
                {
                  id: 'home',
                  titleAr: 'المنزل والقطع الفنية',
                  titleEn: 'Artisan Home Decor',
                  descAr: 'مقتنيات خزفية فريدة وأوانٍ مصنوعة يدوياً بحرفية عالية تضفي دفئاً وجمالاً حقيقياً على زوايا منزلك العصري.',
                  descEn: 'Unique studio ceramics and handcrafted clayware designed to bring raw warmth and tactile beauty to your home.',
                  image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800&auto=format&fit=crop',
                },
                {
                  id: 'tech',
                  titleAr: 'الإكسسوارات التقنية',
                  titleEn: 'Bespoke Tech Accents',
                  descAr: 'إكسسوارات فاخرة وحافظات جلدية طبيعية تجمع بين الحماية الفائقة والمظهر الكلاسيكي الأنيق لأجهزتك اليومية.',
                  descEn: 'Premium calfskin sleeves and desktop organizers blending high-end device protection with sleek modern aesthetics.',
                  image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
                }
              ];

              return homeCategories.map((cat, idx) => {
                const catProducts = (products.length > 0 ? products : PRODUCTS).filter(p => p.category === cat.id);
                const isEven = idx % 2 === 0;

                return (
                  <div key={cat.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div 
                      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
                      style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    >
                      {/* Category Banner Card */}
                      <div className={`lg:col-span-4 flex flex-col justify-between p-8 rounded-[2.5rem] relative overflow-hidden text-white bg-slate-900 group min-h-[350px] lg:min-h-full ${
                        isEven ? 'lg:order-first' : 'lg:order-last'
                      }`}>
                        {/* Dark background overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-950/20 z-10" />
                        <img 
                          src={cat.image} 
                          alt={cat.titleEn}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                        />

                        {/* Top info */}
                        <div className="relative z-20 space-y-3">
                          <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20 w-max block">
                            {isArabic ? 'فئة متميزة' : 'FEATURED CATEGORY'}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black font-sans leading-tight">
                            {isArabic ? cat.titleAr : cat.titleEn}
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {isArabic ? cat.descAr : cat.descEn}
                          </p>
                        </div>

                        {/* Action view full */}
                        <div className="relative z-20 pt-6">
                          <button
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setView('catalog');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-3.5 px-5 bg-white hover:bg-indigo-50 text-indigo-600 text-xs font-black rounded-2xl shadow-lg shadow-white/5 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>{isArabic ? `عرض كل ${cat.titleAr}` : `View All ${cat.titleEn}`}</span>
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
                            <div key={prod.id} className="min-w-[190px] sm:min-w-[220px] max-w-[220px] flex-shrink-0 snap-start">
                              <ProductCard
                                product={prod}
                                onSelect={handleSelectProduct}
                                onAddToCart={handleAddToCart}
                                isArabic={isArabic}
                                isCompact={true}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}

            {/* Experience Bento Block */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div 
                className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-14 overflow-hidden relative shadow-2xl animate-fade-in"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                {/* Decorative glowing gradient backdrop */}
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
            {/* Custom Interactive All Collection Catalog */}
            <AllCollection
              products={products.length > 0 ? products : PRODUCTS}
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
          />
        )}

        {view === 'orders' && (
          <OrdersHistory
            orders={orders}
            onClose={() => setView('catalog')}
            isArabic={isArabic}
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
      />

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
              <li>{isArabic ? 'الملابس والمعاطف' : 'Apparel & Overcoats'}</li>
              <li>{isArabic ? 'الحقائب والجلديات' : 'Leather Bags'}</li>
              <li>{isArabic ? 'العطور الطبيعية' : 'Signature Fragrances'}</li>
              <li>{isArabic ? 'أكواب السيراميك' : 'Handcrafted Ceramics'}</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-xs font-bold tracking-wider uppercase mb-3">{isArabic ? 'الدعم والمساعدة' : 'Client Services'}</h4>
            <ul className="text-xs space-y-2 text-[#8E8D8A]">
              <li>{isArabic ? 'شروط التوصيل والاسترجاع' : 'Delivery & Returns policy'}</li>
              <li>{isArabic ? 'سياسة الخصوصية والأمان' : 'Secure privacy rules'}</li>
              <li>{isArabic ? 'الاستشارة الذكية المباشرة' : 'Consult our live concierge'}</li>
              <li>{isArabic ? 'حقوق الطبع والنشر © 2026 زيوكا' : 'Copyright © 2026 ZEWKA. All Rights Reserved.'}</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
