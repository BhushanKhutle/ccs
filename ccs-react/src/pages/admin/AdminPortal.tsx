import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, productsApi, usersApi, couponsApi } from '@/lib/api'
import { Order, Product, User, Coupon } from '@/lib/types'
import { Spinner, Empty, Button, Modal, Input, Alert, Badge, Toggle } from '@/components/ui'
import { toArray, formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/utils'
import { LayoutDashboard, Package, ShoppingBag, Tag, Users, UserCheck, LogOut, ArrowLeftRight, Key, RefreshCw, ChevronRight, Truck, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

type AdminSection = 'dashboard' | 'products' | 'orders' | 'coupons' | 'staff' | 'customers' | 'agents' | 'slots'

const NAV = [
  { id: 'dashboard' as AdminSection, icon: LayoutDashboard, label: 'Dashboard',   group: '' },
  { id: 'products'  as AdminSection, icon: Package,         label: 'Products',    group: 'CATALOG' },
  { id: 'orders'    as AdminSection, icon: ShoppingBag,     label: 'Orders',      group: 'COMMERCE' },
  { id: 'coupons'   as AdminSection, icon: Tag,             label: 'Coupons',     group: '' },
  { id: 'staff'     as AdminSection, icon: UserCheck,       label: 'Staff',       group: 'USERS' },
  { id: 'customers' as AdminSection, icon: Users,           label: 'Customers',   group: '' },
  { id: 'agents'    as AdminSection, icon: Truck,           label: 'Delivery Agents', group: 'SETTINGS' },
  { id: 'slots'     as AdminSection, icon: Clock,           label: 'Delivery Slots',  group: '' },
]

export default function AdminPortal() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [section,   setSection]   = useState<AdminSection>('dashboard')
  const [sidebarOpen, setSidebar] = useState(false)
  const [pwdOpen,   setPwdOpen]   = useState(false)
  const [curPwd,    setCurPwd]    = useState('')
  const [newPwd,    setNewPwd]    = useState('')
  const [conPwd,    setConPwd]    = useState('')
  const [pwdError,  setPwdError]  = useState('')

  async function handleChangePwd() {
    setPwdError('')
    if (!curPwd || !newPwd || !conPwd) { setPwdError('Fill all fields'); return }
    if (newPwd !== conPwd) { setPwdError('Passwords do not match'); return }
    try {
      await usersApi.changePassword(user!.id, curPwd, newPwd)
      toast.success('Password updated!')
      setPwdOpen(false)
    } catch (e: any) { setPwdError(e.message) }
  }

  const SECTION_COMPONENTS: Record<AdminSection, React.ReactNode> = {
    dashboard: <AdminDashboard />,
    products:  <AdminProducts />,
    orders:    <AdminOrders />,
    coupons:   <AdminCoupons />,
    staff:     <AdminStaff />,
    customers: <AdminCustomers />,
    agents:    <div className="p-6 text-muted">Delivery agents section</div>,
    slots:     <div className="p-6 text-muted">Delivery slots section</div>,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f172a' }}>
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3.5 z-40 sticky top-0" style={{ background: '#1a2744', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebar(!sidebarOpen)} className="text-white/60 hover:text-white sm:hidden">
            ≡
          </button>
          <span className="text-xl">🎂</span>
          <div>
            <p className="text-white font-semibold text-sm hidden sm:block">Celebration Cake Shop</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Admin Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-white/70 text-sm font-medium hidden sm:block mr-2">{user?.name}</span>
          <button onClick={() => setPwdOpen(true)} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 flex items-center gap-1">
            <Key className="w-3 h-3" /> <span className="hidden sm:inline">Change Pwd</span>
          </button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" /> <span className="hidden sm:inline">Switch</span>
          </button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="text-xs px-2.5 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 flex items-center gap-1">
            <LogOut className="w-3 h-3" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-56 pt-[60px] sm:sticky sm:top-[57px] sm:h-[calc(100vh-57px)]
          flex-shrink-0 overflow-y-auto transition-transform sm:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `} style={{ background: '#1e293b' }}>
          <nav className="p-3 space-y-1">
            {NAV.map((item, idx) => {
              const prevGroup = idx > 0 ? NAV[idx - 1].id : ''
              const showGroup = item.group && (idx === 0 || NAV[idx-1]?.group !== item.group)
              return (
                <div key={item.id}>
                  {showGroup && <p className="text-xs font-semibold px-3 pt-4 pb-1" style={{ color: '#475569' }}>{item.group}</p>}
                  <button
                    onClick={() => { setSection(item.id); setSidebar(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      section === item.id
                        ? 'bg-ccs-blue text-white font-medium'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 sm:hidden" onClick={() => setSidebar(false)} />}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto">
          {SECTION_COMPONENTS[section]}
        </main>
      </div>

      {/* Change Pwd Modal */}
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Change Password">
        <div className="flex flex-col gap-3">
          <Alert message={pwdError} type="error" />
          <Input label="Current Password" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
          <Input label="New Password"     type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <Input label="Confirm Password" type="password" value={conPwd} onChange={(e) => setConPwd(e.target.value)} />
          <Button onClick={handleChangePwd} className="w-full mt-1">Update Password</Button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────
function AdminDashboard() {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      productsApi.list(),
      ordersApi.all(),
      couponsApi.list(),
      usersApi.list(),
    ]).then(([prods, ords, coupons, users]) => {
      setData({
        products: toArray(prods.status === 'fulfilled' ? prods.value.data : []),
        orders:   toArray(ords.status === 'fulfilled'  ? ords.value.data  : []),
        coupons:  toArray(coupons.status === 'fulfilled' ? coupons.value.data : []),
        users:    toArray(users.status === 'fulfilled'  ? users.value.data  : []),
      })
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  const { orders, products, users } = data
  const revenue = orders.filter((o: Order) => o.status === 'delivered').reduce((s: number, o: Order) => s + +o.total, 0)
  const statusCounts = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'].reduce((acc: any, s) => {
    acc[s] = orders.filter((o: Order) => o.status === s).length
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-display text-2xl">Dashboard</h2>
        <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-xs text-white/60 hover:bg-white/10 px-3 py-1.5 rounded-lg">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue',      value: `₹${revenue.toFixed(0)}`, color: 'text-ccs-green' },
          { label: 'Total Orders', value: orders.length,            color: 'text-ccs-blue'  },
          { label: 'Products',     value: products.length,          color: 'text-og'        },
          { label: 'Users',        value: users.length,             color: 'text-plum-mid'  },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-5 text-center" style={{ background: '#1e293b' }}>
            <div className={`text-3xl font-bold font-display ${m.color}`}>{m.value}</div>
            <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b' }}>
          <h3 className="text-white font-medium mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {orders.slice(0, 6).map((o: Order) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                <div>
                  <p className="text-white text-xs font-medium">{o.orderNumber}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-xs font-semibold text-og">{formatPrice(+o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Breakdown */}
        <div className="rounded-2xl p-5" style={{ background: '#1e293b' }}>
          <h3 className="text-white font-medium mb-4">Order Status Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(statusCounts).map(([status, count]) => count as number > 0 && (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[status as any]}`}>
                  {ORDER_STATUS_LABEL[status as any]}
                </span>
                <span className="text-white font-bold text-sm">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Products ────────────────────────────────────────
function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    productsApi.list().then((r) => { setProducts(toArray(r.data)); setLoading(false) })
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-display text-2xl">Products ({products.length})</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="bg-white/10 text-white placeholder:text-white/40 rounded-xl px-4 py-2 text-sm outline-none border border-white/10 focus:border-ccs-blue" />
      </div>
      {loading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <th className="text-left py-2 pb-3 pr-4">Product</th>
                <th className="text-left pb-3 pr-4">Category</th>
                <th className="text-right pb-3 pr-4">Price</th>
                <th className="text-center pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: 'rgba(255,255,255,.05)' }}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.emoji ?? '🎂'}</span>
                      <div>
                        <p className="text-white font-medium">{p.name}</p>
                        {p.isBestseller && <span className="text-[10px] text-og">Bestseller</span>}
                      </div>
                    </div>
                  </td>
                  <td className="pr-4" style={{ color: '#94a3b8' }}>{p.category}</td>
                  <td className="text-right pr-4 text-og font-semibold">{formatPrice(p.price)}</td>
                  <td className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {p.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Orders ──────────────────────────────────────────
function AdminOrders() {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => { ordersApi.all().then((r) => { setOrders(toArray(r.data)); setLoading(false) }) }, [])

  const STATUS_FILTERS = ['all','placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled']
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  async function changeStatus(id: number, status: string) {
    try {
      await ordersApi.updateStatus(id, status)
      toast.success('Status updated!')
      ordersApi.all().then((r) => setOrders(toArray(r.data)))
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-display text-2xl">Orders ({orders.length})</h2>
      </div>
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === s ? 'bg-ccs-blue text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
            {s === 'all' ? 'All' : ORDER_STATUS_LABEL[s as any]}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="📋" title="No orders" /> : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-2xl p-4" style={{ background: '#1e293b' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{o.orderNumber}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{formatDate(o.createdAt)} · {o.address?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-og font-semibold text-sm">{formatPrice(+o.total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  defaultValue={o.status}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="bg-white/10 text-white text-xs rounded-lg px-2 py-1.5 border border-white/20 outline-none"
                >
                  {['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'].map((s) => (
                    <option key={s} value={s} style={{ background: '#1e293b' }}>{ORDER_STATUS_LABEL[s as any]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Coupons ─────────────────────────────────────────
function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { couponsApi.list().then((r) => { setCoupons(toArray(r.data)); setLoading(false) }) }, [])

  return (
    <div className="p-6">
      <h2 className="text-white font-display text-2xl mb-6">Coupons</h2>
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#1e293b' }}>
              <div>
                <p className="text-white font-bold tracking-wider">{c.code}</p>
                <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
                  {c.type === 'percentage' ? `${c.value}% off` : c.type === 'fixed' ? `₹${c.value} off` : c.type}
                  {c.minOrderAmount ? ` · Min ₹${c.minOrderAmount}` : ''}
                  {c.description ? ` · ${c.description}` : ''}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Used {c.usedCount} times</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {c.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Staff ───────────────────────────────────────────
function AdminStaff() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersApi.list().then((r) => {
      const all = toArray<User>(r.data)
      setUsers(all.filter((u) => ['admin','chef','agent'].includes(u.role)))
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-white font-display text-2xl mb-6">Staff ({users.length})</h2>
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: '#1e293b' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-plum-light flex items-center justify-center text-plum font-bold text-sm">
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{u.name}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{u.email}</p>
                  {u.mobile && <p className="text-xs" style={{ color: '#64748b' }}>{u.mobile}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                  u.role === 'chef'  ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {u.role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Customers ───────────────────────────────────────
function AdminCustomers() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    usersApi.list().then((r) => {
      setUsers(toArray<User>(r.data).filter((u) => u.role === 'customer'))
      setLoading(false)
    })
  }, [])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-display text-2xl">Customers ({users.length})</h2>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="bg-white/10 text-white placeholder:text-white/40 rounded-xl px-4 py-2 text-sm outline-none border border-white/10 focus:border-ccs-blue" />
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: '#1e293b' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-plum-light flex items-center justify-center text-plum font-bold text-sm">
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{u.name}</p>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{u.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#94a3b8' }}>{u.mobile ?? '—'}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{formatDate(u.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
