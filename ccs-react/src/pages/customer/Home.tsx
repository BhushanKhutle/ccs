import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { productsApi, couponsApi } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { ProductSkeleton } from '@/components/ui'
import { toArray, formatPrice, getProductEmoji } from '@/lib/utils'
import { Product } from '@/lib/types'
import { ArrowRight, Star, Truck, Clock, Leaf, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { label: 'Birthday',    icon: '🎂', q: 'Birthday',  color: 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400' },
  { label: 'Wedding',     icon: '💍', q: 'Wedding',   color: 'from-pink-50 to-pink-100 border-pink-200 hover:border-pink-400' },
  { label: 'Chocolate',   icon: '🍫', q: 'Chocolate', color: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400' },
  { label: 'Eggless',     icon: '🌱', q: 'eggless',   color: 'from-green-50 to-green-100 border-green-200 hover:border-green-400' },
  { label: 'Cupcakes',    icon: '🧁', q: 'Cupcakes',  color: 'from-rose-50 to-rose-100 border-rose-200 hover:border-rose-400' },
  { label: 'Anniversary', icon: '💝', q: 'Anniversary',color: 'from-red-50 to-red-100 border-red-200 hover:border-red-400' },
  { label: 'Custom',      icon: '✨', q: 'Custom',    color: 'from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-400' },
  { label: 'Pastries',    icon: '🥐', q: 'Pastries',  color: 'from-orange-50 to-orange-100 border-orange-200 hover:border-orange-400' },
]

const FEATURES = [
  { icon: Truck,  title: 'Same Day Delivery', sub: 'Order before 5 PM',        color: 'text-plum bg-plum-light' },
  { icon: Star,   title: 'Custom Creations',  sub: 'Photo & message cakes',    color: 'text-gold bg-gold-light' },
  { icon: Leaf,   title: '100% Fresh Daily',  sub: 'No preservatives ever',    color: 'text-ccs-green bg-ccs-green-lt' },
  { icon: Shield, title: 'Secure & Hygienic', sub: 'Tamper-proof packaging',   color: 'text-ccs-blue bg-ccs-blue-lt' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const addItem  = useCartStore((s) => s.addItem)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then((r) => r.data),
  })
  const { data: couponsData } = useQuery({
    queryKey: ['coupons-active'],
    queryFn: () => couponsApi.list().then((r) => r.data),
  })

  const products     = toArray<Product>(productsData)
  const coupons      = toArray<any>(couponsData)
  const activeCoupon = coupons.find((c) => c.isActive)
  const featured     = products.slice(0, 8)
  const newArrivals  = products.filter((p) => p.isNew).slice(0, 4)

  function quickAdd(p: Product) {
    addItem({ id: p.id, name: p.name, price: p.price, emoji: p.emoji ?? getProductEmoji(p.category) })
    toast.success(`Added to cart! 🎂`, { duration: 2000 })
  }

  return (
    <div className="animate-fadeIn">
      {/* Announcement Bar */}
      {activeCoupon && (
        <div className="bg-gradient-to-r from-plum via-plum-dark to-plum text-white text-center py-2.5 text-xs font-medium">
          🎁 Use code&nbsp;<strong className="text-gold-mid bg-white/10 px-2 py-0.5 rounded-full">{activeCoupon.code}</strong>&nbsp;
          for {activeCoupon.type === 'percentage' ? `${activeCoupon.value}% off` : `₹${activeCoupon.value} off`}
          &nbsp;·&nbsp;
          <button onClick={() => navigate('/catalog')} className="underline underline-offset-2 hover:text-gold-mid transition-colors">Shop now →</button>
        </div>
      )}

      {/* Hero */}
      <section className="relative bg-plum overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-rose blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
            🏆 India's most-loved cake brand
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
            Every <span className="text-gold italic">Celebration</span><br />
            Deserves a Perfect Cake
          </h1>
          <p className="text-white/70 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Handcrafted by master bakers, delivered fresh to your doorstep in 2–4 hours.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate('/catalog')}
              className="bg-gold text-plum-dark px-8 py-4 rounded-full font-semibold text-base hover:opacity-90 transition-all duration-200 active:scale-95 shadow-lg shadow-gold/30 flex items-center gap-2"
            >
              Order Now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/track')}
              className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-7 py-4 rounded-full font-medium hover:bg-white/20 transition-all duration-200 flex items-center gap-2"
            >
              <Clock className="w-4 h-4" /> Track Order
            </button>
          </div>
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-12 text-white/50 text-xs">
            {['50,000+ Happy Customers', '4.9★ Rating', 'Same Day Delivery', 'Fresh Guarantee'].map((t) => (
              <span key={t} className="hidden sm:block">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, sub, color }) => (
              <div key={title} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface transition-colors">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-ink leading-tight">{title}</p>
                  <p className="text-[11px] text-muted mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6">
          <p className="eyebrow mb-1.5">Shop by occasion</p>
          <h2 className="section-title">What are you celebrating?</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(({ label, icon, q, color }) => (
            <button
              key={label}
              onClick={() => navigate(`/catalog?q=${q}`)}
              className={`flex-shrink-0 bg-gradient-to-br border-2 rounded-2xl px-5 py-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-cake min-w-[88px] ${color}`}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xs font-semibold text-ink">{label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="eyebrow mb-1.5">Fresh from the oven</p>
            <h2 className="section-title">Our Bestsellers</h2>
          </div>
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-1.5 text-sm text-plum font-medium border-2 border-border rounded-full px-4 py-2 hover:border-plum hover:bg-plum-light transition-all duration-200"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            : featured.map((p) => <ProductCard key={p.id} product={p} onAdd={() => quickAdd(p)} onView={() => navigate(`/product/${p.id}`)} />)
          }
        </div>
      </section>

      {/* Banner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-plum to-plum-dark rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold blur-3xl" />
          </div>
          <div className="relative">
            <p className="eyebrow text-gold-mid mb-3">Special offer</p>
            <h2 className="font-display text-3xl sm:text-4xl mb-4">Want a Custom Cake? 🎨</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">Tell us your design, occasion, and flavour. We'll make it happen in 24 hours.</p>
            <button onClick={() => navigate('/catalog?q=Custom')} className="bg-gold text-plum-dark px-8 py-3.5 rounded-full font-semibold hover:opacity-90 transition-all active:scale-95">
              Design Your Cake
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-plum-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-display text-xl mb-3">Celebration <span className="text-gold">Cake</span> Shop</h3>
              <p className="text-white/50 text-sm leading-relaxed">Handcrafted with love since 2019. Every cake tells a story.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white/80">Quick Links</h4>
              <div className="space-y-2">
                {[['Browse Cakes', '/catalog'], ['Track Order', '/track'], ['My Account', '/account']].map(([l, h]) => (
                  <button key={l} onClick={() => navigate(h)} className="block text-sm text-white/50 hover:text-white transition-colors">{l}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white/80">Contact</h4>
              <div className="space-y-1.5 text-sm text-white/50">
                <p>📞 +91 98765 43210</p>
                <p>📧 hello@celebrationcakes.in</p>
                <p>🕐 9 AM – 9 PM, All days</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/30 text-xs">© {new Date().getFullYear()} Celebration Cake Shop. All rights reserved.</p>
            <div className="flex gap-4 text-white/30 text-xs">
              <span>Privacy Policy</span><span>Terms of Service</span><span>Refund Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── cn helper (needed in same file) ─────────────────
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// ─── Product Card ─────────────────────────────────────
function ProductCard({ product: p, onAdd, onView }: { product: Product; onAdd: () => void; onView: () => void }) {
  const emoji = p.emoji ?? getProductEmoji(p.category)
  return (
    <div
      className="bg-white border border-border rounded-2xl overflow-hidden cursor-pointer group hover:shadow-[0_8px_30px_rgba(61,28,82,0.12)] hover:-translate-y-1 transition-all duration-300"
      onClick={onView}
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-surface to-plum-light/30 flex items-center justify-center text-6xl relative overflow-hidden">
        {p.imageUrl
          ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500" />
          : <span className="group-hover:scale-110 transition-transform duration-300">{emoji}</span>
        }
        {/* Badge */}
        {p.isBestseller && (
          <span className="absolute top-2.5 left-2.5 bg-plum text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm">
            ⭐ BESTSELLER
          </span>
        )}
        {p.isNew && !p.isBestseller && (
          <span className="absolute top-2.5 left-2.5 bg-ccs-green text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm">
            ✨ NEW
          </span>
        )}
        {/* Quick add hover overlay */}
        <div className="absolute inset-0 bg-plum/0 group-hover:bg-plum/5 transition-colors duration-300" />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-medium text-ink mb-1.5 line-clamp-2 leading-snug">{p.name}</h3>

        <div className="flex gap-1 mb-2 flex-wrap">
          {p.eggOption === 'eggless' && (
            <span className="text-[10px] bg-ccs-green-lt text-ccs-green font-medium px-2 py-0.5 rounded-full">🌱 Eggless</span>
          )}
          {p.category && (
            <span className="text-[10px] bg-surface text-muted px-2 py-0.5 rounded-full">{p.category}</span>
          )}
        </div>

        {p.rating && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] font-bold text-gold bg-gold-light px-1.5 py-0.5 rounded">★ {p.rating}</span>
            <span className="text-[10px] text-hint">({p.reviewCount?.toLocaleString()})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-plum">{formatPrice(p.price)}</span>
            {p.originalPrice && (
              <span className="text-xs text-hint line-through">{formatPrice(p.originalPrice)}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            className="bg-plum text-white rounded-xl px-3.5 py-1.5 text-xs font-semibold hover:bg-plum-dark transition-colors active:scale-95"
          >
            Add +
          </button>
        </div>
      </div>
    </div>
  )
}
