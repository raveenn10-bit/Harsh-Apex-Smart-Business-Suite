// ============================================================
// HARSH APEX SMART BUSINESS SUITE - DATABASE & SYSTEM TYPES
// ============================================================

export type PackageCode = 'BASIC' | 'BUSINESS' | 'PREMIUM';

export type RoleCode = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF' | 'SUPER_ADMIN';

export interface Package {
  id: string;
  code: PackageCode;
  name: string;
  description: string | null;
  price_monthly: number;
  price_annual: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Feature {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  min_package: PackageCode;
  created_at?: string;
}

export interface PackageFeature {
  id: string;
  package_id: string;
  feature_id: string;
  is_enabled: boolean;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  package_id: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  currency_symbol: string;
  business_type: string;
  is_active: boolean;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessSettings {
  id: string;
  business_id: string;
  invoice_prefix: string;
  next_invoice_number: number;
  quotation_prefix: string;
  next_quotation_number: number;
  receipt_header: string;
  receipt_footer: string;
  enable_tax: boolean;
  tax_rate: number;
  primary_brand_color: string;
  whatsapp_auto_send: boolean;
}

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
}

export interface Profile {
  id: string;
  user_id: string | null;
  business_id: string;
  role_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id: string | null;
  supplier_id: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url: string | null;
  status: 'active' | 'archived' | 'out_of_stock';
  created_at?: string;
  updated_at?: string;
  // Joined fields
  category_name?: string;
}

export interface Inventory {
  id: string;
  business_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  location: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  business_id: string;
  product_id: string;
  movement_type: 'STOCK_IN' | 'STOCK_OUT' | 'SALE' | 'RETURN' | 'ADJUSTMENT';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  avatar_url: string | null;
  total_purchases: number;
  total_orders: number;
  outstanding_balance: number;
  last_purchase_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerNote {
  id: string;
  business_id: string;
  customer_id: string;
  note: string;
  created_by: string | null;
  created_at?: string;
}

export interface Order {
  id: string;
  business_id: string;
  order_number: string;
  customer_id: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'partially_paid';
  payment_method: 'cash' | 'card' | 'bank_transfer';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at?: string;
  customer_name?: string;
}

export interface OrderItem {
  id: string;
  business_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  total_price: number;
  product_name?: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  order_id: string | null;
  customer_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: 'draft' | 'unpaid' | 'paid' | 'overdue';
  notes: string | null;
  created_at?: string;
  customer_name?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: string;
  business_id: string;
  invoice_id: string | null;
  order_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  payment_reference: string | null;
  notes: string | null;
  payment_date: string;
  created_at?: string;
}

export interface Quotation {
  id: string;
  business_id: string;
  quotation_number: string;
  customer_id: string | null;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes: string | null;
  created_at?: string;
  customer_name?: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ExpenseCategory {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
}

export interface Expense {
  id: string;
  business_id: string;
  category_id: string | null;
  expense_number: string;
  expense_date: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  notes: string | null;
  category_name?: string;
  created_at?: string;
}

export interface Employee {
  id: string;
  business_id: string;
  employee_id_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string;
  salary: number;
  join_date: string;
  status: 'active' | 'on_leave' | 'terminated';
  avatar_url: string | null;
  created_at?: string;
}

export interface Attendance {
  id: string;
  business_id: string;
  employee_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day';
  notes: string | null;
  employee_name?: string;
}

export interface LeaveRequest {
  id: string;
  business_id: string;
  employee_id: string;
  leave_type: 'annual' | 'casual' | 'medical';
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  employee_name?: string;
}

export interface WhatsAppMessage {
  id: string;
  business_id: string;
  recipient_phone: string;
  recipient_name: string | null;
  template_name: string;
  message_body: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  external_id: string | null;
  sent_at: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  business_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  business_id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Integration {
  id: string;
  business_id: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, unknown>;
  last_sync_at: string | null;
}

export interface Automation {
  id: string;
  business_id: string;
  name: string;
  trigger_event: string;
  action_type: string;
  is_active: boolean;
  config: Record<string, unknown>;
}

export interface Lead {
  id: string;
  customer_name: string;
  business_name: string;
  whatsapp_number: string;
  email: string;
  business_type: string | null;
  interested_package: 'Basic' | 'Business' | 'Premium' | 'Not Sure';
  message: string | null;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  created_at?: string;
}

// Active user session state
export interface UserSession {
  user_id: string;
  profile_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: RoleCode;
  business_id: string;
  business_name: string;
  business_slug: string;
  package_code: PackageCode;
  package_name: string;
  currency: string;
  currency_symbol: string;
  features: string[]; // List of enabled feature codes
  permissions: string[]; // List of assigned permission codes
}
