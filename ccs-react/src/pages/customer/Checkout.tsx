import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { ordersApi, couponsApi, deliveryApi } from '@/lib/api'
import { Button, Input, Alert } from '@/components/ui'
import { formatPrice } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { toArray } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const { items, total, coupon, setCoupon, clearCart } = useCartStore()

  const [name,     setName]    = useState(user?.name ?? '')
  const [mobile,   setMobile]  = useState(user?.mobile ?? '')
  const [line1,    setLine1]   = useState('')
  const [city,     setCity]    = useState('')
  const [pincode,  setPincode] = useState('')
  const [slot,     setSlot]    = useState('')
  const [payment,  setPayment] = useState('Cash on Delivery')
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg,  setCouponMsg]  = useState('')
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)

  const { data: slotsData } = useQuery({ queryKey: ['slots'], queryFn: () => deliveryApi.slots().then((r) => r.data) })
  const slots = toArray<any>(slotsData)

  const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0)
  const finalTotal = total()
  const discount   = subtotal - finalTotal
  const delivery   = finalTotal >= 799 ? 0 : 49

  async function applyCoupon() {
    try {
      const res = await couponsApi.validate(couponCode, subtotal)
      const d   = res.data as any
      setCoupon({ code: couponCode, discount: d.discountAmount ?? d.discount ?? 0, type: d.type ?? 'fixed' })
      setCouponMsg(`✅ ${d.message ?? 'Coupon applied!'}`)
    } catch (e: any) { setCouponMsg('❌ ' + e.message) }
  }

  async function placeOrder() {
    if (!name || !mobile || !line1 || !city || !pincode) { setError('Please fill all address fields'); return }
    if (!slot) { setError('Please select a delivery slot'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.id, quantity: i.qty, price: i.price, weight: i.weight, eggOption: i.eggOption })),
        address: { name, mobile, line1, city, pincode },
        deliverySlot: slot,
        paymentMethod: payment,
        couponCode: coupon?.code,
        total: finalTotal + delivery,
      }
      const res = await ordersApi.create(payload)
      const ord = res.data as any
      clearCart()
      toast.success(`Order placed! 🎂 ${ord.orderNumber}`)
      navigate('/track')
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <span className="text-6xl block mb-4">🛒</span>
      <h2 className="font-display text-2xl text-plum mb-3">Your cart is empty</h2>
      <Button onClick={() => navigate('/catalog')}>Browse Cakes</Button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl text-plum mb-8">Checkout</h1>
      <div className="grid sm:grid-cols-3 gap-8">
        {/* Form */}
        <div className="sm:col-span-2 space-y-6">
          <Alert message={error} type="error" />

          {/* Address */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-ink mb-4">Delivery Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name"    value={name}    onChange={(e) => setName(e.target.value)}    className="col-span-2" />
              <Input label="Mobile"       value={mobile}  onChange={(e) => setMobile(e.target.value)}  />
              <Input label="City"         value={city}    onChange={(e) => setCity(e.target.value)}    />
              <Input label="Address"      value={line1}   onChange={(e) => setLine1(e.target.value)}   className="col-span-2" placeholder="House / street / area" />
              <Input label="Pincode"      value={pincode} onChange={(e) => setPincode(e.target.value)} />
            </div>
          </div>

          {/* Slot */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-ink mb-4">Delivery Slot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((s: any) => (
                <button key={s.id} onClick={() => setSlot(s.label)}
                  className={`py-2.5 px-3 rounded-xl text-sm border transition-all ${slot === s.label ? 'bg-plum text-white border-plum' : 'border-border text-muted hover:border-plum-mid'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-ink mb-4">Payment</h3>
            {['Cash on Delivery', 'UPI', 'Card'].map((p) => (
              <label key={p} className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="radio" name="payment" value={p} checked={payment === p} onChange={() => setPayment(p)} className="accent-plum" />
                <span className="text-sm text-ink">{p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5 sticky top-20">
            <h3 className="font-semibold text-ink mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-muted truncate flex-1 mr-2">{i.name} ×{i.qty}</span>
                  <span className="font-medium">{formatPrice(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="flex gap-2 mb-4">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code"
                className="flex-1 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-plum-mid" />
              <button onClick={applyCoupon} className="bg-plum-light text-plum text-xs px-3 py-2 rounded-xl font-medium">Apply</button>
            </div>
            {couponMsg && <p className={`text-xs mb-3 ${couponMsg.startsWith('✅') ? 'text-ccs-green' : 'text-ccs-red'}`}>{couponMsg}</p>}

            <div className="space-y-1.5 text-sm border-t border-border pt-3">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-ccs-green">−{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">Delivery</span><span className={delivery === 0 ? 'text-ccs-green font-medium' : ''}>{delivery === 0 ? 'FREE' : formatPrice(delivery)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                <span>Total</span><span className="text-plum">{formatPrice(finalTotal + delivery)}</span>
              </div>
            </div>

            <Button onClick={placeOrder} loading={loading} size="lg" className="w-full mt-4">
              Place Order 🎂
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
