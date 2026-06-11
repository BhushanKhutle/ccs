import { useState } from 'react'
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { ShoppingCart, User, Search, Clock, ArrowLeftRight, X, Minus, Plus, Tag, Trash2, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Modal, Input, Button, Alert } from '@/components/ui'
import { usersApi, couponsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function CustomerLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, clearAuth } = useAuthStore()
  const { items, count, total, coupon, setCoupon, removeItem, updateQty } = useCartStore()
  const cartCount = count()

  const [cartOpen,   setCartOpen]   = useState(false)
  const [searchQ,    setSearchQ]    = useState('')
  const [pwdOpen,    setPwdOpen]    = useState(false)
  const [curPwd,     setCurPwd]     = useState('')
  const [newPwd,     setNewPwd]     = useState('')
  const [conPwd,     setConPwd]     = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError,   setPwdError]   = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg,  setCouponMsg]  = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQ.trim()) { navigate(`/catalog?q=${encodeURIComponent(searchQ.trim())}`); setSearchQ('') }
  }

  async function handleChangePwd() {
    setPwdError('')
    if (!curPwd || !newPwd || !conPwd) { setPwdError('Please fill all fields'); return }
    if (newPwd.length < 6) { setPwdError('Min 6 characters'); return }
    if (newPwd !== conPwd) { setPwdError('Passwords do not match'); return }
    setPwdLoading(true)
    try {
      await usersApi.changePassword(user!.id, curPwd, newPwd)
      toast.success('Password updated! 🔐')
      setPwdOpen(false); setCurPwd(''); setNewPwd(''); setConPwd('')
    } catch (e: any) { setPwdError(e.message) }
    setPwdLoading(false)
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true); setCouponMsg('')
    try {
      const subtotal = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)
      const res = await couponsApi.validate(couponCode.trim(), subtotal)
      const d = res.data as any
      setCoupon({ code: couponCode.toUpperCase(), discount: d.discountAmount ?? d.discount ?? 0, type: d.type ?? 'fixed' })
      setCouponMsg('✅ Coupon applied!')
      toast.success('Coupon applied! 🎁')
    } catch (e: any) { setCouponMsg('❌ ' + e.message) }
    setCouponLoading(false)
  }

  const subtotal   = items.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const finalTotal = total()
  const discount   = subtotal - finalTotal
  const delivery   = finalTotal >= 799 ? 0 : 49

  const navLinks = [
    { path: '/home',    label: 'Home'    },
    { path: '/catalog', label: 'Cakes'   },
    { path: '/track',   label: 'Track'   },
  ]

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center gap-4">
            {/* Logo */}
            <Link to="/home" className="font-display text-xl text-plum flex-shrink-0 hover:opacity-80 transition-opacity">
              🎂 <span className="hidden sm:inline">Celebration <span className="text-gold">Cake</span> Shop</span>
              <span className="sm:hidden text-gold">CCS</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <Link key={l.path} to={l.path} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === l.path ? 'bg-plum-light text-plum' : 'text-muted hover:text-plum hover:bg-surface'}`}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg relative hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search cakes, occasions, flavours…"
                className="w-full border border-border rounded-full pl-10 pr-4 py-2.5 text-sm bg-surface outline-none focus:border-plum-mid focus:bg-white focus:ring-2 focus:ring-plum/10 transition-all"
              />
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => { clearAuth(); navigate('/login') }}
                title="Switch portal"
                className="hidden sm:flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs text-muted hover:bg-plum-light hover:text-plum transition-all"
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span>Switch</span>
              </button>

              <button
                onClick={() => user ? navigate('/account') : navigate('/login')}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs text-muted hover:bg-plum-light hover:text-plum transition-all"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block">{user?.name.split(' ')[0] ?? 'Account'}</span>
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs text-muted hover:bg-plum-light hover:text-plum transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:block">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 animate-scaleIn">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate('/track')}
                className="hidden sm:flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs text-muted hover:bg-plum-light hover:text-plum transition-all"
              >
                <Clock className="w-5 h-5" />
                <span>Track</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hint" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search cakes…"
              className="w-full border border-border rounded-full pl-10 pr-4 py-2.5 text-sm bg-surface outline-none focus:border-plum-mid"
            />
          </form>
        </div>
      </nav>

      {/* Page */}
      <main className="flex-1"><Outlet /></main>

      {/* Cart Drawer */}
      {cartOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-modal flex flex-col animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-display text-xl text-plum">Your Cart</h2>
                <p className="text-xs text-muted">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted hover:bg-ccs-red-lt hover:text-ccs-red transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-4xl">🛒</div>
                <div>
                  <p className="font-semibold text-ink mb-1">Your cart is empty</p>
                  <p className="text-sm text-muted">Add some delicious cakes!</p>
                </div>
                <button onClick={() => { setCartOpen(false); navigate('/catalog') }} className="bg-plum text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-plum-dark transition-colors">
                  Browse Cakes
                </button>
              </div>
            ) : (
              <>
                {/* Free delivery progress */}
                {finalTotal < 799 && (
                  <div className="px-5 py-3 bg-gold-light border-b border-border">
                    <div className="flex justify-between text-xs text-og-dark mb-1.5 font-medium">
                      <span>Add ₹{Math.ceil(799 - finalTotal)} more for free delivery 🚚</span>
                    </div>
                    <div className="h-1.5 bg-gold/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (finalTotal / 799) * 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-surface rounded-2xl p-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-border">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                        <p className="text-sm font-bold text-plum">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:border-ccs-red hover:bg-ccs-red-lt hover:text-ccs-red transition-colors">
                          {item.qty === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-full bg-plum text-white flex items-center justify-center hover:bg-plum-dark transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="px-4 py-3 border-t border-border">
                  <div className="flex gap-2 mb-1.5">
                    <div className="flex-1 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hint" />
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Coupon code"
                        className="w-full border border-border rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none focus:border-plum-mid bg-surface"
                      />
                    </div>
                    <button onClick={applyCoupon} disabled={couponLoading || !couponCode} className="bg-plum-light text-plum text-xs px-3 py-2.5 rounded-xl font-semibold hover:bg-plum hover:text-white transition-all disabled:opacity-50">
                      Apply
                    </button>
                  </div>
                  {couponMsg && <p className={`text-xs ${couponMsg.startsWith('✅') ? 'text-ccs-green' : 'text-ccs-red'}`}>{couponMsg}</p>}
                </div>

                {/* Summary */}
                <div className="px-5 pb-5 space-y-2.5 border-t border-border pt-3">
                  <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span className="text-ink">{formatPrice(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted">Discount</span><span className="text-ccs-green font-medium">−{formatPrice(discount)}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-muted">Delivery</span><span className={delivery === 0 ? 'text-ccs-green font-medium' : 'text-ink'}>{delivery === 0 ? '🚚 FREE' : formatPrice(delivery)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2.5">
                    <span>Total</span><span className="text-plum text-lg">{formatPrice(finalTotal + delivery)}</span>
                  </div>
                  <button
                    onClick={() => { setCartOpen(false); navigate('/checkout') }}
                    className="w-full bg-plum text-white py-4 rounded-2xl font-semibold hover:bg-plum-dark transition-colors flex items-center justify-center gap-2 mt-1"
                  >
                    Checkout <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Change Password Modal */}
      <Modal open={pwdOpen} onClose={() => { setPwdOpen(false); setPwdError('') }} title="Change Password" subtitle="Keep your account secure">
        <div className="flex flex-col gap-3">
          <Alert message={pwdError} type="error" />
          <Input label="Current Password" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="••••••••" />
          <Input label="New Password"     type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 6 characters" />
          <Input label="Confirm Password" type="password" value={conPwd} onChange={(e) => setConPwd(e.target.value)} placeholder="Repeat new password" onKeyDown={(e) => e.key === 'Enter' && handleChangePwd()} />
          <Button onClick={handleChangePwd} loading={pwdLoading} className="w-full mt-1">Update Password</Button>
        </div>
      </Modal>
    </div>
  )
}
