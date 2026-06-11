// ProductDetail.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/lib/api'
import { useCartStore } from '@/store/cart'
import { Spinner, Button } from '@/components/ui'
import { formatPrice, getProductEmoji } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addItem  = useCartStore((s) => s.addItem)

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(Number(id)).then((r) => r.data),
  })

  const p = data as any
  if (isLoading) return <Spinner />
  if (!p) return <div className="p-8 text-center text-muted">Product not found</div>

  const emoji = p.emoji ?? getProductEmoji(p.category)

  function addToCart() {
    addItem({ id: p.id, name: p.name, price: p.price, emoji })
    toast.success(`${p.name} added to cart! 🎂`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-sm text-muted mb-6 cursor-pointer hover:text-plum" onClick={() => navigate(-1)}>← Back</p>
      <div className="grid sm:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-surface rounded-3xl aspect-square flex items-center justify-center text-9xl">
          {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-3xl" /> : emoji}
        </div>
        {/* Info */}
        <div>
          <p className="eyebrow mb-2">{p.category}</p>
          <h1 className="font-display text-4xl text-plum mb-3">{p.name}</h1>
          {p.rating && <p className="text-sm text-muted mb-4">⭐ <strong className="text-gold">{p.rating}</strong> · {p.reviewCount?.toLocaleString()} reviews</p>}
          {p.description && <p className="text-muted text-sm leading-relaxed mb-6">{p.description}</p>}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-4xl text-plum font-bold">{formatPrice(p.price)}</span>
            {p.originalPrice && <span className="text-hint text-lg line-through">{formatPrice(p.originalPrice)}</span>}
          </div>
          <div className="flex gap-3">
            <Button onClick={addToCart} size="lg" className="flex-1">Add to Cart</Button>
            <Button onClick={() => { addToCart(); navigate('/checkout') }} variant="gold" size="lg">Buy Now</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
