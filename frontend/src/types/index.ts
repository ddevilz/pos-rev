// Base types
export interface BaseEntity {
  id: number;
  uuid: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  last_login_at?: string;
}

// Auth types
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// Category types
export interface Category extends BaseEntity {
  catid: string;
  category: string;
  description?: string;
  is_active: boolean;
  created_by?: number;
}

// Service types
export interface Service extends BaseEntity {
  ino?: number;
  iname: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  rate1: number;
  rate2?: number;
  rate3?: number;
  rate4?: number;
  rate5?: number;
  itype?: string;
  is_active: boolean;
  created_by?: number;
}

// Customer types
export interface Customer extends BaseEntity {
  cname: string;
  mobile: string;
  email?: string;
  add1?: string;
  add2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  rtype: 'regular' | 'premium' | 'vip';
  is_active: boolean;
  total_orders: number;
  total_spent: number;
}

// Order types
export interface Order extends BaseEntity {
  order_number: string;
  customer_id: number;
  customer?: Customer;
  due_date?: string;
  due_time?: string;
  pickup_date?: string;
  delivery_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  total_quantity: number;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  tax_percentage: number;
  total_amount: number;
  advance_paid: number;
  remaining_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  notes?: string;
  created_by?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  service_id: number;
  service_name: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
  created_at: string;
}

// Invoice types
export interface Invoice extends BaseEntity {
  invoice_number: string;
  order_id: number;
  customer_id: number;
  customer?: Customer;
  order?: Order;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  created_by?: number;
}

// Payment types
export interface Payment extends BaseEntity {
  order_id?: number;
  invoice_id?: number;
  customer_id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  payment_reference?: string;
  payment_date: string;
  notes?: string;
  created_by?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  timestamp: string;
}

// Form types
export interface CategoryFormData {
  catid: string;
  category: string;
  description?: string;
  is_active?: boolean;
}

export interface ServiceFormData {
  ino?: number;
  iname: string;
  description?: string;
  category_id?: number;
  rate1: number;
  rate2?: number;
  rate3?: number;
  rate4?: number;
  rate5?: number;
  itype?: string;
  is_active?: boolean;
}

export interface CustomerFormData {
  cname: string;
  mobile: string;
  email?: string;
  add1?: string;
  add2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  rtype: 'regular' | 'premium' | 'vip';
}

export interface OrderFormData {
  customer_id: number;
  due_date?: string;
  due_time?: string;
  pickup_date?: string;
  delivery_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  discount_percentage?: number;
  tax_percentage?: number;
  advance_paid?: number;
  notes?: string;
  items: OrderItemFormData[];
}

export interface OrderItemFormData {
  service_id: number;
  quantity: number;
  rate: number;
  notes?: string;
}