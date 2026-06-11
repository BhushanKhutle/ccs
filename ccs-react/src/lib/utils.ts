import { type ClassValue, clsx } from 'clsx'
import { OrderStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(amount: number | string) {
  return `₹${Number(amount).toFixed(0)}`
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  })
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed:            'Order Placed',
  confirmed:         'Confirmed',
  preparing:         'Being Prepared',
  ready_for_pickup:  'Ready for Pickup',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
}

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  placed:            'bg-blue-100 text-blue-700',
  confirmed:         'bg-purple-100 text-purple-700',
  preparing:         'bg-amber-100 text-amber-700',
  ready_for_pickup:  'bg-orange-100 text-orange-700',
  out_for_delivery:  'bg-indigo-100 text-indigo-700',
  delivered:         'bg-green-100 text-green-700',
  cancelled:         'bg-red-100 text-red-700',
}

export const PRODUCT_EMOJI: Record<string, string> = {
  'Birthday Cakes':  '🎂',
  'Wedding Cakes':   '💍',
  'Cheesecakes':     '🍰',
  'Chocolate Cakes': '🍫',
  'Pastries':        '🥐',
  'Cupcakes':        '🧁',
  'Eggless Cakes':   '🌱',
  'Custom Cakes':    '✨',
  default:           '🎂',
}

export function getProductEmoji(category: string): string {
  return PRODUCT_EMOJI[category] ?? PRODUCT_EMOJI.default
}

export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'items' in data) return (data as any).items
  return []
}

export function getImageUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url
}
