// Track Order Page
import { useState } from 'react'
import { ordersApi } from '@/lib/api'
import { Order } from '@/lib/types'
import { Button, Input, Alert } from '@/components/ui'
import { ORDER_STATUS_LABEL } from '@/lib/utils'

export default function TrackPage() {
  const [orderNum, setOrderNum] = useState('')
  const [order, setOrder]       = useState<Order | null>(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function track() {
    if (!orderNum.trim()) { setError('Enter your order number'); return }
    setLoading(true); setError('')
    try {
      const res = await ordersApi.track(orderNum.trim())
      setOrder(res.data)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const STEPS = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered']
  const currentStep = order ? STEPS.indexOf(order.status) : -1

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl text-plum mb-2">Track Order</h1>
      <p className="text-muted mb-8">Enter your order number to see live status</p>

      <div className="flex gap-3 mb-6">
        <Input placeholder="e.g. CCS-1234567890" value={orderNum} onChange={(e) => setOrderNum(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && track()} className="flex-1" />
        <Button onClick={track} loading={loading} size="lg">Track</Button>
      </div>

      <Alert message={error} type="error" />

      {order && (
        <div className="bg-white border border-border rounded-2xl p-6 mt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-semibold text-ink">{order.orderNumber}</p>
              <p className="text-sm text-muted">{order.items?.length} item(s) · ₹{order.total}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              order.status === 'delivered' ? 'bg-ccs-green-lt text-ccs-green' :
              order.status === 'cancelled' ? 'bg-ccs-red-lt text-ccs-red' :
              'bg-og-light text-og-dark'
            }`}>
              {ORDER_STATUS_LABEL[order.status]}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 ${i > currentStep ? 'opacity-30' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${i < currentStep ? 'bg-ccs-green text-white' :
                    i === currentStep ? 'bg-plum text-white' :
                    'bg-surface text-hint border border-border'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <p className={`text-sm ${i === currentStep ? 'font-semibold text-ink' : 'text-muted'}`}>
                  {ORDER_STATUS_LABEL[s as any]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
