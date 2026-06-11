import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { ProductSkeleton, Empty, PageHeader } from '@/components/ui'
import { toArray, formatPrice, getProductEmoji } from '@/lib/utils'
import { Product } from '@/lib/types'
import { SlidersHorizontal, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CATS = ['All', 'Birthday', 'Wedding', 'Chocolate', 'Cheesecake', 'Eggless', 'Cupcakes', 'Pastries', 'Custom']
const SORTS = [
  { value: 'default',    label: 'Featured'         },
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'rating',     label: 'Top Rated'         },
  { value: 'newest',     label: 'Newest First'      },
]

export default function CatalogPage() {
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const addItem    = useCartStore((s) => s.addItem)

  const [cat,  setCat]  = useState('All')
  const [sort, setSort] = useState('default')
  const [egg,  setEgg]  = useState(false)
  const searchQ = params.get('q') ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then((r) => r.data),
  })

  const products = useMemo(() => {
    let list = toArray<Product>(data)
    if (searchQ) list = list.filter((p) => p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.category?.toLowerCase().includes(searchQ.toLowerCase()))
    if (cat !== 'All') list = list.filter((p) => p.category?.includes(cat) || p.name.toLowerCase().includes(cat.toLowerCase()))
    if (egg) list = list.filter((p) => p.eggOption === 'eggless' || p.eggOption === 'both')
    if (sort === 'price-asc')  list = [...list].sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'price-desc') list = [...list].sort((a, b) => Number(b.price) - Number(a.price))
    if (sort === 'rating')     list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    return list
  }, [data, searchQ, cat, sort, egg])

  function quickAdd(p: Product) {
    addItem({ id: p.id, name: p.name, price: p.price, emoji: p.emoji ?? getProductEmoji(p.category) })
    toast.success(`${p.name} added! 🎂`, { duration: 1500 })
  }

  const hasFilters = cat !== 'All' || egg || sort !== 'default'

  return (
    <div>
      <PageHeader
        title={searchQ ? `"${searchQ}"` : 'All Cakes'}
        subtitle={searchQ ? `Search results` : 'Handcrafted fresh every day'}
        breadcrumb={[{ label: 'Home', onClick: () => navigate('/home') }, { label: searchQ || 'Catalog', onClick: () => {} }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`flex-shrink-0 text-xs px-3.5 py-2 rounded-full font-medium border-2 transition-all duration-200 ${cat === c ? 'bg-plum text-white border-plum' : 'border-border text-muted hover:border-plum-mid hover:text-plum bg-white'}`}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Eggless toggle */}
            <button onClick={() => setEgg(!egg)} className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full font-medium border-2 transition-all ${egg ? 'bg-ccs-green text-white border-ccs-green' : 'border-border text-muted bg-white hover:border-ccs-green'}`}>
              🌱 Eggless only
            </button>

            {/* Sort */}
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="text-xs border-2 border-border rounded-full px-3 py-2 bg-white text-muted outline-none focus:border-plum cursor-pointer">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-muted flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Active filters:</span>
            {cat !== 'All' && <span className="flex items-center gap-1 text-xs bg-plum-light text-plum px-2.5 py-1 rounded-full font-medium">{cat}<button onClick={() => setCat('All')}><X className="w-3 h-3" /></button></span>}
            {egg && <span className="flex items-center gap-1 text-xs bg-ccs-green-lt text-ccs-green px-2.5 py-1 rounded-full font-medium">🌱 Eggless<button onClick={() => setEgg(false)}><X className="w-3 h-3" /></button></span>}
            {sort !== 'default' && <span className="flex items-center gap-1 text-xs bg-gold-light text-og-dark px-2.5 py-1 rounded-full font-medium">{SORTS.find(s=>s.value===sort)?.label}<button onClick={() => setSort('default')}><X className="w-3 h-3" /></button></span>}
          </div>
        )}

        {/* Results count */}
        {!isLoading && <p className="text-xs text-muted mb-4 font-medium">{products.length} cake{products.length !== 1 ? 's' : ''} found</p>}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array(10).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <Empty icon="🔍" title="No cakes found" subtitle="Try a different category or search term" action={
            <button onClick={() => { setCat('All'); setEgg(false) }} className="bg-plum text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-plum-dark transition-colors">
              Clear filters
            </button>
          } />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => {
              const emoji = p.emoji ?? getProductEmoji(p.category)
              return (
                <div key={p.id} onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(61,28,82,0.12)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <div className="aspect-square bg-gradient-to-br from-surface to-plum-light/20 flex items-center justify-center text-5xl relative overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-500" />
                      : <span className="group-hover:scale-110 transition-transform duration-300">{emoji}</span>
                    }
                    {p.isBestseller && <span className="absolute top-2 left-2 bg-plum text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ BESTSELLER</span>}
                    {p.isNew && !p.isBestseller && <span className="absolute top-2 left-2 bg-ccs-green text-white text-[9px] font-bold px-2 py-0.5 rounded-full">✨ NEW</span>}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-ink mb-1.5 line-clamp-2 leading-snug">{p.name}</h3>
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {(p.eggOption === 'eggless' || p.eggOption === 'both') && <span className="text-[10px] bg-ccs-green-lt text-ccs-green px-1.5 py-0.5 rounded-full font-medium">🌱 Eggless</span>}
                      {p.category && <span className="text-[10px] bg-surface text-muted px-1.5 py-0.5 rounded-full">{p.category}</span>}
                    </div>
                    {p.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] font-bold text-gold bg-gold-light px-1.5 py-0.5 rounded">★ {p.rating}</span>
                        <span className="text-[10px] text-hint">({p.reviewCount?.toLocaleString()})</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-plum">{formatPrice(p.price)}</span>
                      <button onClick={(e) => { e.stopPropagation(); quickAdd(p) }}
                        className="bg-plum text-white rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-plum-dark transition-colors active:scale-95">
                        Add +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
