import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: number
  name: string
  price: number
  image?: string
  emoji: string
  qty: number
  weight?: string
  eggOption?: string
  message?: string
}

interface CartState {
  items: CartItem[]
  coupon: { code: string; discount: number; type: string } | null
  addItem: (item: Omit<CartItem, 'qty'>) => void
  removeItem: (id: number) => void
  updateQty: (id: number, qty: number) => void
  clearCart: () => void
  setCoupon: (coupon: CartState['coupon']) => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item) => set((s) => {
        const existing = s.items.find((i) => i.id === item.id)
        if (existing) {
          return { items: s.items.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) }
        }
        return { items: [...s.items, { ...item, qty: 1 }] }
      }),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty) => set((s) => ({
        items: qty <= 0
          ? s.items.filter((i) => i.id !== id)
          : s.items.map((i) => i.id === id ? { ...i, qty } : i),
      })),

      clearCart: () => set({ items: [], coupon: null }),

      setCoupon: (coupon) => set({ coupon }),

      total: () => {
        const { items, coupon } = get()
        const sub = items.reduce((sum, i) => sum + i.price * i.qty, 0)
        if (!coupon) return sub
        if (coupon.type === 'percentage') return sub - (sub * coupon.discount) / 100
        if (coupon.type === 'fixed') return Math.max(0, sub - coupon.discount)
        return sub
      },

      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'ccs-cart' }
  )
)
