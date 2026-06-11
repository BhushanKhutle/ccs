// ─── Product ─────────────────────────────────────────
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  category: string
  occasion?: string
  flavour?: string
  eggOption?: 'egg' | 'eggless' | 'both'
  weightOptions?: string[]
  imageUrl?: string
  emoji?: string
  isActive: boolean
  isBestseller?: boolean
  isNew?: boolean
  discount?: number
  rating?: number
  reviewCount?: number
  tags?: string[]
}

// ─── Order ───────────────────────────────────────────
export type OrderStatus =
  | 'placed' | 'confirmed' | 'preparing'
  | 'ready_for_pickup' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
  weight?: string
  eggOption?: string
  customMessage?: string
}

export interface OrderAddress {
  name: string
  mobile: string
  line1: string
  line2?: string
  city: string
  pincode: string
}

export interface Order {
  id: number
  orderNumber: string
  status: OrderStatus
  items: OrderItem[]
  address: OrderAddress
  total: number
  deliverySlot?: string
  deliveryCity?: string
  paymentMethod: string
  couponCode?: string
  discountAmount?: number
  otp?: string
  cakeMessage?: string
  createdAt: string
  updatedAt: string
  user?: { id: number; name: string; mobile?: string }
}

// ─── User ────────────────────────────────────────────
export interface User {
  id: number
  name: string
  email: string
  mobile?: string
  role: 'customer' | 'chef' | 'agent' | 'admin'
  isActive: boolean
  walletBalance?: number
  createdAt: string
}

// ─── Coupon ──────────────────────────────────────────
export interface Coupon {
  id: number
  code: string
  type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo'
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  maxUses?: number
  usedCount: number
  isActive: boolean
  description?: string
  expiresAt?: string
}

// ─── Delivery Slot ───────────────────────────────────
export interface DeliverySlot {
  id: number
  label: string
  startTime: string
  endTime: string
  isActive: boolean
}

// ─── API Response ────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
  message?: string
}
