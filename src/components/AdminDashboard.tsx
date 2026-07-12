import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, ShieldAlert, DollarSign, Truck, Package, 
  Clock, CheckCircle, CreditCard, Lock, Unlock, Settings, Eye, 
  RefreshCw, ClipboardList, Check, X, AlertCircle, Sparkles, LogOut, Sliders, Image as ImageIcon,
  FileSpreadsheet, Download, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { 
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Order, ShippingStatus, Category, Subcategory } from '../types';
import { cleanUndefined } from '../utils';

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
  phone?: string;
  paymentAddress?: string;
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
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'gateways' | 'shipping' | 'categories' | 'settings'>('products');

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
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  
  // New Product Form State
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    price: 0,
    category: 'apparel' as string,
    categoryAr: 'ملابس وأزياء',
    subcategory: '',
    subcategoryAr: '',
    image: '',
    images: ['', '', '', '', ''] as string[],
    stock: 10,
    features: '',
    featuresAr: '',
    isFeatured: false,
    shippingPlanId: '',
  });

  // Dynamic Category Form States - مع إضافة حقل الصورة
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    nameAr: '',
    image: '' // إضافة حقل الصورة
  });

  // Dynamic Subcategory Form States
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState('');
  const [subcategoryForm, setSubcategoryForm] = useState({
    id: '',
    name: '',
    nameAr: ''
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ catId: string; subId: string } | null>(null);

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
    merchantId: '',
    phone: '',
    paymentAddress: ''
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

  // Site Settings Form State
  const [settingsForm, setSettingsForm] = useState({
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

  // Selected Order Detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [zoomedReceiptImage, setZoomedReceiptImage] = useState<string | null>(null);
  const [orderFilterTab, setOrderFilterTab] = useState<'processing' | 'shipped' | 'delivered' | 'rejected'>('processing');

  const isAdminEmail = (email?: string | null) => email?.trim().toLowerCase() === 'amrzikas20@gmail.com';

  const requireAdminAccess = () => {
    if (!user || !isAdminEmail(user.email)) {
      alert(isArabic ? 'يجب تسجيل الدخول بحساب أدمن صالح لتنفيذ هذا الإجراء.' : 'You must be signed in as a valid admin account to perform this action.');
      return false;
    }
    return true;
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryForm({ id: '', name: '', nameAr: '', image: '' });
  };

  const resetSubcategoryForm = () => {
    setShowSubcategoryForm(false);
    setEditingSubcategory(null);
    setSelectedParentCategoryId('');
    setSubcategoryForm({ id: '', name: '', nameAr: '' });
  };

  const openEditCategoryForm = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ 
      id: cat.id, 
      name: cat.name, 
      nameAr: cat.nameAr,
      image: cat.image || '' 
    });
    setShowCategoryForm(true);
    setShowSubcategoryForm(false);
  };

  const openEditSubcategoryForm = (catId: string, sub: Subcategory) => {
    setEditingSubcategory({ catId, subId: sub.id });
    setSelectedParentCategoryId(catId);
    setSubcategoryForm({ id: sub.id, name: sub.name, nameAr: sub.nameAr });
    setShowSubcategoryForm(true);
    setShowCategoryForm(false);
  };

  // 1. Check if user is super admin email or already verified
  useEffect(() => {
    if (user && isAdminEmail(user.email)) {
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setIsUnlocked(false);
      setAuthError(isArabic ? 'يجب تسجيل الدخول بحساب الأدمن للوصول إلى لوحة الإدارة.' : 'Admin access requires a valid signed-in admin account.');
    }
  }, [user, isArabic]);

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
        fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
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
        fetchedProds.push({ id: docSnap.id, ...docSnap.data() } as Product);
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
        fetchedGateways.push({ id: docSnap.id, ...docSnap.data() } as PaymentGateway);
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
        fetchedPlans.push({ id: docSnap.id, ...docSnap.data() } as ShippingPlan);
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
        fetchedCategories.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      setCategories(fetchedCategories);
    }, (err) => {
      console.error("Failed to load categories: ", err);
    });

    // Settings Subscription
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettingsForm(prev => ({ ...prev, ...data }));
      }
    }, (err) => {
      console.error("Failed to load settings: ", err);
    });

    setLoading(false);

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeGateways();
      unsubscribeShipping();
      unsubscribeCategories();
      unsubscribeSettings();
    };
  }, [isUnlocked]);

  // Handle Site Settings Submit
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAdminAccess()) return;
    try {
      await setDoc(doc(db, 'settings', 'store'), settingsForm);
      alert(isArabic ? 'تم حفظ إعدادات الموقع سحابياً بنجاح!' : 'Site settings saved successfully on the cloud!');
    } catch (error) {
      console.error("Error saving site settings: ", error);
      alert(isArabic ? 'فشل في حفظ إعدادات الموقع.' : 'Failed to save site settings.');
    }
  };

  // Add / Edit Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAdminAccess()) return;
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
      category: productForm.category as Product['category'],
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
      isFeatured: !!productForm.isFeatured,
      shippingPlanId: productForm.shippingPlanId || undefined
    };

    try {
      await setDoc(doc(db, 'products', pId), cleanUndefined(finalProduct));
      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${pId}`);
    }
  };

  // Excel Template Download Handler
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'ID (مثال: prod-1 أو اتركه فارغاً)': 'prod-example-1',
        'Name (English)': 'Bespoke Oud Perfume',
        'Name Ar (العربية)': 'عطر العود الملكي الفاخر',
        'Description (English)': 'Premium organic scent with rich oriental notes.',
        'Description Ar (العربية)': 'عطر عضوي فاخر بنفحات العود والمسك الشرقية المميزة.',
        'Price (السعر بالريال)': 450,
        'Category ID (معرّف الفئة)': 'apparel',
        'Subcategory ID (معرّف الفئة الفرعية)': '',
        'Stock (المخزون)': 15,
        'Primary Image URL (رابط الصورة الأساسية)': 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=600&auto=format&fit=crop',
        'Additional Image URLs (روابط الصور الإضافية مفصولة بفاصلة ,)': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=600&auto=format&fit=crop',
        'Features En (الميزات بالإنجليزية مفصولة بـ |)': 'Pure organic ingredients|Lasts up to 24 hours|Artisan hand-blown bottle',
        'Features Ar (الميزات بالعربية مفصولة بـ |)': 'مكونات عضوية نقية 100%|ثبات عالي يدوم لـ 24 ساعة|زجاجة مصممة يدوياً بعناية',
        'Is Featured (مميز - TRUE أو FALSE)': 'TRUE'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products Template');

    const wscols = [
      { wch: 25 }, // ID
      { wch: 25 }, // Name En
      { wch: 25 }, // Name Ar
      { wch: 35 }, // Desc En
      { wch: 35 }, // Desc Ar
      { wch: 15 }, // Price
      { wch: 15 }, // Category
      { wch: 18 }, // Subcategory
      { wch: 12 }, // Stock
      { wch: 40 }, // Image
      { wch: 40 }, // Images
      { wch: 30 }, // Features En
      { wch: 30 }, // Features Ar
      { wch: 15 }, // Featured
    ];
    ws['!cols'] = wscols;

    XLSX.writeFile(wb, 'zewka_products_template.xlsx');
  };

  // Excel File Upload Parser & Firestore Bulk Import
  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error('Could not read file data');

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          alert(isArabic ? 'ملف الاكسيل فارغ!' : 'Excel file is empty!');
          return;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          const idRaw = row['ID (مثال: prod-1 أو اتركه فارغاً)'] || row['ID'] || row['معرف المنتج'];
          const id = idRaw ? String(idRaw).trim().toLowerCase().replace(/\s+/g, '_') : `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          const name = row['Name (English)'] || row['Name'] || row['الاسم بالإنجليزية'];
          const nameAr = row['Name Ar (العربية)'] || row['NameAr'] || row['الاسم بالعربية'];
          
          if (!name || !nameAr) {
            errorCount++;
            continue; // Name En and Name Ar are required fields
          }

          const description = row['Description (English)'] || row['Description'] || '';
          const descriptionAr = row['Description Ar (العربية)'] || row['DescriptionAr'] || '';
          
          const priceRaw = row['Price (السعر بالريال)'] || row['Price'] || row['السعر'];
          const price = Number(priceRaw || 0);

          const categoryId = row['Category ID (معرّف الفئة)'] || row['Category'] || 'apparel';
          const subcategoryId = row['Subcategory ID (معرّف الفئة الفرعية)'] || row['Subcategory'] || '';
          
          const stockRaw = row['Stock (المخزون)'] || row['Stock'] || 10;
          const stock = Number(stockRaw);

          const image = row['Primary Image URL (رابط الصورة الأساسية)'] || row['Image'] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff';
          
          const rawImages = row['Additional Image URLs (روابط الصور الإضافية مفصولة بفاصلة ,)'] || row['Images'] || '';
          const imagesList = rawImages ? String(rawImages).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
          if (image && !imagesList.includes(image)) {
            imagesList.unshift(image);
          }

          const rawFeatures = row['Features En (الميزات بالإنجليزية مفصولة بـ |)'] || row['Features'] || '';
          const features = rawFeatures ? String(rawFeatures).split('|').map((s: string) => s.trim()).filter(Boolean) : [];

          const rawFeaturesAr = row['Features Ar (الميزات بالعربية مفصولة بـ |)'] || row['FeaturesAr'] || '';
          const featuresAr = rawFeaturesAr ? String(rawFeaturesAr).split('|').map((s: string) => s.trim()).filter(Boolean) : [];

          const isFeaturedStr = String(row['Is Featured (مميز - TRUE أو FALSE)'] || row['IsFeatured'] || '').toUpperCase();
          const isFeatured = isFeaturedStr === 'TRUE' || isFeaturedStr === 'YES' || isFeaturedStr === 'نعم';

          // Automatically derive Arabic Category and Subcategory strings
          const matchedCat = categories.find(c => c.id === categoryId);
          const categoryAr = matchedCat ? matchedCat.nameAr : 'أخرى';
          const matchedSub = matchedCat?.subcategories?.find(s => s.id === subcategoryId);
          const subcategoryAr = matchedSub ? matchedSub.nameAr : '';

          const finalProduct: Product = {
            id,
            name: String(name),
            nameAr: String(nameAr),
            description: String(description),
            descriptionAr: String(descriptionAr),
            price,
            category: categoryId,
            categoryAr,
            subcategory: subcategoryId || undefined,
            subcategoryAr: subcategoryAr || undefined,
            rating: 5,
            reviewsCount: 0,
            image,
            images: imagesList.length > 0 ? imagesList : [image],
            features,
            featuresAr,
            specs: {},
            specsAr: {},
            stock,
            isFeatured,
          };

          await setDoc(doc(db, 'products', id), cleanUndefined(finalProduct));
          importedCount++;
        }

        alert(isArabic 
          ? `🎉 تم استيراد ${importedCount} منتج بنجاح إلى الفايرستور! الأخطاء المتخطاة: ${errorCount}`
          : `🎉 Successfully imported ${importedCount} products to Firestore! Skipped errors: ${errorCount}`
        );
        
        // Reset file input
        e.target.value = '';
      } catch (err) {
        console.error(err);
        alert(isArabic ? '❌ فشل تحليل ملف Excel. يرجى التأكد من صياغة وتنسيق خلايا الجدول.' : '❌ Failed to parse Excel file. Please ensure cells layout is correct.');
      }
    };
    reader.readAsBinaryString(file);
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
      isFeatured: false,
      shippingPlanId: '',
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
      isFeatured: !!prod.isFeatured,
      shippingPlanId: prod.shippingPlanId || '',
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!requireAdminAccess()) return;
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا المنتج نهائياً؟' : 'Are you sure you want to permanently delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setSelectedProductIds(prev => prev.filter(pId => pId !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleBulkDelete = async () => {
    if (!requireAdminAccess()) return;
    if (selectedProductIds.length === 0) return;

    const confirmMsg = isArabic 
      ? `هل أنت متأكد من رغبتك في حذف ${selectedProductIds.length} منتجاً محدداً نهائياً؟` 
      : `Are you sure you want to permanently delete ${selectedProductIds.length} selected products?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const deletePromises = selectedProductIds.map(id => deleteDoc(doc(db, 'products', id)));
      await Promise.all(deletePromises);
      setSelectedProductIds([]);
      alert(isArabic ? 'تم حذف المنتجات المحددة بنجاح!' : 'Selected products deleted successfully!');
    } catch (error) {
      console.error(error);
      alert(isArabic ? 'حدث خطأ أثناء محاولة حذف بعض المنتجات.' : 'An error occurred while deleting products.');
    }
  };

  const handleBulkToggleFeatured = async (isFeatured: boolean) => {
    if (!requireAdminAccess()) return;
    if (selectedProductIds.length === 0) return;

    try {
      const updatePromises = selectedProductIds.map(id => updateDoc(doc(db, 'products', id), { isFeatured }));
      await Promise.all(updatePromises);
      setSelectedProductIds([]);
      alert(isArabic ? 'تم تحديث حالة تمييز المنتجات بنجاح!' : 'Products featured status updated successfully!');
    } catch (error) {
      console.error(error);
      alert(isArabic ? 'حدث خطأ أثناء تحديث المنتجات.' : 'An error occurred while updating products.');
    }
  };

  const handleBulkUpdateStock = async () => {
    if (!requireAdminAccess()) return;
    if (selectedProductIds.length === 0) return;

    const promptMsg = isArabic 
      ? 'أدخل قيمة المخزون الجديدة للمنتجات المحددة:' 
      : 'Enter the new stock quantity for selected products:';
    const input = window.prompt(promptMsg);
    if (input === null) return;
    const newStock = parseInt(input, 10);
    if (isNaN(newStock) || newStock < 0) {
      alert(isArabic ? 'الرجاء إدخال رقم صحيح وموجب!' : 'Please enter a valid non-negative number!');
      return;
    }

    try {
      const updatePromises = selectedProductIds.map(id => updateDoc(doc(db, 'products', id), { stock: newStock }));
      await Promise.all(updatePromises);
      setSelectedProductIds([]);
      alert(isArabic ? 'تم تحديث مخزون المنتجات بنجاح!' : 'Product stock updated successfully!');
    } catch (error) {
      console.error(error);
      alert(isArabic ? 'حدث خطأ أثناء تحديث المخزون.' : 'An error occurred while updating stock.');
    }
  };

  const handleBulkChangeCategory = async (categoryId: string) => {
    if (!categoryId) return;
    if (!requireAdminAccess()) return;
    if (selectedProductIds.length === 0) return;

    const matchedCat = categories.find(c => c.id === categoryId);
    if (!matchedCat) return;

    const categoryAr = matchedCat.nameAr || 'أخرى';

    const confirmMsg = isArabic
      ? `هل تريد نقل ${selectedProductIds.length} منتجاً إلى الفئة "${matchedCat.nameAr}"؟`
      : `Do you want to move ${selectedProductIds.length} products to category "${matchedCat.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updatePromises = selectedProductIds.map(id => 
        updateDoc(doc(db, 'products', id), { 
          category: categoryId,
          categoryAr: categoryAr,
          subcategory: '',
          subcategoryAr: ''
        })
      );
      await Promise.all(updatePromises);
      setSelectedProductIds([]);
      alert(isArabic ? 'تم نقل المنتجات للفئة الجديدة بنجاح!' : 'Products moved to the new category successfully!');
    } catch (error) {
      console.error(error);
      alert(isArabic ? 'حدث خطأ أثناء تغيير فئة المنتجات.' : 'An error occurred while changing product categories.');
    }
  };

  // Add Category Submit - مع حفظ الصورة
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAdminAccess()) return;
    if (!categoryForm.name || !categoryForm.nameAr) {
      alert(isArabic ? 'الرجاء ملء جميع الحقول المطلوبة للفئة' : 'Please fill all required fields for the category');
      return;
    }

    const categoryId = editingCategoryId || categoryForm.id.trim().toLowerCase();
    if (!categoryId) {
      alert(isArabic ? 'الرجاء إدخال معرف فئة صحيح' : 'Please enter a valid category ID');
      return;
    }

    const existingCategory = categories.find((cat) => cat.id === editingCategoryId);
    const newCategory: Category = {
      id: categoryId,
      name: categoryForm.name.trim(),
      nameAr: categoryForm.nameAr.trim(),
      image: categoryForm.image.trim() || undefined,
      subcategories: existingCategory?.subcategories || []
    };

    try {
      await setDoc(doc(db, 'categories', categoryId), newCategory);
      resetCategoryForm();
    } catch (error) {
      console.error("Error saving category: ", error);
      alert(isArabic ? 'فشل حفظ الفئة' : 'Failed to save category');
    }
  };

  // Add Subcategory Submit
  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAdminAccess()) return;
    if (!selectedParentCategoryId) {
      alert(isArabic ? 'الرجاء اختيار الفئة الرئيسية أولاً' : 'Please select the parent category first');
      return;
    }
    if (!subcategoryForm.name || !subcategoryForm.nameAr) {
      alert(isArabic ? 'الرجاء ملء جميع الحقول الفرعية' : 'Please fill all subcategory fields');
      return;
    }

    const parentCat = categories.find(c => c.id === selectedParentCategoryId);
    if (!parentCat) return;

    const subcategoryId = editingSubcategory?.subId || subcategoryForm.id.trim().toLowerCase();
    if (!subcategoryId) {
      alert(isArabic ? 'الرجاء إدخال معرف فئة فرعية صحيح' : 'Please enter a valid subcategory ID');
      return;
    }

    const newSub: Subcategory = {
      id: subcategoryId,
      name: subcategoryForm.name.trim(),
      nameAr: subcategoryForm.nameAr.trim()
    };

    const currentSubs = parentCat.subcategories || [];
    const isEditingExisting = Boolean(editingSubcategory);
    const updatedSubs = isEditingExisting
      ? currentSubs.map((sub) => sub.id === editingSubcategory?.subId ? newSub : sub)
      : currentSubs.some((sub) => sub.id === subcategoryId)
        ? currentSubs
        : [...currentSubs, newSub];

    if (!isEditingExisting && currentSubs.some((sub) => sub.id === subcategoryId)) {
      alert(isArabic ? 'هذه الفئة الفرعية موجودة بالفعل!' : 'This subcategory already exists!');
      return;
    }

    const updatedCategory: Category = {
      ...parentCat,
      subcategories: updatedSubs
    };

    try {
      await setDoc(doc(db, 'categories', selectedParentCategoryId), updatedCategory);
      resetSubcategoryForm();
    } catch (error) {
      console.error("Error saving subcategory: ", error);
      alert(isArabic ? 'فشل حفظ الفئة الفرعية' : 'Failed to save subcategory');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!requireAdminAccess()) return;
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الفئة بالكامل؟' : 'Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
    } catch (error) {
      console.error("Error deleting category: ", error);
    }
  };

  // Delete Subcategory
  const handleDeleteSubcategory = async (catId: string, subId: string) => {
    if (!requireAdminAccess()) return;
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

  // Update Order Payment Status
  const handleUpdateOrderPaymentStatus = async (orderId: string, nextPaymentStatus: 'verified' | 'rejected' | 'pending_verification') => {
    try {
      const updates: any = {
        paymentStatus: nextPaymentStatus
      };
      if (nextPaymentStatus === 'rejected') {
        updates.shippingStatus = 'rejected';
      }
      await updateDoc(doc(db, 'orders', orderId), updates);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => {
          if (!prev) return null;
          const updated = { ...prev, paymentStatus: nextPaymentStatus };
          if (nextPaymentStatus === 'rejected') {
            updated.shippingStatus = 'rejected';
          }
          return updated;
        });
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
      merchantId: gatewayForm.merchantId,
      phone: gatewayForm.phone,
      paymentAddress: gatewayForm.paymentAddress
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
        merchantId: '',
        phone: '',
        paymentAddress: ''
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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center font-sans overflow-hidden" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      <motion.div 
        initial={{ x: isArabic ? -100 : 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full h-full bg-white shadow-2xl flex flex-col relative"
      >
        {/* Header bar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
              <Settings className="w-5 h-5" />
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

              {/* Site Settings */}
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full px-4 py-3 text-xs font-black tracking-wider transition-all rounded-xl cursor-pointer flex items-center gap-3 ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>{isArabic ? 'إعدادات الموقع المتقدمة' : 'Site Settings'}</span>
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

                  {/* Excel Bulk Import / Export Control Panel */}
                  <div className="bg-slate-50 border-2 border-slate-100/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">
                          {isArabic ? 'إضافة المنتجات عبر ملف إكسيل (XLSX)' : 'Bulk Import Products via Excel (XLSX)'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold">
                          {isArabic 
                            ? 'قم بتحميل ملف النموذج، وتعبئته ببيانات منتجاتك الفاخرة، ثم ارفع الملف لتسجيلها سحابياً بالكامل.' 
                            : 'Download our standard spreadsheet template, fill it with your luxury items data, and upload to sync on cloud.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 text-[11px] font-black rounded-xl transition cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'تحميل نموذج Excel' : 'Download Template'}</span>
                      </button>

                      <label className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-xl transition cursor-pointer shadow-sm border border-indigo-100/50">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'رفع الملف المعبأ' : 'Upload Spreadsheet'}</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls"
                          onChange={handleUploadExcel}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
                      <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-black text-slate-400">{isArabic ? 'كتالوج المنتجات فارغ حالياً في السحابة. أضف المنتجات من خلال Firestore أو من لوحة الإدارة.' : 'No cloud products found. Add products from Firestore or the admin panel.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedProductIds.length > 0 && (
                        <div className="bg-indigo-50 border-2 border-indigo-100/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-indigo-950">
                                {isArabic 
                                  ? `تم تحديد ${selectedProductIds.length} من المنتجات` 
                                  : `${selectedProductIds.length} products selected`}
                              </h4>
                              <p className="text-[10px] text-indigo-500 font-bold mt-0.5">
                                {isArabic 
                                  ? 'اختر أحد الإجراءات الجماعية لتطبيقها على كافة المنتجات المحددة:' 
                                  : 'Select a bulk action to apply on all selected products:'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                            {/* Bulk Delete */}
                            <button
                              type="button"
                              onClick={handleBulkDelete}
                              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isArabic ? 'حذف المحدد' : 'Delete Selected'}</span>
                            </button>

                            {/* Bulk Stock */}
                            <button
                              type="button"
                              onClick={handleBulkUpdateStock}
                              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>{isArabic ? 'تعديل المخزون' : 'Set Stock'}</span>
                            </button>

                            {/* Bulk Feature */}
                            <button
                              type="button"
                              onClick={() => handleBulkToggleFeatured(true)}
                              className="px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span>{isArabic ? 'تمييز المحدد' : 'Feature'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBulkToggleFeatured(false)}
                              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{isArabic ? 'إلغاء التمييز' : 'Unfeature'}</span>
                            </button>

                            {/* Bulk Category dropdown */}
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                              <span className="text-[9px] text-slate-400 font-black whitespace-nowrap">
                                {isArabic ? 'نقل إلى:' : 'Move to:'}
                              </span>
                              <select
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) {
                                    handleBulkChangeCategory(val);
                                    e.target.value = '';
                                  }
                                }}
                                className="bg-transparent border-none text-[10px] text-indigo-600 font-black focus:outline-none focus:ring-0 cursor-pointer p-0"
                                defaultValue=""
                              >
                                <option value="" disabled>{isArabic ? 'الفئة...' : 'Category...'}</option>
                                {categories.map(c => (
                                  <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Deselect All */}
                            <button
                              type="button"
                              onClick={() => setSelectedProductIds([])}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                              title={isArabic ? 'إلغاء التحديد' : 'Deselect All'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-xs text-slate-600" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                          <thead className="bg-slate-50 font-black text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 w-10 text-center">
                                <input 
                                  type="checkbox"
                                  checked={selectedProductIds.length === products.length && products.length > 0}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds(products.map(p => p.id));
                                    } else {
                                      setSelectedProductIds([]);
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </th>
                              <th className="px-4 py-3" style={{ textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? 'المنتج' : 'Product'}</th>
                              <th className="px-4 py-3" style={{ textAlign: isArabic ? 'right' : 'left' }}>{isArabic ? 'الفئة' : 'Category'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'السعر' : 'Price'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'المخزون' : 'Stock'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'التقييم' : 'Rating'}</th>
                              <th className="px-4 py-3 text-center">{isArabic ? 'خيارات' : 'Options'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-bold">
                            {products.map((prod) => {
                              const isChecked = selectedProductIds.includes(prod.id);
                              return (
                                <tr key={prod.id} className={`hover:bg-slate-50/50 transition ${isChecked ? 'bg-indigo-50/30' : ''}`}>
                                  <td className="px-4 py-3 w-10 text-center">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedProductIds(prev => [...prev, prod.id]);
                                        } else {
                                          setSelectedProductIds(prev => prev.filter(id => id !== prod.id));
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
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
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==================== ORDERS TAB ==================== */}
              {activeTab === 'orders' && (() => {
                const processingCount = orders.filter(o => o.shippingStatus === 'placed' || o.shippingStatus === 'processing').length;
                const shippedCount = orders.filter(o => o.shippingStatus === 'shipped').length;
                const deliveredCount = orders.filter(o => o.shippingStatus === 'delivered').length;
                const rejectedCount = orders.filter(o => o.shippingStatus === 'rejected').length;

                const filteredOrders = orders.filter((order) => {
                  if (orderFilterTab === 'processing') return order.shippingStatus === 'placed' || order.shippingStatus === 'processing';
                  if (orderFilterTab === 'shipped') return order.shippingStatus === 'shipped';
                  if (orderFilterTab === 'delivered') return order.shippingStatus === 'delivered';
                  if (orderFilterTab === 'rejected') return order.shippingStatus === 'rejected';
                  return true;
                });

                return (
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
                      <div className="space-y-4">
                        {/* Sub-tabs bar */}
                        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                          <button
                            onClick={() => setOrderFilterTab('processing')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                              orderFilterTab === 'processing'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isArabic ? 'قيد المعالجة' : 'Processing'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              orderFilterTab === 'processing' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {processingCount}
                            </span>
                          </button>

                          <button
                            onClick={() => setOrderFilterTab('shipped')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                              orderFilterTab === 'shipped'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isArabic ? 'تم الشحن' : 'Shipped'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              orderFilterTab === 'shipped' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {shippedCount}
                            </span>
                          </button>

                          <button
                            onClick={() => setOrderFilterTab('delivered')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                              orderFilterTab === 'delivered'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isArabic ? 'تم توصيله' : 'Delivered'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              orderFilterTab === 'delivered' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {deliveredCount}
                            </span>
                          </button>

                          <button
                            onClick={() => setOrderFilterTab('rejected')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                              orderFilterTab === 'rejected'
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isArabic ? 'مرفوض' : 'Rejected'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              orderFilterTab === 'rejected' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                            }`}>
                              {rejectedCount}
                            </span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Orders List Table */}
                          <div className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
                            {filteredOrders.length === 0 ? (
                              <div className="p-12 text-center text-slate-400">
                                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs font-black">{isArabic ? 'لا توجد طلبات في هذا القسم حالياً.' : 'No orders in this category yet.'}</p>
                              </div>
                            ) : (
                              <table className="w-full text-xs text-slate-600" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                <thead className="bg-slate-50 font-black text-slate-500 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-4 py-3">{isArabic ? 'رقم الطلب' : 'Order ID'}</th>
                                    <th className="px-4 py-3">{isArabic ? 'العميل' : 'Customer'}</th>
                                    <th className="px-4 py-3 text-center">{isArabic ? 'التاريخ' : 'Date'}</th>
                                    <th className="px-4 py-3 text-center">{isArabic ? 'الإجمالي' : 'Total'}</th>
                                    <th className="px-4 py-3 text-center">{isArabic ? 'الدفع' : 'Payment'}</th>
                                    <th className="px-4 py-3 text-center">{isArabic ? 'الحالة' : 'Status'}</th>
                                    <th className="px-4 py-3 text-center">{isArabic ? 'معاينة' : 'View'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-bold">
                                  {filteredOrders.map((order) => (
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
                                        <div className="flex flex-col items-center">
                                          <span className="text-[10px] text-slate-700 block max-w-[100px] truncate">
                                            {order.paymentGatewayName || (isArabic ? 'بطاقة ائتمانية' : 'Credit Card')}
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase mt-1 inline-block ${
                                            order.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                                            order.paymentStatus === 'rejected' ? 'bg-red-50 text-red-500' :
                                            'bg-amber-50 text-amber-600'
                                          }`}>
                                            {order.paymentStatus === 'verified' ? (isArabic ? 'مقبول' : 'Verified') :
                                             order.paymentStatus === 'rejected' ? (isArabic ? 'مرفوض' : 'Rejected') :
                                             (isArabic ? 'قيد المراجعة' : 'Pending')}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] inline-block font-black uppercase ${
                                          order.shippingStatus === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                                          order.shippingStatus === 'shipped' ? 'bg-blue-50 text-blue-600' :
                                          order.shippingStatus === 'processing' ? 'bg-amber-50 text-amber-600' :
                                          order.shippingStatus === 'rejected' ? 'bg-red-50 text-red-500' :
                                          'bg-purple-50 text-purple-600'
                                        }`}>
                                          {order.shippingStatus === 'delivered' ? (isArabic ? 'تم التوصيل' : 'Delivered') :
                                           order.shippingStatus === 'shipped' ? (isArabic ? 'تم الشحن' : 'Shipped') :
                                           order.shippingStatus === 'processing' ? (isArabic ? 'قيد المعالجة' : 'Processing') :
                                           order.shippingStatus === 'rejected' ? (isArabic ? 'مرفوض' : 'Rejected') :
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
                            )}
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

                                {/* Payment details and actions */}
                                <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                                  <h5 className="font-black text-slate-700 flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{isArabic ? 'تفاصيل الدفع والتحقق' : 'Payment & Verification'}</span>
                                  </h5>

                                  <div className="p-3 bg-white border border-slate-200/50 rounded-xl space-y-3 font-bold">
                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-slate-400">{isArabic ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                                      <span className="text-slate-800 font-black">
                                        {selectedOrder.paymentGatewayName || (isArabic ? 'بطاقة ائتمانية' : 'Credit Card')}
                                      </span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px]">
                                      <span className="text-slate-400">{isArabic ? 'حالة الدفع:' : 'Payment Status:'}</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        selectedOrder.paymentStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                                        selectedOrder.paymentStatus === 'rejected' ? 'bg-red-50 text-red-500' :
                                        'bg-amber-50 text-amber-600'
                                      }`}>
                                        {selectedOrder.paymentStatus === 'verified' ? (isArabic ? 'مقبول / مؤكد' : 'Verified') :
                                         selectedOrder.paymentStatus === 'rejected' ? (isArabic ? 'مرفوض' : 'Rejected') :
                                         (isArabic ? 'بانتظار التحقق' : 'Pending')}
                                      </span>
                                    </div>

                                    {/* Uploaded transfer receipt preview */}
                                    {selectedOrder.receiptImage && (
                                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                        <span className="text-[10px] text-slate-400 block font-black">{isArabic ? 'إيصال التحويل المرفق من العميل:' : 'Attached Transfer Receipt:'}</span>
                                        <div className="relative group overflow-hidden rounded-xl border border-slate-200 max-h-36">
                                          <img 
                                            src={selectedOrder.receiptImage} 
                                            alt="Payment Receipt" 
                                            className="w-full h-auto object-cover max-h-32 hover:scale-105 transition duration-300" 
                                            referrerPolicy="no-referrer"
                                          />
                                          <button 
                                            type="button"
                                            onClick={() => setZoomedReceiptImage(selectedOrder.receiptImage || null)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-black gap-1 cursor-pointer"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>{isArabic ? 'تكبير الإيصال' : 'Zoom Receipt'}</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Payment verification actions */}
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                      <button
                                        onClick={() => handleUpdateOrderPaymentStatus(selectedOrder.id, 'verified')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                                          selectedOrder.paymentStatus === 'verified'
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                                            : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                                        }`}
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>{isArabic ? 'الموافقة على الدفع' : 'Approve Payment'}</span>
                                      </button>
                                      <button
                                        onClick={() => handleUpdateOrderPaymentStatus(selectedOrder.id, 'rejected')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition cursor-pointer text-center flex items-center justify-center gap-1 ${
                                          selectedOrder.paymentStatus === 'rejected'
                                            ? 'bg-red-600 text-white shadow-sm shadow-red-600/10'
                                            : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
                                        }`}
                                      >
                                        <X className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>{isArabic ? 'رفض الدفع' : 'Reject Payment'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Shipping Status Action Buttons */}
                                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                  <h5 className="text-xs font-black text-slate-700 flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{isArabic ? 'تحديث حالة الشحن والتوصيل' : 'Update Shipping Status'}</span>
                                  </h5>

                                  {selectedOrder.paymentStatus === 'verified' ? (
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
                                  ) : selectedOrder.shippingStatus === 'rejected' ? (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                                      <p className="text-[10px] text-red-700 font-black leading-relaxed">
                                        {isArabic 
                                          ? '❌ تم رفض هذا الطلب وإلغاؤه بنجاح.' 
                                          : '❌ This order has been rejected and canceled.'}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                                      <p className="text-[10px] text-amber-700 font-black leading-relaxed">
                                        {isArabic 
                                          ? '⚠️ يرجى الموافقة أولاً على الدفع الذي قام به العميل لتتمكن من متابعة التجهيز والشحن.' 
                                          : '⚠️ Please approve customer payment first to unlock preparation and shipping procedures.'}
                                      </p>
                                    </div>
                                  )}
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
                      </div>
                    )}
                  </div>
                );
              })()}

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
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'رقم الهاتف للتحويل (اختياري للتحويل السريع)' : 'Phone Number for Transfer (Optional for quick wallet)'}</label>
                          <input 
                            type="text" 
                            placeholder="01012345678"
                            value={gatewayForm.phone} 
                            onChange={(e) => setGatewayForm({...gatewayForm, phone: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'عنوان الدفع / رقم الحساب / الآيبان (اختياري)' : 'Payment Address / Bank Account / IBAN (Optional)'}</label>
                          <input 
                            type="text" 
                            placeholder="EG1234567890123456789012"
                            value={gatewayForm.paymentAddress} 
                            onChange={(e) => setGatewayForm({...gatewayForm, paymentAddress: e.target.value})}
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
                          {gw.phone && (
                            <div className="p-2 bg-indigo-50/50 rounded-lg text-[10px] text-indigo-700 mb-2 flex justify-between">
                              <span>{isArabic ? 'رقم التحويل:' : 'Transfer Phone:'}</span>
                              <span className="font-mono font-bold">{gw.phone}</span>
                            </div>
                          )}
                          {gw.paymentAddress && (
                            <div className="p-2 bg-[#F5F5F3] rounded-lg text-[10px] text-slate-700 mb-2 flex justify-between truncate">
                              <span>{isArabic ? 'عنوان الدفع/الآيبان:' : 'Account/IBAN:'}</span>
                              <span className="font-mono font-bold">{gw.paymentAddress}</span>
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

              {/* ==================== CATEGORIES TAB ==================== */}
              {activeTab === 'categories' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{isArabic ? 'إدارة الفئات والفرعيات' : 'Category & Subcategory Management'}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? 'إدارة الفئات الرئيسية والفرعيات مع إمكانية إضافة صور لكل فئة.' : 'Manage parent categories and subcategories with image support for each category.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setShowCategoryForm(true);
                          setShowSubcategoryForm(false);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'فئة رئيسية جديدة' : 'New Parent Category'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowSubcategoryForm(true);
                          setShowCategoryForm(false);
                          if (categories.length > 0 && !selectedParentCategoryId) {
                            setSelectedParentCategoryId(categories[0].id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'فئة فرعية جديدة' : 'New Subcategory'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Parent Category Form - مع حقل الصورة */}
                  {showCategoryForm && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-800">
                          {editingCategoryId ? (isArabic ? 'تعديل الفئة الرئيسية' : 'Edit Parent Category') : (isArabic ? 'إنشاء فئة رئيسية جديدة' : 'Create New Parent Category')}
                        </h4>
                        <button onClick={() => resetCategoryForm()} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>

                      <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'المعرف الفريد (ID بالإنجليزية)' : 'Unique Category ID (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            disabled={Boolean(editingCategoryId)}
                            placeholder="e.g. accessories"
                            value={categoryForm.id} 
                            onChange={(e) => setCategoryForm({...categoryForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Accessories"
                            value={categoryForm.name} 
                            onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="مثال: الإكسسوارات الفاخرة"
                            value={categoryForm.nameAr} 
                            onChange={(e) => setCategoryForm({...categoryForm, nameAr: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'رابط صورة الفئة' : 'Category Image URL'}</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/..."
                              value={categoryForm.image} 
                              onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                              className="flex-1 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                            {categoryForm.image && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                <img 
                                  src={categoryForm.image} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{isArabic ? 'أدخل رابط صورة تعبر عن الفئة (اختياري)' : 'Enter an image URL that represents the category (optional)'}</p>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => resetCategoryForm()}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition cursor-pointer"
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                          >
                            {editingCategoryId ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إضافة الفئة الرئيسية' : 'Save Category')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Add Subcategory Form */}
                  {showSubcategoryForm && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-800">
                          {editingSubcategory ? (isArabic ? 'تعديل الفئة الفرعية' : 'Edit Subcategory') : (isArabic ? 'إنشاء فئة فرعية جديدة' : 'Create New Subcategory')}
                        </h4>
                        <button onClick={() => resetSubcategoryForm()} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                      </div>

                      <form onSubmit={handleSubcategorySubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الفئة الرئيسية الحاضنة' : 'Parent Category'}</label>
                          <select
                            value={selectedParentCategoryId}
                            onChange={(e) => setSelectedParentCategoryId(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                          >
                            {categories.length === 0 ? (
                              <option value="">{isArabic ? 'لا توجد فئات' : 'No categories'}</option>
                            ) : (
                              categories.map(c => (
                                <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.name}</option>
                              ))
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'معرف الفئة الفرعية (ID بالإنجليزية)' : 'Subcategory ID (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            disabled={Boolean(editingSubcategory)}
                            placeholder="e.g. sunglasses"
                            value={subcategoryForm.id} 
                            onChange={(e) => setSubcategoryForm({...subcategoryForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالإنجليزية' : 'Name (English)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. Sunglasses"
                            value={subcategoryForm.name} 
                            onChange={(e) => setSubcategoryForm({...subcategoryForm, name: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">{isArabic ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="مثال: نظارات شمسية"
                            value={subcategoryForm.nameAr} 
                            onChange={(e) => setSubcategoryForm({...subcategoryForm, nameAr: e.target.value})}
                            className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                          />
                        </div>

                        <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => resetSubcategoryForm()}
                            className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition cursor-pointer"
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                          >
                            {editingSubcategory ? (isArabic ? 'حفظ التعديلات' : 'Save Changes') : (isArabic ? 'إضافة الفئة الفرعية' : 'Save Subcategory')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Categories Grid - مع عرض الصورة */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categories.map((cat) => (
                      <div 
                        key={cat.id} 
                        className="p-5 bg-white border-2 border-slate-50 hover:border-slate-100 rounded-3xl shadow-sm relative flex flex-col justify-between font-bold text-xs"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              {/* عرض صورة الفئة */}
                              {cat.image ? (
                                <img 
                                  src={cat.image} 
                                  alt={isArabic ? cat.nameAr : cat.name}
                                  className="w-16 h-16 rounded-2xl object-cover border border-slate-100"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-100">
                                  <ImageIcon className="w-6 h-6 text-slate-300" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-black text-sm text-slate-800">{isArabic ? cat.nameAr : cat.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cat.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openEditCategoryForm(cat)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                                title={isArabic ? 'تعديل الفئة الرئيسية' : 'Edit Parent Category'}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                title={isArabic ? 'حذف الفئة الرئيسية بالكامل' : 'Delete Parent Category'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {cat.subcategories && cat.subcategories.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cat.subcategories.map((sub) => (
                                <div 
                                  key={sub.id} 
                                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700"
                                >
                                  <span>{isArabic ? sub.nameAr : sub.name}</span>
                                  <span className="text-[9px] font-mono text-slate-400">({sub.id})</span>
                                  <button
                                    onClick={() => openEditSubcategoryForm(cat.id, sub)}
                                    className="text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 p-0.5 transition cursor-pointer"
                                    title={isArabic ? 'تعديل الفئة الفرعية' : 'Edit Subcategory'}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                                    className="text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 p-0.5 transition cursor-pointer"
                                    title={isArabic ? 'حذف الفئة الفرعية' : 'Delete Subcategory'}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic font-medium mt-2">{isArabic ? 'لا توجد فئات فرعية مضافة بعد.' : 'No subcategories registered.'}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ==================== SITE SETTINGS TAB ==================== */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{isArabic ? 'إعدادات المتجر العامة والمحتوى' : 'Site Configuration & Core Content'}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{isArabic ? 'تخصيص الهوية والأسعار والمحتوى الترويجي المعروض على الصفحة الرئيسية مباشرة.' : 'Configure general boutique branding, tax rates, currency, and primary hero banners.'}</p>
                  </div>

                  <form onSubmit={handleSettingsSubmit} className="space-y-6 text-xs font-bold text-slate-600">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Card 1: Branding & Contact */}
                      <div className="bg-white border-2 border-slate-50 rounded-3xl p-5 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                          <Sliders className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-800">{isArabic ? 'الهوية الأساسية والتواصل' : 'Core Identity & Contacts'}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'اسم المتجر (إنجليزية)' : 'Store Name (English)'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.storeName} 
                              onChange={(e) => setSettingsForm({...settingsForm, storeName: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'اسم المتجر (عربية)' : 'Store Name (Arabic)'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.storeNameAr} 
                              onChange={(e) => setSettingsForm({...settingsForm, storeNameAr: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 mb-1">{isArabic ? 'الشعار / الوصف القصير (إنجليزية)' : 'Tagline (English)'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.tagline} 
                              onChange={(e) => setSettingsForm({...settingsForm, tagline: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 mb-1">{isArabic ? 'الشعار / الوصف القصير (عربية)' : 'Tagline (Arabic)'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.taglineAr} 
                              onChange={(e) => setSettingsForm({...settingsForm, taglineAr: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'بريد الدعم والمبيعات' : 'Support Email'}</label>
                            <input 
                              type="email" 
                              required
                              value={settingsForm.supportEmail} 
                              onChange={(e) => setSettingsForm({...settingsForm, supportEmail: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'هاتف التواصل والواتساب' : 'Support Phone'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.supportPhone} 
                              onChange={(e) => setSettingsForm({...settingsForm, supportPhone: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'رابط فيسبوك' : 'Facebook Link'}</label>
                            <input 
                              type="text" 
                              value={settingsForm.facebook || ''} 
                              onChange={(e) => setSettingsForm({...settingsForm, facebook: e.target.value})}
                              placeholder="https://facebook.com/..."
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'رابط إنستغرام' : 'Instagram Link'}</label>
                            <input 
                              type="text" 
                              value={settingsForm.instagram || ''} 
                              onChange={(e) => setSettingsForm({...settingsForm, instagram: e.target.value})}
                              placeholder="https://instagram.com/..."
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'رابط تويتر / X' : 'Twitter / X Link'}</label>
                            <input 
                              type="text" 
                              value={settingsForm.twitter || ''} 
                              onChange={(e) => setSettingsForm({...settingsForm, twitter: e.target.value})}
                              placeholder="https://twitter.com/..."
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'رابط تيك توك' : 'TikTok Link'}</label>
                            <input 
                              type="text" 
                              value={settingsForm.tiktok || ''} 
                              onChange={(e) => setSettingsForm({...settingsForm, tiktok: e.target.value})}
                              placeholder="https://tiktok.com/@..."
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Financials & Operations */}
                      <div className="bg-white border-2 border-slate-50 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <DollarSign className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-xs font-black text-slate-800">{isArabic ? 'المالية وتراخيص النظام' : 'Finance & Store Operations'}</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-500 mb-1">{isArabic ? 'العملة الافتراضية' : 'Default Currency'}</label>
                              <select 
                                value={settingsForm.currency} 
                                onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-xs font-bold" 
                              >
                                <option value="SAR">SAR (ر.س)</option>
                                <option value="USD">USD ($)</option>
                                <option value="AED">AED (د.إ)</option>
                                <option value="KWD">KWD (د.ك)</option>
                                <option value="EGP">EGP (ج.م)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 mb-1">{isArabic ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT / Tax Rate (%)'}</label>
                              <input 
                                type="number" 
                                required
                                min="0"
                                max="100"
                                value={settingsForm.vatPercent} 
                                onChange={(e) => setSettingsForm({...settingsForm, vatPercent: Number(e.target.value)})}
                                className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Maintenance Mode */}
                        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="maintenanceModeCheckbox"
                            checked={settingsForm.maintenanceMode} 
                            onChange={(e) => setSettingsForm({...settingsForm, maintenanceMode: e.target.checked})}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                          />
                          <div>
                            <label htmlFor="maintenanceModeCheckbox" className="text-xs text-amber-900 font-black cursor-pointer select-none">
                              {isArabic ? 'تفعيل وضع الصيانة المؤقت' : 'Enable Maintenance Mode'}
                            </label>
                            <p className="text-[10px] text-amber-700/80 font-semibold mt-0.5">
                              {isArabic 
                                ? 'سيتم حظر عمليات الشراء وإبراز إشعار صيانة راقي في واجهة المستخدم.' 
                                : 'Blocks checkouts and presents a bespoke luxury maintenance notice to consumers.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Homepage Hero Section */}
                      <div className="bg-white border-2 border-slate-50 rounded-3xl p-5 space-y-4 shadow-sm lg:col-span-2">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-800">{isArabic ? 'تخصيص الواجهة الرئيسية والبانر الإعلاني' : 'Bespoke Homepage Hero Showcase'}</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'العنوان الترويجي الرئيسي (عربية)' : 'Hero Title (Arabic)'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.heroTitleAr} 
                              onChange={(e) => setSettingsForm({...settingsForm, heroTitleAr: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-right font-black" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'العنوان الترويجي الرئيسي (إنجليزية)' : 'Hero Title (English)'}</label>
                            <input 
                              type="text" 
                              required
                              value={settingsForm.heroTitle} 
                              onChange={(e) => setSettingsForm({...settingsForm, heroTitle: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-black" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'العنوان الفرعي (عربية)' : 'Hero Subtitle (Arabic)'}</label>
                            <textarea 
                              rows={2}
                              required
                              value={settingsForm.heroSubtitleAr} 
                              onChange={(e) => setSettingsForm({...settingsForm, heroSubtitleAr: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-right" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'العنوان الفرعي (إنجليزية)' : 'Hero Subtitle (English)'}</label>
                            <textarea 
                              rows={2}
                              required
                              value={settingsForm.heroSubtitle} 
                              onChange={(e) => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" 
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'تصميم قسم الهيرو الرئيسي' : 'Hero Section Layout'}</label>
                            <select 
                              value={settingsForm.heroLayout || 'standard'} 
                              onChange={(e) => setSettingsForm({...settingsForm, heroLayout: e.target.value})}
                              className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-xs font-bold" 
                            >
                              <option value="standard">{isArabic ? 'تصميم قياسي بصورة واحدة ثابتة' : 'Standard Layout (Single Image)'}</option>
                              <option value="carousel">{isArabic ? 'سلايدر متحرك بعدة صور' : 'Carousel Layout (Multiple Images Slider)'}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">{isArabic ? 'رابط الصورة الأساسية (البانر الأول)' : 'Hero Background Image 1 (Primary)'}</label>
                            <div className="flex gap-4 items-center">
                              <input 
                                type="text" 
                                required
                                value={settingsForm.heroBg} 
                                onChange={(e) => setSettingsForm({...settingsForm, heroBg: e.target.value})}
                                className="flex-1 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-[10px]" 
                              />
                              {settingsForm.heroBg && (
                                <div className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-sm relative group">
                                  <img 
                                    src={settingsForm.heroBg} 
                                    alt="Hero BG Preview" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {settingsForm.heroLayout === 'carousel' && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                            >
                              <div className="md:col-span-3 pb-2 border-b border-slate-200/60 font-black text-[11px] text-slate-700">
                                {isArabic ? 'الصور الإضافية للسلايدر المتحرك (اختياري)' : 'Additional Carousel Photos (Optional)'}
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1 text-[10px]">{isArabic ? 'رابط الصورة الثانية' : 'Background Image 2'}</label>
                                <input 
                                  type="text" 
                                  value={settingsForm.heroBg2 || ''} 
                                  onChange={(e) => setSettingsForm({...settingsForm, heroBg2: e.target.value})}
                                  placeholder="https://..."
                                  className="w-full p-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-[9px]" 
                                />
                                {settingsForm.heroBg2 && (
                                  <img src={settingsForm.heroBg2} className="w-12 h-8 object-cover rounded mt-1.5 border border-slate-200" referrerPolicy="no-referrer" />
                                )}
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1 text-[10px]">{isArabic ? 'رابط الصورة الثالثة' : 'Background Image 3'}</label>
                                <input 
                                  type="text" 
                                  value={settingsForm.heroBg3 || ''} 
                                  onChange={(e) => setSettingsForm({...settingsForm, heroBg3: e.target.value})}
                                  placeholder="https://..."
                                  className="w-full p-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-[9px]" 
                                />
                                {settingsForm.heroBg3 && (
                                  <img src={settingsForm.heroBg3} className="w-12 h-8 object-cover rounded mt-1.5 border border-slate-200" referrerPolicy="no-referrer" />
                                )}
                              </div>
                              <div>
                                <label className="block text-slate-400 mb-1 text-[10px]">{isArabic ? 'رابط الصورة الرابعة' : 'Background Image 4'}</label>
                                <input 
                                  type="text" 
                                  value={settingsForm.heroBg4 || ''} 
                                  onChange={(e) => setSettingsForm({...settingsForm, heroBg4: e.target.value})}
                                  placeholder="https://..."
                                  className="w-full p-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono text-[9px]" 
                                />
                                {settingsForm.heroBg4 && (
                                  <img src={settingsForm.heroBg4} className="w-12 h-8 object-cover rounded mt-1.5 border border-slate-200" referrerPolicy="no-referrer" />
                                )}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-600/15 cursor-pointer"
                      >
                        {isArabic ? 'حفظ ونشر جميع الإعدادات سحابياً' : 'Publish Site Settings Live'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </motion.div>

      {/* ==================== PRODUCT FORM MODAL ==================== */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border-2 border-indigo-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl shadow-2xl space-y-4 scrollbar-none"
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

            {!editingProduct && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-100/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-slate-800">{isArabic ? 'هل تريد استيراد كتالوج منتجات كامل؟' : 'Bulk import products via Excel?'}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{isArabic ? 'حمّل نموذج الإكسيل الفارغ، قم بتعبئته ثم أعد رفعه هنا دفعة واحدة.' : 'Download our blank XLSX template, fill it with items, and upload here.'}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 rounded-xl text-[10px] font-black cursor-pointer shadow-sm transition"
                  >
                    <Download className="w-3 h-3 inline-block mr-1 align-middle" />
                    <span>{isArabic ? 'تحميل النموذج' : 'Download'}</span>
                  </button>
                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black cursor-pointer shadow-sm flex items-center gap-1 transition text-center justify-center">
                    <Upload className="w-3 h-3" />
                    <span>{isArabic ? 'رفع الملف' : 'Upload'}</span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => {
                        handleUploadExcel(e);
                        setShowProductModal(false);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Featured Products Toggle checkbox */}
                <div className="md:col-span-2 flex items-center gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-2">
                  <input 
                    type="checkbox" 
                    id="isFeaturedProductCheckbox"
                    checked={productForm.isFeatured} 
                    onChange={(e) => setProductForm({...productForm, isFeatured: e.target.checked})}
                    className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <label htmlFor="isFeaturedProductCheckbox" className="text-xs text-slate-700 font-bold cursor-pointer select-none">
                    {isArabic ? 'عرض هذا المنتج في قسم "المنتجات المميزة" (Featured Products) بالصفحة الرئيسية' : 'Show this product in the "Featured Products" homepage section'}
                  </label>
                </div>

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
                    {categories.length === 0 ? (
                      <option value="apparel">{isArabic ? 'ملابس وأزياء' : 'Apparel'}</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{isArabic ? cat.nameAr : cat.name}</option>
                      ))
                    )}
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
                <div>
                  <label className="block text-slate-500 mb-1">{isArabic ? 'خطة الشحن المخصصة للمنتج (اختياري)' : 'Product Shipping Plan (Optional)'}</label>
                  <select
                    value={productForm.shippingPlanId || ''}
                    onChange={(e) => setProductForm({...productForm, shippingPlanId: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none text-xs font-bold"
                  >
                    <option value="">{isArabic ? 'الخطة الافتراضية / الكل' : 'Default / All Plans'}</option>
                    {shippingPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {isArabic ? `${plan.nameAr} (${plan.cost} ر.س)` : `${plan.name} (${plan.cost} SAR)`}
                      </option>
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

      {/* Zoomed Receipt Lightbox Modal */}
      {zoomedReceiptImage && (
        <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-3xl overflow-hidden p-6 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setZoomedReceiptImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-800 mb-4 font-sans text-center">
              {isArabic ? 'إثبات تحويل المبلغ (الإيصال)' : 'Bank Transfer Confirmation Receipt'}
            </h3>
            <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-slate-100 p-2">
              <img
                src={zoomedReceiptImage}
                alt="Zoomed Payment Receipt"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}