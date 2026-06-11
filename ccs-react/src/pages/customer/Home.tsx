import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { productsApi, couponsApi } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { Spinner, Badge } from '@/components/ui'
import { toArray, formatPrice, getProductEmoji } from '@/lib/utils'
import { Product } from '@/lib/types'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { label: 'Birthday',  icon: '🎂', q: 'Birthday'  },
  { label: 'Wedding',   icon: '💍', q: 'Wedding'   },
  { label: 'Chocolate', icon: '🍫', q: 'Chocolate' },
  { label: 'Eggless',   icon: '🌱', q: 'eggless'   },
  { label: 'Cupcakes',  icon: '🧁', q: 'Cupcakes'  },
  { label: 'Custom',    icon: '✨', q: 'Custom'    },
]

export default function HomePage() {
  const navigate  = useNavigate()
  const addItem   = useCartStore((s) => s.addItem)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.list().then((r) => r.data),
  })

  const { data: couponsData } = useQuery({
    queryKey: ['coupons-active'],
    queryFn:  () => couponsApi.list().then((r) => r.data),
  })

  const products  = toArray<Product>(productsData)
  const coupons   = toArray(couponsData)
  const activeCoupon = (coupons as any[]).find((c: any) => c.isActive)
  const featured  = products.slice(0, 8)
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4)

  function quickAdd(p: Product) {
    addItem({
      id:    p.id,
      name:  p.name,
      price: p.price,
      emoji: p.emoji ?? getProductEmoji(p.category),
    })
    toast.success(`${p.name} added to cart! 🎂`)
  }

  return (
    <div>
      {/* Announcement bar */}
      {activeCoupon && (
        <div className="bg-plum-light text-plum text-center py-2 text-xs font-medium">
          🎁 Use code <strong>{activeCoupon.code}</strong> for {activeCoupon.type === 'percentage' ? `${activeCoupon.value}% off` : `₹${activeCoupon.value} off`}
        </div>
      )}

      {/* Hero */}
      <section className="bg-plum text-white py-20 px-4 text-center">
        <p className="eyebrow text-gold-mid mb-3">India's most-loved cake brand</p>
        <h1 className="font-display text-5xl sm:text-6xl mb-5">
          Every <em className="text-gold not-italic">Celebration</em><br />Deserves a Perfect Cake
        </h1>
        <p className="text-white/70 text-base mb-8 max-w-md mx-auto leading-relaxed">
          Handcrafted by master bakers, delivered fresh to your doorstep.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={() => navigate('/catalog')} className="bg-gold text-plum-dark px-8 py-3.5 rounded-full font-semibold hover:opacity-90 transition-opacity">
            Order Now 🎂
          </button>
          <button onClick={() => navigate('/catalog')} className="border border-white/40 text-white px-7 py-3.5 rounded-full hover:bg-white/10 transition-colors">
            Browse Catalog
          </button>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-surface border-b border-border py-8 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: '🚀', title: 'Same Day Delivery', sub: 'Order before 5 PM' },
            { icon: '🎨', title: 'Custom Creations',  sub: 'Photo & message cakes' },
            { icon: '🌿', title: '100% Fresh Daily',  sub: 'No preservatives ever' },
            { icon: '🔒', title: 'Secure & Hygienic', sub: 'Tamper-proof packaging' },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <p className="font-semibold text-sm text-ink">{title}</p>
              <p className="text-xs text-muted">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <p className="eyebrow mb-2">Shop by occasion</p>
        <h2 className="section-title mb-6">What are you celebrating?</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(({ label, icon, q }) => (
            <button
              key={label}
              onClick={() => navigate(`/catalog?q=${q}`)}
              className="flex-shrink-0 bg-white border border-border rounded-2xl px-5 py-4 text-center hover:border-gold hover:-translate-y-1 hover:shadow-cake transition-all min-w-[90px]"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xs font-medium text-muted">{label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="eyebrow mb-1">Fresh from the oven</p>
            <h2 className="section-title">Our Bestsellers</h2>
          </div>
          <button onClick={() => navigate('/catalog')} className="text-sm text-plum border border-border rounded-full px-4 py-2 hover:border-plum transition-colors">
            View all →
          </button>
        </div>

        {isLoading ? <Spinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => quickAdd(p)} onView={() => navigate(`/product/${p.id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-plum-dark text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="font-display text-2xl mb-2">Celebration <span className="text-gold">Cake</span> Shop</h3>
          <p className="text-white/50 text-sm mb-6">Handcrafted with love since 2019</p>
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Celebration Cake Shop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// ─── Product Card ────────────────────────────────────
function ProductCard({ product: p, onAdd, onView }: { product: Product; onAdd: () => void; onView: () => void }) {
  const emoji = p.emoji ?? getProductEmoji(p.category)
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-cake hover:-translate-y-1 transition-all duration-200 cursor-pointer" onClick={onView}>
      {/* Image */}
      <div className="aspect-square bg-surface flex items-center justify-center text-6xl relative">
        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover absolute inset-0" /> : emoji}
        {p.isBestseller && <span className="absolute top-2 left-2 bg-plum text-white text-[10px] font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>}
        {p.isNew && !p.isBestseller && <span className="absolute top-2 left-2 bg-ccs-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
        {p.discount && !p.isBestseller && !p.isNew && <span className="absolute top-2 left-2 bg-gold-light text-gold border border-gold text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</span>}
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-ink mb-1 line-clamp-2">{p.name}</h3>
        <div className="flex gap-1 mb-2 flex-wrap">
          {p.eggOption === 'eggless' && <span className="badge bg-ccs-green-lt text-ccs-green">🌱 Eggless</span>}
          {p.category && <span className="badge bg-surface text-muted">{p.category}</span>}
        </div>
        {p.rating && (
          <p className="text-xs text-muted mb-2">⭐ <strong className="text-gold">{p.rating}</strong> ({p.reviewCount?.toLocaleString()})</p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-plum">{formatPrice(p.price)}</span>
            {p.originalPrice && <span className="text-xs text-hint line-through ml-1">{formatPrice(p.originalPrice)}</span>}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            className="bg-plum text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-plum-dark transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
