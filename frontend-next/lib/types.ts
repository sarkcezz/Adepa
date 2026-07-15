// Mirrors the Laravel API resource shapes. Money is always integer pesewas
// (GHS × 100); format with formatGhs().

export type Role = "customer" | "admin" | "employee";
export type ProductLine = "RAW" | "SPICED" | "READY_TO_EAT";
export type ProductVariant = "PLAIN" | "MILD" | "SPICY" | "NONE";

export interface Product {
  id: string;
  name: string;
  product_line: ProductLine;
  variant: ProductVariant;
  weight_grams: number | null;
  price_kobo: number;
  description: string;
  ingredients?: string | null;
  storage_instructions?: string | null;
  heat_level: number;
  image_url: string | null;
  gallery_urls?: string[] | null;
  category?: string | null;
  nutrition_info?: string | null;
  cooking_tips?: string | null;
  stock_qty: number;
  is_active: boolean;
}

export interface StandLocation {
  name: string;
  area: string;
  days: string;
  hours: string;
  map_link?: string | null;
}

export interface StandAnnouncement {
  id: string;
  title: string;
  description: string;
  locations: StandLocation[];
  start_date: string;
  end_date: string;
}

export interface PorkEvent {
  id: string;
  name: string;
  description: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  flat_rate_kobo: number;
  capacity: number;
  registered_count: number;
  image_url: string | null;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  payment_status: "PENDING" | "PAID" | "FAILED";
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  area: string;
  district: string;
  landmark?: string | null;
  is_default: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  employee_id?: string | null;
  position?: string | null;
  is_active: boolean;
  force_password_change?: boolean;
  birth_date?: string | null;
  referral_code?: string | null;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_variant: string;
  weight_grams: number | null;
  quantity: number;
  unit_price_kobo: number;
  subtotal_kobo: number;
}

export interface StatusHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  delivery_method: "HOME" | "PICKUP" | "EVENT";
  pickup_location_name?: string | null;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  discount_kobo: number;
  loyalty_kobo?: number;
  gift_card_kobo?: number;
  total_kobo: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items?: OrderItem[];
  statusHistory?: StatusHistory[];
}

export interface Campaign {
  id: string;
  name: string;
  code: string;
  discount_type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
  discount_value: number;
  min_order_kobo: number | null;
  max_usage: number | null;
  usage_count: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  user_name: string | null;
  user_role: string | null;
  action: string;
  subject_label: string | null;
  changes: Record<string, unknown> | null;
  note: string | null;
  ip: string | null;
  created_at: string;
}

/** Laravel paginator envelope. */
export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
