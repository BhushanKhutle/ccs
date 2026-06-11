import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { Spinner, Empty } from '@/components/ui'
import { toArray, formatPrice, getProductEmoji } from '@/lib/utils'
import { Product } from '@/lib/types'
import { SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['All', 'Birthday', 'Wedding', 'Chocolate', 'Eggless', 'Cupcakes', 'Cheesecake', 'Custom']
const OCCASIONS  = ['All', 'Birthday', 'Anniversary', 'Wedding', 'Baby Shower', 'Graduation']

export default function CatalogPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const addItem        = useCartStore((s) => s.addItem)
  const [cat, setCat]  = useState('All')
  const [occ, setOcc]  = useState('All')
  const [sort, setSort]= useState('default')

  const searchQ = params.get('q') ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.list().then((r) => r.data),
  })

  let products = toArray<Product>(data)

  // Filter
  if (searchQ) products = products.filter((p) => p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.category?.toLowerCase().includes(searchQ.toLowerCase()))
  if (cat !== 'All') products = products.filter((p) => p.category?.includes(cat) || p.name.toLowerCase().includes(cat.toLowerCase()))
  if (occ !== 'All') products = products.filter((p) => p.occasion?.includes(occ) || p.name.toLowerCase().includes(occ.toLowerCase()))

  // Sort
  if (sort === 'price-asc')  products = [...products].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') products = [...products].sort((a, b) => b.price - a.price)
  if (sort === 'rating')     products = [...products].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))

  function quickAdd(p: Product) {
    addItem({ id: p.id, name: p.name, price: p.price, emoji: p.emoji ?? getProductEmoji(p.category) })
    toast.success(`${p.name} added! 🎂`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="bg-plum-light rounded-2xl px-6 py-8 mb-8">
        <p className="text-xs text-muted mb-1"><span className="text-plum cursor-pointer" onClick={() => navigate('/home')}>Home</span> / All Cakes</p>
        <h1 className="font-display text-4xl text-plum">{searchQ ? `Results for "${searchQ}"` : 'All Cakes'}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Category */}
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-all
                ${cat === c ? 'bg-plum text-white border-plum' : 'border-border text-muted hover:border-plum-mid hover:text-plum bg-white'}`}>
              {c}
            </button>
          ))}
        </div>
        {/* Sort */}
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="ml-auto text-xs border border-border rounded-xl px-3 py-1.5 bg-white text-muted outline-none focus:border-plum-mid">
          <option value="default">Sort: Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? <Spinner /> : products.length === 0 ? (
        <Empty icon="🔍" title="No cakes found" subtitle="Try a different filter or search term" />
      ) : (
        <>
          <p className="text-sm text-muted mb-4">{products.length} cakes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => {
              const emoji = p.emoji ?? getProductEmoji(p.category)
              return (
                <div key={p.id} onClick={() => navigate(`/product/${p.id}`)}
                  className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-cake hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                  <div className="aspect-square bg-surface flex items-center justify-center text-5xl relative">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover absolute inset-0" /> : emoji}
                    {p.isBestseller && <span className="absolute top-2 left-2 bg-plum text-white text-[10px] font-bold px-2 py-0.5 rounded-full">BESTSELLER</span>}
                    {p.isNew && !p.isBestseller && <span className="absolute top-2 left-2 bg-ccs-green text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-ink mb-1 line-clamp-2">{p.name}</h3>
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {p.eggOption === 'eggless' && <span className="text-[10px] bg-ccs-green-lt text-ccs-green px-1.5 py-0.5 rounded-full">🌱 Eggless</span>}
                      {p.category && <span className="text-[10px] bg-surface text-muted px-1.5 py-0.5 rounded-full">{p.category}</span>}
                    </div>
                    {p.rating && <p className="text-xs text-muted mb-2">⭐ <strong className="text-gold">{p.rating}</strong> ({p.reviewCount?.toLocaleString()})</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-plum">{formatPrice(p.price)}</span>
                      <button onClick={(e) => { e.stopPropagation(); quickAdd(p) }}
                        className="bg-plum text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-plum-dark transition-colors">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
