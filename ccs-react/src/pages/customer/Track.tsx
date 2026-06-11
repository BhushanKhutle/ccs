import { useState } from 'react'
import { ordersApi } from '@/lib/api'
import { Order } from '@/lib/types'
import { Button, Alert, PageHeader } from '@/components/ui'
import { ORDER_STATUS_LABEL, formatDate, formatPrice } from '@/lib/utils'
import { Search, Package, CheckCircle2, Clock, Truck, ChefHat, ShoppingBag, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  { status: 'placed',           label: 'Order Placed',       icon: ShoppingBag, color: 'text-ccs-blue',  bg: 'bg-ccs-blue-lt'  },
  { status: 'confirmed',        label: 'Confirmed',          icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50'   },
  { status: 'preparing',        label: 'Being Prepared',     icon: ChefHat,     color: 'text-og',         bg: 'bg-og-light'     },
  { status: 'ready_for_pickup', label: 'Ready for Pickup',   icon: Package,     color: 'text-orange-500', bg: 'bg-orange-50'    },
  { status: 'out_for_delivery', label: 'Out for Delivery',   icon: Truck,       color: 'text-indigo-600', bg: 'bg-indigo-50'    },
  { status: 'delivered',        label: 'Delivered',          icon: CheckCircle2,color: 'text-ccs-green',  bg: 'bg-ccs-green-lt' },
]

export default function TrackPage() {
  const navigate  = useNavigate()
  const [query,   setQuery]   = useState('')
  const [order,   setOrder]   = useState<Order | null>(null)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function track() {
    if (!query.trim()) { setError('Enter your order number'); return }
    setLoading(true); setError(''); setOrder(null)
    try {
      const res = await ordersApi.track(query.trim())
      setOrder(res.data as Order)
    } catch (e: any) { setError('Order not found. Check your order number and try again.') }
    setLoading(false)
  }

  const currentIdx = order ? STEPS.findIndex((s) => s.status === order.status) : -1
  const isCancelled = order?.status === 'cancelled'

  return (
    <div>
      <PageHeader
        title="Track Order"
        subtitle="Real-time order tracking"
        breadcrumb={[{ label: 'Home', onClick: () => navigate('/home') }, { label: 'Track', onClick: () => {} }]}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Search box */}
        <div className="bg-white border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-ink mb-3">Enter your order number</p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && track()}
                placeholder="e.g. CCS-1781118663316"
                className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-plum-mid focus:ring-2 focus:ring-plum/10 transition-all"
              />
            </div>
            <Button onClick={track} loading={loading} size="lg" icon={<Search className="w-4 h-4" />}>
              Track
            </Button>
          </div>
          {error && <Alert message={error} type="error" className="mt-3" />}
        </div>

        {/* Result */}
        {order && (
          <div className="animate-slideUp space-y-4">
            {/* Order summary card */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-ink text-base">{order.orderNumber}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                {isCancelled ? (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-ccs-red-lt text-ccs-red px-3 py-1.5 rounded-full">
                    <XCircle className="w-3.5 h-3.5" /> Cancelled
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-ccs-green-lt text-ccs-green px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5" /> {ORDER_STATUS_LABEL[order.status]}
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="bg-surface rounded-xl p-3 mb-3 space-y-1.5">
                {(order.items ?? []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted">{item.productName} <span className="text-hint">×{item.quantity}</span></span>
                    <span className="font-medium text-ink">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between font-semibold text-sm">
                  <span>Total</span><span className="text-plum">{formatPrice(Number(order.total))}</span>
                </div>
              </div>

              {/* Delivery info */}
              {order.address && (
                <div className="text-xs text-muted space-y-0.5">
                  <p className="font-medium text-ink text-sm">{order.address.name}</p>
                  <p>{order.address.line1}, {order.address.city} – {order.address.pincode}</p>
                  {order.deliverySlot && <p>🕐 Slot: {order.deliverySlot}</p>}
                </div>
              )}
            </div>

            {/* OTP Box — shown when order is out for delivery */}
            {order.status === 'out_for_delivery' && order.otp && (
              <div className="bg-white border-2 border-plum rounded-2xl p-5 animate-slideUp">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔐</span>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">Your Delivery OTP</h3>
                    <p className="text-xs text-muted">Share this with the delivery agent to confirm delivery</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 mb-3">
                  {String(order.otp).split('').map((digit, i) => (
                    <div key={i} className="w-14 h-16 bg-plum rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted bg-surface rounded-xl py-2 px-3">
                  🚚 Your order is on its way! Agent will ask for this OTP on arrival.
                </p>
              </div>
            )}

            {/* Progress tracker */}
            {!isCancelled && (
              <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-ink mb-5 text-sm">Order Progress</h3>
                <div className="relative">
                  {/* Progress line */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
                  <div
                    className="absolute left-5 top-5 w-0.5 bg-plum transition-all duration-700"
                    style={{ height: `${Math.max(0, currentIdx) * (100 / (STEPS.length - 1))}%` }}
                  />
                  <div className="space-y-5 relative">
                    {STEPS.map((step, i) => {
                      const Icon = step.icon
                      const done = i <= currentIdx
                      const current = i === currentIdx
                      return (
                        <div key={step.status} className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300 relative z-10 ${
                            done
                              ? `${step.bg} border-current ${step.color}`
                              : 'bg-white border-border text-hint'
                          }`}>
                            <Icon className={`w-4 h-4 ${current ? 'animate-pulse-soft' : ''}`} />
                          </div>
                          <div className="pt-2">
                            <p className={`text-sm font-semibold ${done ? 'text-ink' : 'text-hint'}`}>{step.label}</p>
                            {current && <p className="text-xs text-plum font-medium mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-plum rounded-full animate-pulse" />In progress</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!order && !loading && !error && (
          <div className="text-center py-12 text-muted">
            <div className="text-6xl mb-4">📦</div>
            <p className="font-medium text-ink mb-1">Track your order</p>
            <p className="text-sm">Enter your order number from the confirmation message</p>
          </div>
        )}
      </div>
    </div>
  )
}
