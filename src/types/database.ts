// Tipos de base de datos para Supabase

export interface Publisher {
  publisher_id: string;
  name: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Author {
  author_id: string;
  full_name: string;
  biography?: string | null;
  photo_url?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  website?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_category_id?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export type BookStatus = 'available' | 'draft' | 'out_of_stock';
export type AuthorRole = 'main_author' | 'coauthor' | 'editor';
export type FileFormat = 'PDF' | 'EPUB' | 'MOBI' | string;

export interface Book {
  book_id: string;
  isbn?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  publication_date?: string | null;
  publisher_id?: string | null;
  language: string;
  page_count?: number | null;
  file_size?: number | null;
  file_format?: FileFormat | null;
  cover_image_url?: string | null; // URL de la imagen de portada del libro
  sample_url?: string | null;
  full_content_url?: string | null;
  price: number;
  is_featured: boolean;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface BookAuthor {
  book_id: string;
  author_id: string;
  role: AuthorRole;
  created_at: string;
}

export interface BookCategory {
  book_id: string;
  category_id: string;
  created_at: string;
}

// Tipos extendidos con relaciones
export interface BookWithRelations extends Book {
  publisher?: Publisher | null;
  authors?: (Author & { role: AuthorRole })[];
  categories?: Category[];
}

export interface AuthorWithBooks extends Author {
  books?: Book[];
}

export interface CategoryWithBooks extends Category {
  books?: Book[];
  parent_category?: Category | null;
  subcategories?: Category[];
}

// =====================================================
// TIPOS PARA SISTEMA DE PEDIDOS Y CARRITO
// =====================================================

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export interface CartItem {
  cart_id: string;
  user_id: string;
  book_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithBook extends CartItem {
  book: BookWithRelations;
}

export interface Order {
  order_id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
}

export interface OrderItem {
  order_item_id: string;
  order_id: string;
  book_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface OrderItemWithBook extends OrderItem {
  book: BookWithRelations;
}

export interface OrderWithDetails extends Order {
  item_count?: number;
  total_items?: number;
  items?: OrderItemWithBook[];
}

export interface CheckoutData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  notes?: string;
}

