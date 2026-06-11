import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { ordersApi, couponsApi, deliveryApi } from '@/lib/api'
import { Button, Input, Alert, Spinner, PageHeader } from '@/components/ui'
import { formatPrice, toArray } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { Tag, MapPin, Clock, CreditCard, CheckCircle2, ChevronRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'Cash on Delivery', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when order arrives' },
  { id: 'UPI',              label: 'UPI',              icon: '📱', desc: 'GPay, PhonePe, Paytm' },
  { id: 'Card',             label: 'Card',             icon: '💳', desc: 'Credit or debit card'  },
]

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
  const [couponLoading, setCouponLoading] = useState(false)
  const [error,    setError]   = useState('')
  const [loading,  setLoading] = useState(false)
  const [step,     setStep]    = useState(1)

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots'],
    queryFn: () => deliveryApi.slots().then((r) => r.data),
  })
  const slots = toArray<any>(slotsData)

  const subtotal   = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const finalTotal = total()
  const discount   = subtotal - finalTotal
  const delivery   = finalTotal >= 799 ? 0 : 49
  const grandTotal = finalTotal + delivery

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponMsg('')
    try {
      const res = await couponsApi.validate(couponCode.trim(), subtotal)
      const d = res.data as any
      setCoupon({ code: couponCode.toUpperCase(), discount: d.discountAmount ?? 0, type: d.type ?? 'fixed' })
      setCouponMsg('✅ ' + (d.message ?? 'Coupon applied!'))
    } catch (e: any) { setCouponMsg('❌ ' + e.message) }
    setCouponLoading(false)
  }

  function validateStep1() {
    if (!name.trim()) { setError('Please enter your name'); return false }
    if (!mobile.trim() || mobile.length < 10) { setError('Enter a valid mobile number'); return false }
    if (!line1.trim()) { setError('Please enter your address'); return false }
    if (!city.trim()) { setError('Please enter your city'); return false }
    if (!pincode.trim() || pincode.length < 6) { setError('Enter a valid 6-digit pincode'); return false }
    return true
  }

  function validateStep2() {
    if (!slot) { setError('Please select a delivery slot'); return false }
    return true
  }

  async function placeOrder() {
    setError('')
    setLoading(true)
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.id, quantity: i.qty, price: Number(i.price), weight: i.weight, eggOption: i.eggOption })),
        address: { name, mobile, line1, city, pincode },
        deliverySlot: slot,
        paymentMethod: payment,
        couponCode: coupon?.code,
        total: grandTotal,
      }
      const res = await ordersApi.create(payload)
      const ord = res.data as any
      clearCart()
      toast.success(`🎂 Order placed! ${ord.orderNumber}`)
      navigate('/track')
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-5">🛒</div>
      <h2 className="font-display text-3xl text-plum mb-3">Cart is empty</h2>
      <p className="text-muted mb-6">Add some delicious cakes before checking out</p>
      <Button onClick={() => navigate('/catalog')} size="lg">Browse Cakes</Button>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Checkout"
        breadcrumb={[{ label: 'Home', onClick: () => navigate('/home') }, { label: 'Cart', onClick: () => navigate('/home') }, { label: 'Checkout', onClick: () => {} }]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[{ n: 1, label: 'Address' }, { n: 2, label: 'Slot & Payment' }, { n: 3, label: 'Review' }].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step >= n ? 'bg-plum text-white' : 'bg-surface text-muted'}`}>
                {step > n ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{n}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-hint" />}
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="sm:col-span-2 space-y-4">
            {error && <Alert message={error} type="error" />}

            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-white border border-border rounded-2xl p-5 animate-slideUp">
                <h3 className="flex items-center gap-2 font-semibold text-ink mb-4"><MapPin className="w-4 h-4 text-plum" /> Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Full Name"    value={name}    onChange={(e) => setName(e.target.value)}    placeholder="Your full name"   className="sm:col-span-2" />
                  <Input label="Mobile"       value={mobile}  onChange={(e) => setMobile(e.target.value)}  placeholder="10-digit number"  />
                  <Input label="City"         value={city}    onChange={(e) => setCity(e.target.value)}    placeholder="Mumbai" />
                  <Input label="Address"      value={line1}   onChange={(e) => setLine1(e.target.value)}   placeholder="House / flat / street / area" className="sm:col-span-2" />
                  <Input label="Pincode"      value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="6-digit pincode" />
                </div>
                <Button
                  onClick={() => { if (validateStep1()) { setError(''); setStep(2) } }}
                  size="lg" className="w-full mt-4"
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  Continue to Slot Selection
                </Button>
              </div>
            )}

            {/* Step 2: Slot + Payment */}
            {step === 2 && (
              <div className="space-y-4 animate-slideUp">
                <div className="bg-white border border-border rounded-2xl p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-ink mb-4"><Clock className="w-4 h-4 text-plum" /> Delivery Slot</h3>
                  {slotsLoading ? <Spinner size="sm" /> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {slots.map((s: any) => (
                        <button key={s.id} onClick={() => setSlot(s.label)}
                          className={`py-3 px-3 rounded-xl text-sm border-2 font-medium transition-all duration-200 ${slot === s.label ? 'bg-plum text-white border-plum shadow-sm' : 'border-border text-muted hover:border-plum-mid hover:text-plum hover:bg-plum-light'}`}>
                          🕐 {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-border rounded-2xl p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-ink mb-4"><CreditCard className="w-4 h-4 text-plum" /> Payment Method</h3>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((m) => (
                      <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${payment === m.id ? 'border-plum bg-plum-light' : 'border-border hover:border-plum-mid'}`}>
                        <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} className="accent-plum" />
                        <span className="text-xl">{m.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-ink">{m.label}</p>
                          <p className="text-xs text-muted">{m.desc}</p>
                        </div>
                        {payment === m.id && <CheckCircle2 className="w-4 h-4 text-plum ml-auto" />}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setError(''); setStep(1) }} className="flex-1">← Back</Button>
                  <Button onClick={() => { if (validateStep2()) { setError(''); setStep(3) } }} className="flex-1" icon={<ChevronRight className="w-4 h-4" />}>
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4 animate-slideUp">
                <div className="bg-white border border-border rounded-2xl p-5">
                  <h3 className="font-semibold text-ink mb-4">📋 Review Your Order</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-border">
                      <span className="text-muted flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Deliver to</span>
                      <span className="text-ink font-medium text-right">{name}, {city} – {pincode}</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-border">
                      <span className="text-muted flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Slot</span>
                      <span className="text-ink font-medium">{slot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Payment</span>
                      <span className="text-ink font-medium">{payment}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setError(''); setStep(2) }} className="flex-1">← Back</Button>
                  <Button onClick={placeOrder} loading={loading} className="flex-1 bg-ccs-green hover:opacity-90" icon={<CheckCircle2 className="w-4 h-4" />}>
                    Place Order 🎂
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div>
            <div className="bg-white border border-border rounded-2xl p-5 sticky top-20">
              <h3 className="font-semibold text-ink mb-4">Order Summary</h3>

              {/* Items */}
              <div className="space-y-2.5 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center text-lg flex-shrink-0">{item.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{item.name}</p>
                      <p className="text-xs text-muted">×{item.qty}</p>
                    </div>
                    <span className="text-xs font-semibold text-ink flex-shrink-0">{formatPrice(Number(item.price) * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hint" />
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code"
                    className="w-full border border-border rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none focus:border-plum-mid bg-surface" />
                </div>
                <button onClick={applyCoupon} disabled={couponLoading || !couponCode}
                  className="bg-plum-light text-plum text-xs px-3 rounded-xl font-semibold hover:bg-plum hover:text-white transition-all disabled:opacity-50">
                  Apply
                </button>
              </div>
              {couponMsg && <p className={`text-xs mb-3 ${couponMsg.startsWith('✅') ? 'text-ccs-green' : 'text-ccs-red'}`}>{couponMsg}</p>}

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-border pt-3">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between"><span className="text-muted">Discount</span><span className="text-ccs-green font-medium">−{formatPrice(discount)}</span></div>}
                <div className="flex justify-between text-muted"><span>Delivery</span><span className={delivery === 0 ? 'text-ccs-green font-medium' : 'text-ink'}>{delivery === 0 ? '🚚 FREE' : formatPrice(delivery)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                  <span>Total</span><span className="text-plum text-lg">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {delivery > 0 && (
                <p className="text-[11px] text-og-dark bg-og-light rounded-lg px-3 py-2 mt-3 text-center font-medium">
                  Add {formatPrice(799 - finalTotal)} more for 🚚 FREE delivery
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
