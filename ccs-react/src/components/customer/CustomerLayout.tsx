import { useState } from 'react'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import { ShoppingCart, User, Search, Clock, Menu, X, LogOut, ArrowLeftRight, Key } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Modal, Input, Button, Alert } from '@/components/ui'
import { usersApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CustomerLayout() {
  const navigate  = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const cartCount = useCartStore((s) => s.count())

  const [cartOpen,    setCartOpen]    = useState(false)
  const [mobileMenu,  setMobileMenu]  = useState(false)
  const [searchQ,     setSearchQ]     = useState('')
  const [pwdOpen,     setPwdOpen]     = useState(false)
  const [curPwd,      setCurPwd]      = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [conPwd,      setConPwd]      = useState('')
  const [pwdLoading,  setPwdLoading]  = useState(false)
  const [pwdError,    setPwdError]    = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQ.trim()) navigate(`/catalog?q=${encodeURIComponent(searchQ.trim())}`)
  }

  function handleLogout() {
    clearAuth()
    toast.success('Logged out')
    navigate('/login')
  }

  async function handleChangePwd() {
    setPwdError('')
    if (!curPwd || !newPwd || !conPwd) { setPwdError('Fill all fields'); return }
    if (newPwd.length < 6) { setPwdError('Min 6 characters'); return }
    if (newPwd !== conPwd) { setPwdError('Passwords do not match'); return }
    setPwdLoading(true)
    try {
      await usersApi.changePassword(user!.id, curPwd, newPwd)
      toast.success('Password updated!')
      setPwdOpen(false); setCurPwd(''); setNewPwd(''); setConPwd('')
    } catch (e: any) { setPwdError(e.message) }
    setPwdLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Topbar */}
      <div className="bg-plum text-white text-center py-2 text-xs font-medium px-4">
        🎂 Free delivery above ₹799 &nbsp;·&nbsp; Same-day delivery in 50+ cities
      </div>

      {/* Navbar */}
      <nav className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="font-display text-xl text-plum flex-shrink-0">
            Celebration <span className="text-gold">Cake</span> Shop
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 relative hidden sm:block">
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search cakes, occasions, flavours…"
              className="w-full border border-border rounded-full px-4 py-2 text-sm bg-surface outline-none focus:border-plum-mid focus:bg-white transition-colors"
            />
            <button type="submit" className="absolute right-1 top-1 bg-plum text-white rounded-full px-4 py-1.5 text-xs font-medium">
              Search
            </button>
          </form>

          {/* Nav actions */}
          <div className="flex items-center gap-1 ml-auto sm:ml-0">
            <button onClick={() => navigate('/login')} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs text-muted hover:bg-plum-light hover:text-plum transition-colors">
              <ArrowLeftRight className="w-5 h-5" />
              Switch
            </button>
            <button onClick={() => user ? navigate('/account') : navigate('/login')} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs text-muted hover:bg-plum-light hover:text-plum transition-colors">
              <User className="w-5 h-5" />
              {user?.name.split(' ')[0] ?? 'Account'}
            </button>
            <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs text-muted hover:bg-plum-light hover:text-plum transition-colors">
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartCount > 0 && (
                <span className="absolute top-1 right-2 bg-rose text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/track')} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg text-xs text-muted hover:bg-plum-light hover:text-plum transition-colors">
              <Clock className="w-5 h-5" />
              Track
            </button>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Cart Drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Change Password Modal */}
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Password">
        <div className="flex flex-col gap-3">
          <Alert message={pwdError} type="error" />
          <Input label="Current Password" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
          <Input label="New Password"     type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <Input label="Confirm Password" type="password" value={conPwd} onChange={(e) => setConPwd(e.target.value)} />
          <Button onClick={handleChangePwd} loading={pwdLoading} className="w-full mt-1">Update Password</Button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Cart Drawer ─────────────────────────────────────
function CartDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { items, removeItem, updateQty, total, coupon } = useCartStore()

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = subtotal - total()
  const finalTotal = total()
  const freeDelivery = finalTotal >= 799

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-modal flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-xl text-plum">Your Cart ({items.length})</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted hover:bg-ccs-red-lt hover:text-ccs-red transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <span className="text-5xl">🛒</span>
            <p className="font-medium text-ink">Your cart is empty</p>
            <p className="text-sm text-muted">Add some delicious cakes!</p>
            <button onClick={() => { onClose(); navigate('/catalog') }} className="btn-primary mt-2 px-6 py-2.5 text-sm">
              Browse Cakes
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-surface rounded-xl p-3">
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                    {item.weight && <p className="text-xs text-muted">{item.weight}</p>}
                    <p className="text-sm font-semibold text-plum">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-sm hover:border-plum transition-colors">−</button>
                    <span className="text-sm font-medium w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 rounded-full bg-plum text-white flex items-center justify-center text-sm">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border space-y-2">
              {!freeDelivery && (
                <p className="text-xs text-center text-muted bg-gold/10 rounded-lg py-2">
                  Add ₹{Math.ceil(799 - finalTotal)} more for free delivery 🚀
                </p>
              )}
              {coupon && <div className="flex justify-between text-sm"><span className="text-muted">Discount ({coupon.code})</span><span className="text-ccs-green font-medium">−₹{discount.toFixed(0)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted">Delivery</span><span className={freeDelivery ? 'text-ccs-green font-medium' : ''}>{freeDelivery ? 'FREE' : '₹49'}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-border pt-2 mt-2">
                <span>Total</span><span className="text-plum">₹{finalTotal.toFixed(0)}</span>
              </div>
              <button onClick={() => { onClose(); navigate('/checkout') }}
                className="w-full bg-plum text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-plum-dark transition-colors mt-1">
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
