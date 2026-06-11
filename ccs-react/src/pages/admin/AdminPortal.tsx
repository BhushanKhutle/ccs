import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, productsApi, usersApi, couponsApi } from '@/lib/api'
import { Order, Product, User, Coupon } from '@/lib/types'
import { Spinner, Empty, Modal, Input, Alert, Toggle } from '@/components/ui'
import { toArray, formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/utils'
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Users, UserCheck,
  LogOut, ArrowLeftRight, Key, RefreshCw, Truck, Clock,
  TrendingUp, Search, Plus, Edit2, Trash2, ToggleLeft, Menu, X,
  CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

type AdminSection = 'dashboard' | 'products' | 'orders' | 'coupons' | 'staff' | 'customers'

const NAV: { id: AdminSection; icon: any; label: string; group: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',  group: ''        },
  { id: 'products',  icon: Package,         label: 'Products',   group: 'CATALOG' },
  { id: 'orders',    icon: ShoppingBag,     label: 'Orders',     group: 'COMMERCE'},
  { id: 'coupons',   icon: Tag,             label: 'Coupons',    group: ''        },
  { id: 'staff',     icon: UserCheck,       label: 'Staff',      group: 'USERS'   },
  { id: 'customers', icon: Users,           label: 'Customers',  group: ''        },
]

// ─── Shared dark input style ──────────────────────────
const darkInput = "w-full bg-white/8 text-white border border-white/15 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 placeholder:text-white/30 transition-all"
const darkSelect = "bg-white/8 text-white border border-white/15 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-400 cursor-pointer"

export default function AdminPortal() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const [section,     setSection]     = useState<AdminSection>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pwdOpen,     setPwdOpen]     = useState(false)
  const [curPwd,      setCurPwd]      = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [conPwd,      setConPwd]      = useState('')
  const [pwdLoading,  setPwdLoading]  = useState(false)
  const [pwdError,    setPwdError]    = useState('')

  async function handleChangePwd() {
    setPwdError('')
    if (!curPwd || !newPwd || !conPwd) { setPwdError('Fill all fields'); return }
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

  function goTo(id: AdminSection) { setSection(id); setSidebarOpen(false) }

  const sections: Record<AdminSection, React.ReactNode> = {
    dashboard: <AdminDashboard onNavigate={goTo} />,
    products:  <AdminProducts />,
    orders:    <AdminOrders />,
    coupons:   <AdminCoupons />,
    staff:     <AdminStaff />,
    customers: <AdminCustomers />,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>

      {/* Top Bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 sm:px-6 h-14"
        style={{ background: '#161b22', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sm:hidden text-white/60 hover:text-white p-1">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="text-xl">🎂</span>
        <div className="hidden sm:block">
          <p className="text-white font-semibold text-sm leading-tight">Celebration Cake Shop</p>
          <p className="text-[11px]" style={{ color: '#8b949e' }}>Admin Portal</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-plum to-plum-dark flex items-center justify-center text-white text-xs font-bold">
              {user?.name[0]}
            </div>
            <span className="text-white/80 text-sm font-medium">{user?.name}</span>
          </div>
          {[
            { icon: Key, title: 'Change password', onClick: () => setPwdOpen(true) },
            { icon: ArrowLeftRight, title: 'Switch portal', onClick: () => { clearAuth(); navigate('/login') } },
            { icon: LogOut, title: 'Sign out', onClick: () => { clearAuth(); navigate('/login') } },
          ].map(({ icon: Icon, title, onClick }) => (
            <button key={title} onClick={onClick} title={title}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed sm:sticky top-14 sm:top-14 z-30 h-[calc(100vh-56px)] w-56 flex-shrink-0 overflow-y-auto transition-transform duration-200 sm:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ background: '#161b22', borderRight: '1px solid rgba(255,255,255,.07)' }}>
          <nav className="p-2 pt-3">
            {NAV.map((item, i) => {
              const showGroup = item.group && (i === 0 || NAV[i-1].group !== item.group)
              return (
                <div key={item.id}>
                  {showGroup && (
                    <p className="text-[10px] font-bold uppercase tracking-widest px-3 pt-4 pb-1.5" style={{ color: '#484f58' }}>
                      {item.group}
                    </p>
                  )}
                  <button
                    onClick={() => goTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5 ${
                      section === item.id
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                    }`}
                    style={section === item.id ? { background: 'rgba(88,166,255,.12)', color: '#58a6ff' } : {}}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                    {section === item.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-20 sm:hidden bg-black/60" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto">{sections[section]}</main>
      </div>

      {/* Password Modal */}
      <Modal open={pwdOpen} onClose={() => { setPwdOpen(false); setPwdError('') }} title="Change Password">
        <div className="flex flex-col gap-3">
          <Alert message={pwdError} type="error" />
          <Input label="Current Password" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="••••••••" />
          <Input label="New Password"     type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 6 characters" />
          <Input label="Confirm Password" type="password" value={conPwd} onChange={(e) => setConPwd(e.target.value)} placeholder="Repeat new password" />
          <button onClick={handleChangePwd} disabled={pwdLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 mt-1 flex items-center justify-center gap-2">
            {pwdLoading ? <><span className="animate-spin">⏳</span> Updating…</> : 'Update Password'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-white font-bold text-xl">{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: '#8b949e' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────
function MetricCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div className="rounded-2xl p-5 hover:scale-[1.02] transition-transform cursor-default"
      style={{ background: '#161b22', border: '1px solid rgba(255,255,255,.07)' }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs font-medium mt-1" style={{ color: '#8b949e' }}>{label}</div>
      {sub && <div className="text-[11px] mt-0.5" style={{ color: '#484f58' }}>{sub}</div>}
    </div>
  )
}

// ─── DASHBOARD ────────────────────────────────────────
function AdminDashboard({ onNavigate }: { onNavigate: (s: AdminSection) => void }) {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.allSettled([productsApi.list(), ordersApi.all(), couponsApi.list(), usersApi.list()])
      .then(([p, o, c, u]) => {
        setData({
          products: toArray(p.status === 'fulfilled' ? p.value.data : []),
          orders:   toArray(o.status === 'fulfilled' ? o.value.data : []),
          coupons:  toArray(c.status === 'fulfilled' ? c.value.data : []),
          users:    toArray(u.status === 'fulfilled' ? u.value.data : []),
        })
        setLoading(false)
      })
  }
  useEffect(load, [])

  if (loading) return <div className="p-6"><Spinner /></div>

  const { orders, products, users } = data
  const revenue   = orders.filter((o: Order) => o.status === 'delivered').reduce((s: number, o: Order) => s + +o.total, 0)
  const pending   = orders.filter((o: Order) => !['delivered','cancelled'].includes(o.status)).length
  const customers = users.filter((u: User) => u.role === 'customer').length
  const today     = orders.filter((o: Order) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length

  const statusCounts = ['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled']
    .map((s) => ({ status: s, count: orders.filter((o: Order) => o.status === s).length }))
    .filter((s) => s.count > 0)

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Dashboard</h2>
          <p className="text-sm" style={{ color: '#8b949e' }}>Welcome back, {useAuthStore.getState().user?.name}</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: '#8b949e' }}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Total Revenue"  value={`₹${revenue.toFixed(0)}`}  color="#3fb950" icon="💰" sub="From delivered orders" />
        <MetricCard label="Total Orders"   value={orders.length}              color="#58a6ff" icon="📦" sub={`${today} today`} />
        <MetricCard label="Pending Orders" value={pending}                    color="#d29922" icon="⏳" sub="Need attention" />
        <MetricCard label="Customers"      value={customers}                  color="#bc8cff" icon="👥" sub={`${products.length} products`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="rounded-2xl p-5" style={{ background: '#161b22', border: '1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs hover:underline" style={{ color: '#58a6ff' }}>View all →</button>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 7).map((o: Order) => (
              <div key={o.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{o.orderNumber}</p>
                  <p className="text-[11px] truncate" style={{ color: '#8b949e' }}>{o.address?.name} · {formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-xs font-bold" style={{ color: '#d29922' }}>{formatPrice(+o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl p-5" style={{ background: '#161b22', border: '1px solid rgba(255,255,255,.07)' }}>
          <h3 className="text-white font-semibold text-sm mb-4">Order Breakdown</h3>
          <div className="space-y-2.5">
            {statusCounts.map(({ status, count }) => {
              const pct = Math.round((count / orders.length) * 100)
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[status as any]}`}>
                      {ORDER_STATUS_LABEL[status as any]}
                    </span>
                    <span className="text-white font-bold text-sm">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
                    <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PRODUCTS ─────────────────────────────────────────
function AdminProducts() {
  const [products,  setProducts]  = useState<Product[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [editItem,  setEditItem]  = useState<Product | null>(null)
  const [showForm,  setShowForm]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', eggOption: 'both', isActive: true })

  const load = () => productsApi.list().then((r) => { setProducts(toArray(r.data)); setLoading(false) })
  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  )

  function openEdit(p: Product) {
    setEditItem(p)
    setForm({ name: p.name, price: String(p.price), category: p.category ?? '', description: p.description ?? '', eggOption: (p as any).eggless === true ? 'eggless' : (p as any).eggless === false ? 'egg' : 'both', isActive: p.isActive })
    setImagePreview(p.imageUrl ?? ''); setImageFile(null)
    setFormError(''); setShowForm(true)
  }
  function openNew() {
    setEditItem(null)
    setForm({ name: '', price: '', category: '', description: '', eggOption: 'both', isActive: true })
    setImageFile(null); setImagePreview('')
    setFormError(''); setShowForm(true)
  }

  async function saveProduct() {
    if (!form.name.trim() || !form.price || !form.category.trim()) { setFormError('Name, price and category are required'); return }
    setSaving(true); setFormError('')
    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category.trim(),
        description: form.description.trim(),
        eggless: form.eggOption === 'eggless' || form.eggOption === 'both',
        isActive: form.isActive,
      }
      let savedId = editItem?.id
      if (editItem) await productsApi.update(editItem.id, payload)
      else { const res = await productsApi.create(payload); savedId = (res.data as any)?.id ?? (res.data as any)?.data?.id }
      // Upload image if selected
      if (imageFile && savedId) {
        const fd = new FormData()
        fd.append('image', imageFile)
        await fetch(`/api/v1/products/${savedId}/image`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${localStorage.getItem('ccs-auth') ? JSON.parse(localStorage.getItem('ccs-auth')!).state?.token : ''}` },
          body: fd,
        })
      }
      toast.success(editItem ? 'Product updated!' : 'Product created!')
      setShowForm(false); setImageFile(null); setImagePreview(''); load()
    } catch (e: any) { setFormError(e.message) }
    setSaving(false)
  }

  async function toggleActive(p: Product) {
    try {
      await productsApi.update(p.id, { isActive: !p.isActive })
      toast.success(p.isActive ? 'Product hidden' : 'Product visible')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    try {
      await productsApi.delete(p.id)
      toast.success('Product deleted')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="p-5 sm:p-6">
      <SectionHeader
        title={`Products (${products.length})`}
        subtitle="Manage your cake catalog"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#484f58' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                className="pl-9 pr-3 py-2 text-xs rounded-xl outline-none" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 160 }} />
            </div>
            <button onClick={openNew} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold text-white transition-colors"
              style={{ background: '#238636', border: '1px solid #2ea043' }}>
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>
        }
      />

      {loading ? <Spinner /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                {['Product', 'Category', 'Price', 'Status', 'Actions'].map((h) => (
                  <th key={h} className={`py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide`} style={{ color: '#8b949e' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className="hover:bg-white/3 transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji ?? '🎂'}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{p.name}</p>
                        {p.isBestseller && <span className="text-[10px] text-amber-400">⭐ Bestseller</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color: '#8b949e' }}>{p.category}</td>
                  <td className="py-3 px-4 font-semibold text-sm" style={{ color: '#d29922' }}>{formatPrice(p.price)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {p.isActive ? '● Active' : '○ Hidden'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(p)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleActive(p)} title={p.isActive ? 'Hide' : 'Show'} className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors"><ToggleLeft className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteProduct(p)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Product' : 'Add New Product'}>
        <div className="space-y-3">
          {formError && <Alert message={formError} type="error" />}
          <Input label="Product Name *"  value={form.name}        onChange={(e) => setForm({ ...form, name: e.target.value })}        placeholder="e.g. Blueberry Cheesecake" />
          <Input label="Price (₹) *"     value={form.price}       onChange={(e) => setForm({ ...form, price: e.target.value })}       placeholder="e.g. 599" type="number" />
          <Input label="Category *"      value={form.category}    onChange={(e) => setForm({ ...form, category: e.target.value })}    placeholder="e.g. Birthday Cakes" />
          <Input label="Description"     value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">Product Photo</label>
            <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center cursor-pointer hover:border-plum-mid hover:bg-plum-light/30 transition-all"
              onClick={() => document.getElementById('product-image-input')?.click()}>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl mx-auto mb-2" />
                  <p className="text-xs text-ccs-green font-medium">✅ Image selected — click to change</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sm font-medium text-ink">Click to upload photo</p>
                  <p className="text-xs text-muted mt-1">JPG, PNG, WebP · Max 5MB</p>
                </div>
              )}
            </div>
            <input id="product-image-input" type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  const reader = new FileReader()
                  reader.onload = (ev) => setImagePreview(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }
              }} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">Egg Option</label>
            <div className="flex gap-2">
              {['egg', 'eggless', 'both'].map((opt) => (
                <button key={opt} onClick={() => setForm({ ...form, eggOption: opt })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 capitalize transition-all ${form.eggOption === opt ? 'border-plum bg-plum-light text-plum' : 'border-border text-muted hover:border-plum-mid'}`}>
                  {opt === 'eggless' ? '🌱 Eggless' : opt === 'egg' ? '🥚 Egg' : '🔀 Both'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-ink">Active / Visible</span>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
          <button onClick={saveProduct} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#238636' }}>
            {saving ? <><span className="animate-spin">⏳</span> Saving…</> : editItem ? '💾 Update Product' : '➕ Add Product'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── ORDERS ───────────────────────────────────────────
function AdminOrders() {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = () => ordersApi.all().then((r) => { setOrders(toArray(r.data)); setLoading(false) })
  useEffect(() => { load() }, [])

  const STATUS_FILTERS = ['all', 'placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled']

  const filtered = useMemo(() => {
    let list = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
    if (search) list = list.filter((o) => o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.address?.name?.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [orders, filter, search])

  async function changeStatus(id: number, status: string) {
    try {
      await ordersApi.updateStatus(id, status as any)
      toast.success('Status updated!')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="p-5 sm:p-6">
      <SectionHeader
        title={`Orders (${orders.length})`}
        subtitle="Manage all customer orders"
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#484f58' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…"
              className="pl-9 pr-3 py-2 text-xs rounded-xl outline-none" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 180 }} />
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === s ? 'text-white' : 'hover:bg-white/10'}`}
              style={{
                background: filter === s ? '#1f6feb' : 'rgba(255,255,255,.06)',
                border: `1px solid ${filter === s ? '#388bfd' : 'rgba(255,255,255,.08)'}`,
                color: filter === s ? '#fff' : '#8b949e',
              }}>
              {s === 'all' ? 'All' : ORDER_STATUS_LABEL[s as any]}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: filter === s ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.08)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="📋" title="No orders found" /> : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <div key={o.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: '#161b22', border: '1px solid rgba(255,255,255,.08)' }}>
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/3 transition-colors" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="text-white font-semibold text-sm">{o.orderNumber}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[o.status]}`}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: '#8b949e' }}>
                    {o.address?.name} · {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-sm" style={{ color: '#d29922' }}>{formatPrice(+o.total)}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform text-gray-500 ${expandedId === o.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded */}
              {expandedId === o.id && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                  {/* Items */}
                  <div className="space-y-1">
                    {(o.items ?? []).map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span style={{ color: '#c9d1d9' }}>{item.productName} ×{item.quantity}</span>
                        <span style={{ color: '#8b949e' }}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Address */}
                  {o.address && (
                    <div className="text-xs rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,.04)' }}>
                      <p style={{ color: '#c9d1d9' }}>{o.address.name} · {o.address.mobile}</p>
                      <p style={{ color: '#8b949e' }}>{o.address.line1}, {o.address.city} – {o.address.pincode}</p>
                      {o.deliverySlot && <p style={{ color: '#8b949e' }}>🕐 {o.deliverySlot}</p>}
                    </div>
                  )}
                  {/* Change status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#8b949e' }}>Change status:</span>
                    <select defaultValue={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} className={darkSelect}>
                      {['placed','confirmed','preparing','ready_for_pickup','out_for_delivery','delivered','cancelled'].map((s) => (
                        <option key={s} value={s} style={{ background: '#161b22' }}>{ORDER_STATUS_LABEL[s as any]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── COUPONS ──────────────────────────────────────────
function AdminCoupons() {
  const [coupons,   setCoupons]   = useState<Coupon[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState<Coupon | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', minOrderAmount: '', description: '', isActive: true })

  const load = () => couponsApi.list().then((r) => { setCoupons(toArray(r.data)); setLoading(false) })
  useEffect(() => { load() }, [])

  function openNew() { setEditItem(null); setForm({ code: '', type: 'percentage', value: '', minOrderAmount: '', description: '', isActive: true }); setFormError(''); setShowForm(true) }
  function openEdit(c: Coupon) { setEditItem(c); setForm({ code: c.code, type: c.type, value: String(c.value), minOrderAmount: String(c.minOrderAmount ?? ''), description: c.description ?? '', isActive: c.isActive }); setFormError(''); setShowForm(true) }

  async function saveCoupon() {
    if (!form.code.trim() || !form.value) { setFormError('Code and value are required'); return }
    setSaving(true); setFormError('')
    try {
      const payload = { ...form, value: parseFloat(form.value), minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0 }
      if (editItem) await couponsApi.update(editItem.id, payload)
      else await couponsApi.create(payload)
      toast.success(editItem ? 'Coupon updated!' : 'Coupon created!')
      setShowForm(false); load()
    } catch (e: any) { setFormError(e.message) }
    setSaving(false)
  }

  const typeLabel = (type: string, value: number) =>
    type === 'percentage' ? `${value}% off` : type === 'fixed' ? `₹${value} off` : type === 'free_delivery' ? 'Free delivery' : 'BOGO'

  return (
    <div className="p-5 sm:p-6">
      <SectionHeader title={`Coupons (${coupons.length})`} subtitle="Discount codes and offers"
        action={
          <button onClick={openNew} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold text-white"
            style={{ background: '#238636', border: '1px solid #2ea043' }}>
            <Plus className="w-3.5 h-3.5" /> Add Coupon
          </button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {coupons.map((c) => (
            <div key={c.id} className="rounded-2xl p-4 relative" style={{ background: '#161b22', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-bold text-base tracking-wider">{c.code}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#d29922' }}>{typeLabel(c.type, c.value)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {c.isActive ? '● Active' : '○ Off'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 text-[11px]" style={{ color: '#8b949e' }}>
                {c.minOrderAmount && <span>Min ₹{c.minOrderAmount}</span>}
                {c.description && <span>· {c.description}</span>}
              </div>
              <p className="text-[11px] mt-1" style={{ color: '#484f58' }}>Used {c.usedCount} times{c.maxUses ? ` / ${c.maxUses}` : ''}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Coupon' : 'New Coupon'}>
        <div className="space-y-3">
          {formError && <Alert message={formError} type="error" />}
          <Input label="Code *"        value={form.code.toUpperCase()}  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. WELCOME10" />
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['percentage', 'fixed', 'free_delivery'].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={`py-2.5 rounded-xl text-xs font-medium border-2 capitalize transition-all ${form.type === t ? 'border-plum bg-plum-light text-plum' : 'border-border text-muted hover:border-plum-mid'}`}>
                  {t === 'percentage' ? '% Percentage' : t === 'fixed' ? '₹ Fixed' : '🚚 Free Delivery'}
                </button>
              ))}
            </div>
          </div>
          {form.type !== 'free_delivery' && <Input label="Value *" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percentage' ? '10 (for 10%)' : '50 (for ₹50)'} type="number" />}
          <Input label="Min Order (₹)" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="0 for no minimum" type="number" />
          <Input label="Description"   value={form.description}    onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short note (optional)" />
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium text-ink">Active</span>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
          <button onClick={saveCoupon} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#238636' }}>
            {saving ? <><span className="animate-spin">⏳</span> Saving…</> : editItem ? '💾 Update Coupon' : '➕ Create Coupon'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── STAFF ────────────────────────────────────────────
function AdminStaff() {
  const [users,     setUsers]     = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState<User | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', mobile: '', role: 'chef', password: '' })

  const load = () => usersApi.list().then((r) => {
    setUsers(toArray<User>(r.data).filter((u) => ['admin','chef','agent'].includes(u.role)))
    setLoading(false)
  })
  useEffect(() => { load() }, [])

  function openNew() { setEditItem(null); setForm({ name: '', email: '', mobile: '', role: 'chef', password: '' }); setFormError(''); setShowForm(true) }
  function openEdit(u: User) { setEditItem(u); setForm({ name: u.name, email: u.email, mobile: u.mobile ?? '', role: u.role, password: '' }); setFormError(''); setShowForm(true) }

  async function saveStaff() {
    if (!form.name || !form.email) { setFormError('Name and email are required'); return }
    if (!editItem && !form.password) { setFormError('Password is required for new staff'); return }
    setSaving(true); setFormError('')
    try {
      if (editItem) {
        await usersApi.update(editItem.id, { name: form.name, email: form.email, mobile: form.mobile })
        await usersApi.setRole(editItem.id, form.role)
      } else {
        const res = await fetch('/api/v1/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form }) })
        const d = await res.json()
        if (!res.ok) throw new Error(d.message)
        await usersApi.setRole(d.data?.user?.id ?? d.data?.id, form.role)
      }
      toast.success(editItem ? 'Staff updated!' : 'Staff account created!')
      setShowForm(false); load()
    } catch (e: any) { setFormError(e.message) }
    setSaving(false)
  }

  async function toggleActive(u: User) {
    try {
      await usersApi.toggleActive(u.id, !u.isActive)
      toast.success(u.isActive ? 'Account deactivated' : 'Account activated')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  async function deleteUser(u: User) {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return
    try { await usersApi.delete(u.id); toast.success('User deleted'); load() }
    catch (e: any) { toast.error(e.message) }
  }

  const ROLE_STYLE: Record<string, string> = {
    admin: 'bg-purple-500/15 text-purple-400',
    chef:  'bg-amber-500/15 text-amber-400',
    agent: 'bg-blue-500/15 text-blue-400',
  }

  return (
    <div className="p-5 sm:p-6">
      <SectionHeader title={`Staff (${users.length})`} subtitle="Chefs, agents and admins"
        action={
          <button onClick={openNew} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold text-white"
            style={{ background: '#238636', border: '1px solid #2ea043' }}>
            <Plus className="w-3.5 h-3.5" /> Add Staff
          </button>
        }
      />

      {loading ? <Spinner /> : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-white/3 transition-colors"
              style={{ background: '#161b22', border: '1px solid rgba(255,255,255,.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: u.role === 'admin' ? '#6e40c9' : u.role === 'chef' ? '#b45309' : '#1d4ed8' }}>
                {u.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{u.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLE[u.role]}`}>{u.role}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {u.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: '#8b949e' }}>{u.email}{u.mobile ? ` · ${u.mobile}` : ''}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => toggleActive(u)} className="p-2 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"><ToggleLeft className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteUser(u)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Staff' : 'Add Staff Account'}>
        <div className="space-y-3">
          {formError && <Alert message={formError} type="error" />}
          <Input label="Full Name *" value={form.name}   onChange={(e) => setForm({ ...form, name: e.target.value })}   placeholder="Full name" />
          <Input label="Email *"     value={form.email}  onChange={(e) => setForm({ ...form, email: e.target.value })}  placeholder="email@example.com" type="email" />
          <Input label="Mobile"      value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit number" />
          {!editItem && <Input label="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" type="password" />}
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1.5">Role</label>
            <div className="flex gap-2">
              {['chef', 'agent', 'admin'].map((r) => (
                <button key={r} onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize border-2 transition-all ${form.role === r ? 'border-plum bg-plum-light text-plum' : 'border-border text-muted hover:border-plum-mid'}`}>
                  {r === 'chef' ? '👨‍🍳 Chef' : r === 'agent' ? '🚚 Agent' : '🔐 Admin'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveStaff} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#238636' }}>
            {saving ? <><span className="animate-spin">⏳</span> Saving…</> : editItem ? '💾 Update Staff' : '➕ Create Account'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── CUSTOMERS ────────────────────────────────────────
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

  const filtered = useMemo(() =>
    users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  )

  async function toggleActive(u: User) {
    try {
      await usersApi.toggleActive(u.id, !u.isActive)
      toast.success(u.isActive ? 'Account deactivated' : 'Account activated')
      usersApi.list().then((r) => setUsers(toArray<User>(r.data).filter((u) => u.role === 'customer')))
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="p-5 sm:p-6">
      <SectionHeader
        title={`Customers (${users.length})`}
        subtitle="Registered customer accounts"
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#484f58' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…"
              className="pl-9 pr-3 py-2 text-xs rounded-xl outline-none" style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 180 }} />
          </div>
        }
      />

      {loading ? <Spinner /> : filtered.length === 0 ? <Empty icon="👥" title="No customers found" /> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.04)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                {['Customer', 'Contact', 'Joined', 'Status', 'Action'].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: '#8b949e' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `hsl(${u.id * 47 % 360},50%,40%)` }}>
                        {u.name[0].toUpperCase()}
                      </div>
                      <p className="text-white font-medium text-sm">{u.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs" style={{ color: '#c9d1d9' }}>{u.email}</p>
                    {u.mobile && <p className="text-[11px]" style={{ color: '#8b949e' }}>{u.mobile}</p>}
                  </td>
                  <td className="py-3 px-4 text-xs" style={{ color: '#8b949e' }}>{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {u.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-green-500/20 text-green-400'}`}>
                      <ToggleLeft className="w-4 h-4" />
                    </button>
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
