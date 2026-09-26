// ============================================================
// HARSH APEX SMART BUSINESS SUITE - SUPABASE DATABASE TYPES
// Auto-generated schema definitions matching all 34 tables
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string;
          code: 'BASIC' | 'BUSINESS' | 'PREMIUM';
          name: string;
          description: string | null;
          price_monthly: number;
          price_annual: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['packages']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['packages']['Insert']>;
      };
      features: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string;
          description: string | null;
          min_package: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['features']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['features']['Insert']>;
      };
      businesses: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['businesses']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          user_id: string | null;
          business_id: string;
          role_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      roles: {
        Row: {
          id: string;
          code: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF' | 'SUPER_ADMIN';
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          name: string;
          module: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['permissions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>;
      };
      products: {
        Row: {
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
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          business_id: string;
          order_number: string;
          customer_id: string | null;
          status: string;
          payment_status: string;
          payment_method: string;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      invoices: {
        Row: {
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
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      customers: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      employees: {
        Row: {
          id: string;
          business_id: string;
          employee_id_number: string;
          name: string;
          email: string | null;
          phone: string | null;
          position: string;
          department: string;
          role_id: string | null;
          salary: number;
          join_date: string;
          status: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
      expenses: {
        Row: {
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
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>;
      };
    };
  };
}
