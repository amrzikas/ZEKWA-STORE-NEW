import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, ShieldAlert, DollarSign, Truck, Package, 
  Clock, CheckCircle, CreditCard, Lock, Unlock, Settings, Eye, 
  RefreshCw, ClipboardList, Check, X, AlertCircle, Sparkles, LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Order, ShippingStatus, Category, Subcategory } from '../types';

interface AdminDashboardProps {
  isArabic: boolean;
  onClose: () => void;
  user: any;
}

export interface PaymentGateway {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  status: 'active' | 'inactive';
  apiKey?: string;
  merchantId?: string;
}

export interface ShippingPlan {
  id: string;
  name: string;
  nameAr: string;
  cost: number;
  deliveryTime: string;
  deliveryTimeAr: string;
  status: 'active' | 'inactive';
}

export default function AdminDashboard({ isArabic, onClose, user }: AdminDashboardProps) {
  // Authentication & Passkey state
  const [passkey, setPasskey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'gateways' | 'shipping' | 'categories'>('products');

  // Firestore Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [shippingPlans, setShippingPlans] = useState<ShippingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms / Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // New Product Form State
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    category: 'apparel' as Product['category'],
    categoryAr: 'ملابس وأزياء',
    subcategory: '',
    subcategoryAr: '',
    image: '',
    images: ['', '', '', '', ''] as string[],
    stock: 10,
    features: '',
    featuresAr: '',
  });

  // Dynamic Category Form States
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    nameAr: ''
  });

  // Dynamic Subcategory Form States
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState('');
  const [subcategoryForm, setSubcategoryForm] = useState({
    id: '',
    name: '',
    nameAr: ''
  });

  // New Gateway Form State
  const [showGatewayForm, setShowGatewayForm] = useState(false);
  const [gatewayForm, setGatewayForm] = useState({
    id: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    status: 'active' as 'active' | 'inactive',
    apiKey: '',
    merchantId: ''
  });

  // New Shipping Plan Form State
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    id: '',
    name: '',
    nameAr: '',
    cost: 0,
    deliveryTime: '',
    deliveryTimeAr: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Selected Order Detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 1. Check if user is super admin email or already verified
  useEffect(() => {
    if (user && user.email?.toLowerCase() === 'amrzikas20@gmail.com') {
      setIsUnlocked(true);
    }
  }, [user]);

  // Try Unlocking with Passkey
  const handleVerifyPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === 'ZEWKA_ADMIN_2026') {
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError(isArabic ? 'رمز المرور غير صحيح!' : 'Incorrect security passkey!');
    }
  };

  // 2. Fetch all collections if unlocked
  useEffect(() => {
    if (!isUnlocked) return;

    setLoading(true);

    // Live Orders Subscription
    const ordersQuery = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders: Order[] = [];
      snapshot.forEach((docSnap) => {
        fetchedOrders.push(docSnap.data() as Order);
      });
      // Sort orders by date descending
      fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(fetchedOrders);
    }, (err) => {
      console.error("Failed to load orders: ", err);
    });

    // Products Subscription
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const fetchedProds: Product[] = [];
      snapshot.forEach((docSnap) => {
        fetchedProds.push(docSnap.data() as Product);
      });
      setProducts(fetchedProds);
    }, (err) => {
      console.error("Failed to load products: ", err);
    });

    // Gateways Subscription
    const gatewaysQuery = query(collection(db, 'gateways'));
    const unsubscribeGateways = onSnapshot(gatewaysQuery, (snapshot) => {
      const fetchedGateways: PaymentGateway[] = [];
      snapshot.forEach((docSnap) => {
        fetchedGateways.push(docSnap.data() as PaymentGateway);
      });
      setGateways(fetchedGateways);
    }, (err) => {
      console.error("Failed to load gateways: ", err);
    });

    // Shipping Plans Subscription
    const shippingQuery = query(collection(db, 'shippingPlans'));
    const unsubscribeShipping = onSnapshot(shippingQuery, (snapshot) => {
      const fetchedPlans: ShippingPlan[] = [];
      snapshot.forEach((docSnap) => {
        fetchedPlans.push(docSnap.data() as ShippingPlan);
      });
      setShippingPlans(fetchedPlans);
    }, (err) => {
      console.error("Failed to load shipping plans: ", err);
    });

    // Categories Subscription
    const categoriesQuery = query(collection(db, 'categories'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const fetchedCategories: Category[] = [];
      snapshot.forEach((docSnap) => {
        fetchedCategories.push(docSnap.data() as Category);
      });
      setCategories(fetchedCategories);
    }, (err) => {
      console.error("Failed to load categories: ", err);
    });

    setLoading(false);

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeGateways();
      unsubscribeShipping();
      unsubscribeCategories();
    };
  }, [isUnlocked]);

  // Add / Edit Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.nameAr || productForm.price <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const pId = editingProduct ? editingProduct.id : (productForm.id || `prod-${Date.now()}`);
    
    const selectedCatObj = categories.find(c => c.id === productForm.category);
    const categoryNameAr = selectedCatObj ? selectedCatObj.nameAr : 'أخرى';
    
    const selectedSubObj = selectedCatObj?.subcategories?.find(s => s.id === productForm.subcategory);
    const subcategoryNameAr = selectedSubObj ? selectedSubObj.nameAr : '';
    const subcategoryNameEn = selectedSubObj ? selectedSubObj.name : '';

    const filledImages = productForm.images.filter(Boolean);
    const primaryImg = filledImages[0] || productForm.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';

    const finalProduct: Product = {
      id: pId,
      name: productForm.name,
      nameAr: productForm.nameAr,
      description: productForm.description,
      descriptionAr: productForm.descriptionAr,
      price: Number(productForm.price),
      category: productForm.category,
      categoryAr: categoryNameAr,
      subcategory: productForm.subcategory || undefined,
      subcategoryAr: subcategoryNameAr || undefined,
      rating: editingProduct ? editingProduct.rating : 5,
      reviewsCount: editingProduct ? editingProduct.reviewsCount : 0,
      image: primaryImg,
      images: filledImages.length > 0 ? filledImages : [primaryImg],
      features: productForm.features ? productForm.features.split('\n').filter(Boolean) : [],
      featuresAr: productForm.featuresAr ? productForm.featuresAr.split('\n').filter(Boolean) : [],
      specs: editingProduct ? editingProduct.specs : {},
      specsAr: editingProduct ? editingProduct.specsAr : {},
      stock: Number(productForm.stock),
      isFeatured: true
    };

    try {
      await setDoc(doc(db, 'products', pId), finalProduct);
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${pId}`);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      price: 0,
      category: 'apparel',
      categoryAr: 'ملابس وأزياء',
      subcategory: '',
      subcategoryAr: '',
      image: '',
      images: ['', '', '', '', ''],
      stock: 10,
      features: '',
      featuresAr: '',
    });
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const formImages = ['', '', '', '', ''];
    if (prod.images && prod.images.length > 0) {
      for (let i = 0; i < Math.min(prod.images.length, 5); i++) {
        formImages[i] = prod.images[i];
      }
    } else if (prod.image) {
      formImages[0] = prod.image;
    }

    setProductForm({
      id: prod.id,
      name: prod.name,
      nameAr: prod.nameAr,
      description: prod.description || '',
      descriptionAr: prod.descriptionAr || '',
      price: prod.price,
      category: prod.category,
      categoryAr: prod.categoryAr,
      subcategory: prod.subcategory || '',
      subcategoryAr: prod.subcategoryAr || '',
      image: prod.image,
      images: formImages,
      stock: prod.stock,
      features: prod.features ? prod.features.join('\n') : '',
      featuresAr: prod.featuresAr ? prod.featuresAr.join('\n') : '',
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  // Add Category Submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.id || !categoryForm.name || !categoryForm.nameAr) {
      alert(isArabic ? 'الرجاء ملء جميع الحقول المطلوبة للفئة' : 'Please fill all required fields for the category');
      return;
    }

    const newCategory: Category = {
      id: categoryForm.id.trim().toLowerCase(),
      name: categoryForm.name.trim(),
      nameAr: categoryForm.nameAr.trim(),
      subcategories: []
    };

    try {
      await setDoc(doc(db, 'categories', newCategory.id), newCategory);
      setShowCategoryForm(false);
      setCategoryForm({ id: '', name: '', nameAr: '' });
    } catch (error) {
      console.error("Error creating category: ", error);
      alert(isArabic ? 'فشل إضافة الفئة' : 'Failed to add category');
    }
  };

  // Add Subcategory Submit
  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParentCategoryId) {
      alert(isArabic ? 'الرجاء اختيار الفئة الرئيسية أولاً' : 'Please select the parent category first');
      return;
    }
    if (!subcategoryForm.id || !subcategoryForm.name || !subcategoryForm.nameAr) {
      alert(isArabic ? 'الرجاء ملء جميع الحقول الفرعية' : 'Please fill all subcategory fields');
      return;
    }

    const parentCat = categories.find(c => c.id === selectedParentCategoryId);
    if (!parentCat) return;

    const newSub: Subcategory = {
      id: subcategoryForm.id.trim().toLowerCase(),
      name: subcategoryForm.name.trim(),
      nameAr: subcategoryForm.nameAr.trim()
    };

    const currentSubs = parentCat.subcategories || [];
    // Prevent duplicate subcategory IDs
    if (currentSubs.some(s => s.id === newSub.id)) {
      alert(isArabic ? 'هذه الفئة الفرعية موجودة بالفعل!' : 'This subcategory already exists!');
      return;
    }

    const updatedCategory: Category = {
      ...parentCat,
      subcategories: [...currentSubs, newSub]
    };

    try {
      await setDoc(doc(db, 'categories', selectedParentCategoryId), updatedCategory);
      setShowSubcategoryForm(false);
      setSubcategoryForm({ id: '', name: '', nameAr: '' });
    } catch (error) {
      console.error("Error creating subcategory: ", error);
      alert(isArabic ? 'فشل إضافة الفئة الفرعية' : 'Failed to add subcategory');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الفئة بالكامل؟' : 'Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
    } catch (error) {
      console.error("Error deleting category: ", error);
    }
  };

  // Delete Subcategory
  const handleDeleteSubcategory = async (catId: string, subId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الفئة الفرعية؟' : 'Are you sure you want to delete this subcategory?')) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const updatedCategory: Category = {
      ...cat,
      subcategories: (cat.subcategories || []).filter(s => s.id !== subId)
    };

    try {
      await setDoc(doc(db, 'categories', catId), updatedCategory);
    } catch (error) {
      console.error("Error deleting subcategory: ", error);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: ShippingStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        shippingStatus: nextStatus
      });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, shippingStatus: nextStatus } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  // Gateway Submit
  const handleGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayForm.name || !gatewayForm.nameAr) return;
    
    const gwId = gatewayForm.id || `gw-${Date.now()}`;
    const newGateway: PaymentGateway = {
      id: gwId,
      name: gatewayForm.name,
      nameAr: gatewayForm.nameAr,
      description: gatewayForm.description,
      descriptionAr: gatewayForm.descriptionAr,
      status: gatewayForm.status,
      apiKey: gatewayForm.apiKey,
      merchantId: gatewayForm.merchantId
    };

    try {
      await setDoc(doc(db, 'gateways', gwId), newGateway);
      setShowGatewayForm(false);
      setGatewayForm({
        id: '',
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        status: 'active',
        apiKey: '',
        merchantId: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `gateways/${gwId}`);
    }
  };

  // Toggle Gateway Status
  const handleToggleGateway = async (gw: PaymentGateway) => {
    const nextStatus = gw.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'gateways', gw.id), {
        status: nextStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `gateways/${gw.id}`);
    }
  };

  // Delete Gateway
  const handleDeleteGateway = async (id: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف بوابة الدفع هذه؟' : 'Are you sure you want to delete this payment gateway?')) return;
    try {
      await deleteDoc(doc(db, 'gateways', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gateways/${id}`);
    }
  };

  // Shipping Plan Submit
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingForm.name || !shippingForm.nameAr) return;

    const planId = shippingForm.id || `ship-${Date.now()}`;
    const newPlan: ShippingPlan = {
      id: planId,
      name: shippingForm.name,
      nameAr: shippingForm.nameAr,
      cost: Number(shippingForm.cost),
      deliveryTime: shippingForm.deliveryTime,
      deliveryTimeAr: shippingForm.deliveryTimeAr,
      status: shippingForm.status
    };

    try {
      await setDoc(doc(db, 'shippingPlans', planId), newPlan);
      setShowShippingForm(false);
      setShippingForm({
        id: '',
        name: '',
        nameAr: '',
        cost: 0,
        deliveryTime: '',
        deliveryTimeAr: '',
        status: 'active'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `shippingPlans/${planId}`);
    }
  };

  // Toggle Shipping Plan Status
  const handleToggleShipping = async (plan: ShippingPlan) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'shippingPlans', plan.id), {
        status: nextStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shippingPlans/${plan.id}`);
    }
  };

  // Delete Shipping Plan
  const handleDeleteShipping = async (id: string) => {
    if (!confirm(isArabic ? 'هل تريد حذف خطة الشحن هذه؟' : 'Are you sure you want to delete this shipping plan?')) return;
    try {
      await deleteDoc(doc(db, 'shippingPlans', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `shippingPlans/${id}`);
    }
  };

  // ------------------ LOCK SCREEN UI ------------------
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-[#0c0d12]/95 z-[9999] flex items-center justify-center p-4 overflow-y-auto font-sans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        <div className="bg-[#141622] border-2 border-indigo-500/20 max-w-md w-full p-8 rounded-3xl shadow-2xl relative text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-white tracking-wide mb-2">
            {isArabic ? 'منطقة إدارية آمنة' : 'Secure Admin Area'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            {isArabic 
              ? 'يرجى تسجيل الدخول بحساب الأدمن أو إدخال رمز المرور السري للمعاينة والتحكم.' 
              : 'Please sign in with the admin Google account or use the developer passkey for testing.'}
          </p>

          <form onSubmit={handleVerifyPasskey} className="space-y-4">
            <div className="text-right">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5 text-center">
                {isArabic ? 'رمز المرور الأمني (للاختبار والمراجعة)' : 'SECURITY PASSKEY (FOR TESTING)'}
              </label>
              <input
                type="password"
                placeholder="e.g. ZEWKA_ADMIN_2026"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full bg-[#0a0b10] border border-slate-800 rounded-xl px-4 py-3 text-sm text-center font-mono text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {isArabic ? 'إلغاء القفل والدخول' : 'Unlock & Access'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/60 text-[10px] text-slate-500 space-y-1">
            <p>{isArabic ? 'حساب الأدمن الافتراضي:' : 'Default Admin Account:'}</p>
            <p className="font-mono text-indigo-400/80">AmrZikas20@gmail.com</p>
            <p className="font-mono text-indigo-400/80 mt-1">{isArabic ? 'رمز المرور السريع للمعاينة:' : 'Sandbox preview bypass passkey:'} ZEWKA_ADMIN_2026</p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ MAIN DASHBOARD UI ------------------
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-end font-sans overflow-hidden" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      <motion.div 
        initial={{ x: isArabic ? -100 : 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full max-w-6xl h-full bg-white shadow-2xl flex flex-col relative"
      >
        {/* Header bar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                {isArabic ? 'لوحة التحكم الفاخرة للرئيس' : 'ZEWKA Luxury Command Center'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {isArabic ? 'أنت مسجل كأدمن مع كامل الصلاحيات' : 'Authorized Administrator Mode'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsUnlocked(false)}
              className="p-2 text-slate-400 hover:text-red-500 rounded-xl bg-slate-100/50 hover:bg-red-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title={isArabic ? 'قفل الخروج' : 'Lock session'}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'قفل الجلسة' : 'Lock'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body Wrapper with Sidebar */}
        <div className="flex flex-1 overflow-hidden h-full">
          {/* Sidebar Navigation */}
          <div className="w-64 border-e border-slate-100 bg-slate-50/80 p-4 flex flex-col justify-between shrink-0 h-full">
            <div className="space-y-1.5">
              {/* Products */}
              <button
                onClick={() => setActiveTab('products')}
                className={`w-full px-4 py-3 text-xs font-black tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-3 ${
                  activeTab === 'products'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>{isArabic ? 'المنتجات الفاخرة' : 'Products'}</span>
                {products.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isArabic ? 'mr-auto' : 'ml-auto'} ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {products.length}
                  </span>
                )}
              </button>

              {/* Categories & Subcategories */}
              <button
                onClick={() => setActiveTab('categories')}
                className={`w-full px-4 py-3 text-xs font-black tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-3 ${
                  activeTab === 'categories'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>{isArabic ? 'الفئات والفرعيات' : 'Categories & Subs'}</span>
                {categories.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isArabic ? 'mr-auto' : 'ml-auto'} ${activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {categories.length}
                  </span>
                )}
              </button>

              {/* Orders */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full px-4 py-3 text-xs font-black tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-3 ${
                  activeTab === 'orders'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>{isArabic ? 'الطلبات والعمليات' : 'Orders'}</span>
                {orders.length > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${isArabic ? 'mr-auto' : 'ml-auto'} ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {orders.length}
                  </span>
                )}
              </button>

              {/* Gateways */}
              <button
                onClick={() => setActiveTab('gateways')}
                className={`w-full px-4 py-3 text-xs font-black tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-3 ${
                  activeTab === 'gateways'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{isArabic ? 'بوابات الدفع' : 'Payment Gateways'}</span>
              </button>

              {/* Shipping */}
              <button
                onClick={() => setActiveTab('shipping')}
                className={`w-full px-4 py-3 text-xs font-black tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-3 ${
                  activeTab === 'shipping'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{isArabic ? 'خطط الشحن والتسليم' : 'Shipping Plans'}</span>
              </button>
            </div>

            {/* Lower sidebar footer section */}
            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-500">{isArabic ? 'نظام زيوكا الفاخر' : 'ZEWKA Luxury System'}</p>
              <p>v2.4.0 • Cloud Firestore</p>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-black text-slate-400">{isArabic ? 'جاري تحميل البيانات من الخادم السحابي...' : 'Fetching Cloud Firestore database records...'}</p>
            </div>
          ) : (
            <>
              {/* ==================== PRODUCTS TAB ==================== */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{isArabic ? 'إدارة كتالوج المنتجات الفاخرة' : 'Apparel & Accessories Catalog'}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? 'يمكنك إضافة منتجات جديدة وحذف وتعديل البيانات فورياً في الفايرستور.' : 'Manage available stock, custom descriptions, prices, and upload custom items.'}</p>
                    </div>
                    <button
                      onClick={() => {
                        resetProductForm();
                        setEditingProduct(null);
                        setShowProductModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all duration-300 shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? 'إضافة منتج فاخر جديد' : 'Add New Luxury Product'}</span>
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-black text-slate-400">{isArabic ? 'كتالوج المنتجات فارغ حالياً في السحابة. سيتم عرض المنتجات المحملة مسبقاً في واجهة العميل.' : 'No cloud products found. Initial defaults will seed on first load!'}</p>
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs text-slate-600" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                        <thead className="bg-slate-50 font-black text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">{isArabic ? 'المنتج' : 'Product'}</th>
                            <th className="px-4 py-3">{isArabic ? 'الفئة' : 'Category'}</th>
                            <th className="px-4 py-3 text-center">{isArabic ? 'السعر' : 'Price'}</th>
                            <th className="px-4 py-3 text-center">{isArabic ? 'المخزون' : 'Stock'}</th>
                            <th className="px-4 py-3 text-center">{isArabic ? 'التقييم' : 'Rating'}</th>
                            <th className="px-4 py-3 text-center">{isArabic ? 'خيارات' : 'Options'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                          {products.map((prod) => (
                            <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3 flex items-center gap-3">
                                <img src={prod.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100" referrerPolicy="no-referrer" />
                                <div>
                                  <p className="font-black text-slate-800">{isArabic ? prod.nameAr : prod.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{prod.id}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">
                                  {isArabic ? prod.categoryAr : prod.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-black text-slate-800">
                                {prod.price} {isArabic ? 'ر.س' : 'SAR'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${prod.stock === 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {prod.stock} {isArabic ? 'قطع' : 'pcs'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-amber-500 font-black">
                                ★ {prod.rating}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleEditProduct(prod)}
                                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg transition"
                                    title={isArabic ? 'تعديل المنتج' : 'Edit Product'}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition"
                                    title={isArabic ? 'حذف المنتج' : 'Delete Product'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== ORDERS TAB ==================== */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{isArabic ? 'متابعة وتحديث طلبات العملاء السحابية' : 'Real-time Customer Orders Tracker'}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? 'التحكم في تحديث حالات شحن وتوصيل الطلبات للعملاء مباشرة.' : 'Review customer shipping details, order price totals, and change shipping status.'}</p>
                  </div>

                  {orders.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
                      <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-black text-slate-400">{isArabic ? 'لا توجد طلبات عملاء مسجلة في الفايرستور حالياً.' : 'No orders in the database yet. Place some checkout orders to test!'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Orders List Table */}
                      <div className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
                        <table className="w-full text-xs text-slate-600" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                          <thead className="bg-slate-50 font-black text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">{isArabic ? 'رقم الطلب' : 'Order ID'}</th>
                              <th className="px-4 py-3">{isArabic ? 'العميل' : 'Customer'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'التاريخ' : 'Date'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'الإجمالي' : 'Total'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'الحالة' : 'Status'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'معاينة' : 'View'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold">
                            {orders.map((order) => (
                              <tr 
                                key={order.id} 
                                className={`hover:bg-slate-50/50 transition cursor-pointer ${selectedOrder?.id === order.id ? 'bg-indigo-50/30' : ''}`}
                                onClick={() => setSelectedOrder(order)}
                              >
                                <td className="px-4 py-3">
                                  <span className="font-mono text-[10px] text-slate-500 block truncate max-w-[80px]">
                                    {order.id}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-black text-slate-800">{order.customerInfo?.fullName || 'Guest'}</p>
                                  <p className="text-[10px] text-slate-400">{order.customerInfo?.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-400 font-mono text-[10px]">
                                  {order.date}
                                </td>
                                <td className="px-4 py-3 text-center font-black text-indigo-600">
                                  {order.total} {isArabic ? 'ر.س' : 'SAR'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] inline-block font-black uppercase ${
                                    order.shippingStatus === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                    order.shippingStatus === 'shipped' ? 'bg-blue-50 text-blue-600' :
                                    order.shippingStatus === 'processing' ? 'bg-amber-50 text-amber-600' :
                                    'bg-purple-50 text-purple-600'
                                  }`}>
                                    {order.shippingStatus === 'delivered' ? (isArabic ? 'تم التوصيل' : 'Delivered') :
                                     order.shippingStatus === 'shipped' ? (isArabic ? 'تم الشحن' : 'Shipped') :
                                     order.shippingStatus === 'processing' ? (isArabic ? 'قيد المعالجة' : 'Processing') :
                                     (isArabic ? 'تم الاستلام' : 'Placed')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    className="p-1 hover:bg-indigo-50 rounded text-indigo-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrder(order);
                                    }}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Selected Order Detail Sidebar */}
                      <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 space-y-4">
                        {selectedOrder ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest">{isArabic ? 'تفاصيل الطلب' : 'ORDER DETAILS'}</span>
                                <h4 className="text-xs font-black text-slate-800 font-mono mt-0.5">{selectedOrder.id}</h4>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{selectedOrder.date}</span>
                            </div>

                            {/* Customer Profile */}
                            <div className="space-y-1.5 text-xs">
                              <h5 className="font-black text-slate-700">{isArabic ? 'بيانات الشحن والتوصيل' : 'Customer & Shipping Info'}</h5>
                              <div className="p-3 bg-white border border-slate-200/50 rounded-xl space-y-1 font-bold text-[11px] text-slate-600">
                                <p className="text-slate-800 font-black">{selectedOrder.customerInfo?.fullName}</p>
                                <p>{selectedOrder.customerInfo?.email}</p>
                                <p>{selectedOrder.customerInfo?.phone}</p>
                                <p className="text-slate-500 pt-1 border-t border-slate-100 mt-1">
                                  {selectedOrder.customerInfo?.address}, {selectedOrder.customerInfo?.city}, {selectedOrder.customerInfo?.postalCode}
                                </p>
                              </div>
                            </div>

                            {/* Items Purchased */}
                            <div className="space-y-1.5">
                              <h5 className="text-xs font-black text-slate-700">{isArabic ? 'المنتجات المطلوبة' : 'Items'}</h5>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {selectedOrder.items?.map((item, index) => (
                                  <div key={index} className="flex items-center justify-between text-xs bg-white p-2 border border-slate-200/50 rounded-xl font-bold">
                                    <span className="truncate max-w-[120px] text-slate-700">{isArabic ? item.product.nameAr : item.product.name}</span>
                                    <span className="text-slate-400 font-mono text-[10px]">x{item.quantity}</span>
                                    <span className="font-black text-slate-800">{item.product.price * item.quantity} {isArabic ? 'ر.س' : 'SAR'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tracking / Price summary */}
                            <div className="p-3 bg-white border border-slate-200/50 rounded-xl text-xs space-y-1 font-bold">
                              <div className="flex justify-between">
                                <span className="text-slate-400">{isArabic ? 'المجموع' : 'Subtotal'}</span>
                                <span className="text-slate-700">{selectedOrder.subtotal} {isArabic ? 'ر.س' : 'SAR'}</span>
                              </div>
                              {selectedOrder.discount > 0 && (
                                <div className="flex justify-between text-red-500">
                                  <span>{isArabic ? 'الخصم والرمز' : 'Discount'}</span>
                                  <span>-{selectedOrder.discount} {isArabic ? 'ر.س' : 'SAR'}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-black text-slate-800 pt-1.5 border-t border-slate-100 mt-1">
                                <span>{isArabic ? 'الإجمالي النهائي' : 'Total'}</span>
                                <span className="text-indigo-600">{selectedOrder.total} {isArabic ? 'ر.س' : 'SAR'}</span>
                              </div>
                            </div>

                            {/* Shipping Status Action Buttons */}
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                              <h5 className="text-xs font-black text-slate-700">{isArabic ? 'تحديث حالة الشحن السحابية' : 'Update Tracking Status'}</h5>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                                    selectedOrder.shippingStatus === 'processing'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  {isArabic ? 'قيد التجهيز' : 'Processing'}
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped')}
                                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                                    selectedOrder.shippingStatus === 'shipped'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  {isArabic ? 'تم الشحن' : 'Shipped'}
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                                  className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center col-span-2 ${
                                    selectedOrder.shippingStatus === 'delivered'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  {isArabic ? 'تم التوصيل بنجاح' : 'Mark as Delivered'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400">
                            <ClipboardList className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-xs font-black">{isArabic ? 'يرجى اختيار أحد الطلبات من الجدول لمعاينة تفاصيل الشحن والتحكم بها.' : 'Select an order from the list to view and manage its status.'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== GATEWAYS TAB ==================== */}
              {activeTab === 'gateways' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{isArabic ? 'بوابات الدفع الإلكترونية النشطة' : 'Configured Payment Gateways'}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? 'بوابات الدفع المفعلة لتسهيل عمليات الدفع عند الشراء.' : 'Configure, toggle, or add new check-out payment methods available for consumers.'}</p>
                    </div>
                    <button
                      onClick={() => setShowGatewayForm(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all duration-300 shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? 'إنشاء بوابة دفع جديدة' : 'Create Payment Gateway'}</span>
                    </button>
                  </div>

                  {/* New Gateway Expandable Form */}
                  {showGatewayForm && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-800">{isArabic ? 'بوابة دفع جديدة' : 'New Payment Gateway Form'}</h4>
                        <button onClick={() => setShowGatewayForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>

                      <form onSubmit={handleGatewaySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'المعرف الفريد (مثال: apple_pay)' : 'Unique ID (e.g. apple_pay)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="apple_pay"
                            value={gatewayForm.id} 
                            onChange={(e) => setGatewayForm({...gatewayForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Apple Pay"
                            value={gatewayForm.name} 
                            onChange={(e) => setGatewayForm({...gatewayForm, name: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="أبل باي"
                            value={gatewayForm.nameAr} 
                            onChange={(e) => setGatewayForm({...gatewayForm, nameAr: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'معرف التاجر / Merchant ID' : 'Merchant ID'}</label>
                          <input 
                            type="text" 
                            placeholder="merchant.com.zewka"
                            value={gatewayForm.merchantId} 
                            onChange={(e) => setGatewayForm({...gatewayForm, merchantId: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-slate-500 mb-1">{isArabic ? 'وصف بوابة الدفع بالعربية' : 'Description (Arabic)'}</label>
                          <input 
                            type="text" 
                            placeholder="ادفع فورياً وبأمان عبر أجهزتك الذكية."
                            value={gatewayForm.descriptionAr} 
                            onChange={(e) => setGatewayForm({...gatewayForm, descriptionAr: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowGatewayForm(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition cursor-pointer"
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                          >
                            {isArabic ? 'حفظ وحفظ سحابي' : 'Save Config'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Gateways Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gateways.map((gw) => (
                      <div key={gw.id} className="p-4 bg-white border-2 border-slate-50 hover:border-slate-100 rounded-2xl shadow-sm relative flex flex-col justify-between font-bold text-xs">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-black text-slate-800">{isArabic ? gw.nameAr : gw.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">{gw.id}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${gw.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                              {gw.status === 'active' ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-normal line-clamp-2 mb-3">
                            {isArabic ? gw.descriptionAr : gw.description}
                          </p>
                          {gw.merchantId && (
                            <div className="p-2 bg-slate-50 rounded-lg text-[10px] font-mono text-slate-500 truncate mb-2">
                              MID: {gw.merchantId}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-100 mt-2">
                          <button
                            onClick={() => handleToggleGateway(gw)}
                            className={`px-3 py-1 text-[10px] rounded-lg transition cursor-pointer ${
                              gw.status === 'active' 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {gw.status === 'active' ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                          </button>
                          <button
                            onClick={() => handleDeleteGateway(gw.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== SHIPPING TAB ==================== */}
              {activeTab === 'shipping' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{isArabic ? 'خطط الشحن والخدمات الفاخرة' : 'Shipping & Courier Options'}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? 'إدارة وتحديد أسعار الشحن والمدد الزمنية المتوقعة للعميل.' : 'Add or modify shipping duration, costs, and availability on checkout.'}</p>
                    </div>
                    <button
                      onClick={() => setShowShippingForm(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all duration-300 shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? 'إنشاء خطة شحن جديدة' : 'Add Shipping Plan'}</span>
                    </button>
                  </div>

                  {/* Shipping Plan Form */}
                  {showShippingForm && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-800">{isArabic ? 'خطة شحن جديدة' : 'New Shipping Plan Form'}</h4>
                        <button onClick={() => setShowShippingForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>

                      <form onSubmit={handleShippingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'المعرف الفريد (مثال: premium_dhl)' : 'Unique ID (e.g. dhl)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="premium_dhl"
                            value={shippingForm.id} 
                            onChange={(e) => setShippingForm({...shippingForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'سعر الشحن (ر.س)' : 'Shipping Cost (SAR)'}</label>
                          <input 
                            type="number" 
                            required 
                            placeholder="30"
                            value={shippingForm.cost} 
                            onChange={(e) => setShippingForm({...shippingForm, cost: Number(e.target.value)})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="شحن سريع عبر DHL"
                            value={shippingForm.nameAr} 
                            onChange={(e) => setShippingForm({...shippingForm, nameAr: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Express Shipping (DHL)"
                            value={shippingForm.name} 
                            onChange={(e) => setShippingForm({...shippingForm, name: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'زمن التوصيل بالعربية' : 'Delivery Time (Arabic)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="خلال 24-48 ساعة"
                            value={shippingForm.deliveryTimeAr} 
                            onChange={(e) => setShippingForm({...shippingForm, deliveryTimeAr: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'زمن التوصيل بالإنجليزية' : 'Delivery Time (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="1 - 2 business days"
                            value={shippingForm.deliveryTime} 
                            onChange={(e) => setShippingForm({...shippingForm, deliveryTime: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowShippingForm(false)}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition cursor-pointer"
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                          >
                            {isArabic ? 'إضافة للخطة سحابياً' : 'Save Shipping Plan'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Shipping Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shippingPlans.map((plan) => (
                      <div key={plan.id} className="p-4 bg-white border-2 border-slate-50 hover:border-slate-100 rounded-2xl shadow-sm relative flex flex-col justify-between font-bold text-xs">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-black text-slate-800">{isArabic ? plan.nameAr : plan.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">{plan.id}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${plan.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                              {plan.status === 'active' ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'غير نشط' : 'Inactive')}
                            </span>
                          </div>

                          <div className="mt-3 space-y-1.5 font-bold">
                            <div className="flex justify-between text-slate-500">
                              <span>{isArabic ? 'سعر الشحن:' : 'Cost:'}</span>
                              <span className="text-indigo-600 font-black">{plan.cost} {isArabic ? 'ر.س' : 'SAR'}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>{isArabic ? 'وقت التسليم المتوقع:' : 'Delivery Time:'}</span>
                              <span className="text-slate-800">{isArabic ? plan.deliveryTimeAr : plan.deliveryTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-100 mt-4">
                          <button
                            onClick={() => handleToggleShipping(plan)}
                            className={`px-3 py-1 text-[10px] rounded-lg transition cursor-pointer ${
                              plan.status === 'active' 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            {plan.status === 'active' ? (isArabic ? 'تعطيل' : 'Deactivate') : (isArabic ? 'تفعيل' : 'Activate')}
                          </button>
                          <button
                            onClick={() => handleDeleteShipping(plan.id)}
                            className="p-1 hover:bg-red-50 text-red-500 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ==================== PRODUCT FORM MODAL ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-2 border-indigo-50 max-w-2xl w-full p-6 rounded-3xl shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">
                {editingProduct ? (isArabic ? 'تعديل منتج فاخر' : 'Edit Luxury Product') : (isArabic ? 'إضافة منتج جديد للكتالوج السحابي' : 'Add New Product to Cloud Firestore')}
              </h3>
              <button 
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingProduct && (
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 mb-1">{isArabic ? 'المعرف الفريد للمنتج' : 'Unique Product ID'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. premium_sneaker_01"
                      value={productForm.id} 
                      onChange={(e) => setProductForm({...productForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                    />
                  </div>
                )}
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'اسم المنتج بالإنجليزية' : 'Product Name (English)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Classic Suede Oversized Shirt"
                    value={productForm.name} 
                    onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'اسم المنتج بالعربية' : 'Product Name (Arabic)'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="قميص كلاسيكي اوفرسايز باهت"
                    value={productForm.nameAr} 
                    onChange={(e) => setProductForm({...productForm, nameAr: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'السعر (ر.س)' : 'Price (SAR)'}</label>
                  <input 
                    type="number" 
                    required
                    placeholder="250"
                    value={productForm.price || ''} 
                    onChange={(e) => setProductForm({...productForm, price: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'الكمية في المخزن' : 'Stock Quantity'}</label>
                  <input 
                    type="number" 
                    required
                    placeholder="15"
                    value={productForm.stock} 
                    onChange={(e) => setProductForm({...productForm, stock: Number(e.target.value)})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'الفئة الفاخرة للمنتج' : 'Category'}</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      const matchingCat = categories.find(c => c.id === newCat);
                      const defaultSub = matchingCat?.subcategories?.[0]?.id || '';
                      setProductForm({...productForm, category: newCat, subcategory: defaultSub});
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-xs"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{isArabic ? cat.nameAr : cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'الفئة الفرعية المخصصة' : 'Subcategory'}</label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({...productForm, subcategory: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-xs"
                  >
                    <option value="">{isArabic ? 'لا توجد فئة فرعية' : 'No subcategory'}</option>
                    {categories.find(c => c.id === productForm.category)?.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>{isArabic ? sub.nameAr : sub.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-slate-500 font-black">{isArabic ? 'صور المنتج الفاخرة (حتى 5 صور)' : 'Luxury Product Images (Up to 5 images)'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <div key={index} className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">{isArabic ? `صورة ${index + 1}` : `Image ${index + 1}`}</span>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={productForm.images[index] || ''} 
                          onChange={(e) => {
                            const newImages = [...productForm.images];
                            newImages[index] = e.target.value;
                            setProductForm({
                              ...productForm,
                              images: newImages,
                              image: newImages[0] || productForm.image
                            });
                          }}
                          className="w-full p-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-[10px]" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">{isArabic ? 'الوصف بالإنجليزية' : 'Description (English)'}</label>
                  <textarea 
                    rows={2}
                    placeholder="Luxury oversized cotton sweatshirt with bespoke tailored stitching."
                    value={productForm.description} 
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">{isArabic ? 'الوصف بالعربية' : 'Description (Arabic)'}</label>
                  <textarea 
                    rows={2}
                    placeholder="سويت شيرت كلاسيكي اوفرسايز مصنوع من خامات قطنية راقية مع تفاصيل دقيقة للخياطة الفاخرة."
                    value={productForm.descriptionAr} 
                    onChange={(e) => setProductForm({...productForm, descriptionAr: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'المميزات بالإنجليزية (سطر لكل ميزة)' : 'Features (English, line-separated)'}</label>
                  <textarea 
                    rows={2}
                    placeholder="100% Cotton\nMade in Italy\nBespoke design"
                    value={productForm.features} 
                    onChange={(e) => setProductForm({...productForm, features: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'المميزات بالعربية (سطر لكل ميزة)' : 'Features (Arabic, line-separated)'}</label>
                  <textarea 
                    rows={2}
                    placeholder="قطن طبيعي فاخر 100%\nصنع يدوياً في إيطاليا\nتصميم حصري محدود"
                    value={productForm.featuresAr} 
                    onChange={(e) => setProductForm({...productForm, featuresAr: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                >
                  {isArabic ? 'حفظ ونشر المنتج' : 'Publish Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
