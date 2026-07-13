export interface Subcategory {
  id: string;
  name: string;
  nameAr: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  image?: string;
  subcategories?: Subcategory[];
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  category: string;
  categoryAr: string;
  subcategory?: string;
  subcategoryAr?: string;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  features: string[];
  featuresAr: string[];
  specs: Record<string, string>;
  specsAr: Record<string, string>;
  isFeatured?: boolean;
  isOnOffer?: boolean;
  discountPrice?: number;
  offerStartDate?: string;
  offerEndDate?: string;
  stock: number;
  shippingPlanId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  tags?: string[];
  merchantResponse?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export type ShippingStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'rejected';

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  customerInfo: CustomerInfo;
  shippingStatus: ShippingStatus;
  date: string;
  trackingNumber: string;
  paymentGatewayId?: string;
  paymentGatewayName?: string;
  paymentStatus?: 'pending_verification' | 'verified' | 'rejected' | 'not_applicable';
  receiptImage?: string;
}
