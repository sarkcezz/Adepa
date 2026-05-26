export type Role = 'customer' | 'admin' | 'employee'

export interface User {
  id: string
  name: string
  email: string | null
  phone: string
  role: Role
  employee_id?: string | null
  is_active: boolean
  force_password_change?: boolean
  created_at?: string
}

export type ProductLine = 'RAW' | 'SPICED' | 'READY_TO_EAT'
export type ProductVariant = 'PLAIN' | 'MILD' | 'SPICY' | 'NONE'

export interface Product {
  id: string
  name: string
  product_line: ProductLine
  variant: ProductVariant
  weight_grams: number | null
  price_kobo: number
  description: string
  ingredients?: string | null
  storage_instructions?: string | null
  heat_level: number
  image_url?: string | null
  stock_qty: number
  is_active: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
export type DeliveryMethod = 'HOME' | 'PICKUP' | 'EVENT'
export type PaymentMethod = 'MOMO' | 'CARD' | 'CASH' | 'BANK'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_variant?: string | null
  weight_grams?: number | null
  quantity: number
  unit_price_kobo: number
  subtotal_kobo: number
}

export interface StatusHistory {
  id: string
  order_id: string
  status: string
  note?: string | null
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  employee_id?: string | null
  status: OrderStatus
  delivery_method: DeliveryMethod
  pickup_location_name?: string | null
  subtotal_kobo: number
  delivery_fee_kobo: number
  discount_kobo: number
  total_kobo: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  paystack_reference?: string | null
  source: 'ONLINE' | 'EMPLOYEE_SALE'
  notes?: string | null
  created_at: string
  updated_at?: string
  items?: OrderItem[]
  statusHistory?: StatusHistory[]
  customer?: { id: string; name: string; phone: string }
}

export interface Address {
  id: string
  user_id: string
  label: string
  recipient: string
  phone: string
  area: string
  district: string
  landmark?: string | null
  is_default: boolean
}

export interface StandLocation {
  name: string
  area: string
  days: string
  hours: string
  map_link?: string
}

export interface StandAnnouncement {
  id: string
  title: string
  description: string
  locations: StandLocation[]
  start_date: string
  end_date: string
  is_published: boolean
  created_at: string
}

export interface PorkEvent {
  id: string
  name: string
  event_date: string
  event_time: string
  venue_name: string
  venue_address: string
  flat_rate_kobo: number
  capacity: number
  registered_count: number
  description: string
  image_url?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  slots_remaining?: number
}

export interface Campaign {
  id: string
  name: string
  code: string
  discount_type: 'PERCENT' | 'FIXED' | 'FREE_DELIVERY'
  discount_value: number
  min_order_kobo: number
  max_usage?: number | null
  usage_count: number
  valid_from: string
  valid_to: string
  is_active: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}
