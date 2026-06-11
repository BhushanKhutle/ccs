import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, usersApi } from '@/lib/api'
import { Order, OrderStatus } from '@/lib/types'
import { Toggle, StatCard, Badge, Spinner, Empty, Button, Modal, Input, Alert } from '@/components/ui'
import { toArray, formatPrice } from '@/lib/utils'
import { LogOut, ArrowLeftRight, Key, RefreshCw, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

type ChefTab = 'new' | 'preparing' | 'ready' | 'done'

const TABS: { id: ChefTab; label: string; icon: string; statuses: OrderStatus[] }[] = [
  { id: 'new',      label: 'New Orders',  icon: '🆕', statuses: ['placed', 'confirmed'] },
  { id: 'preparing',label: 'Preparing',   icon: '🔍', statuses: ['preparing']           },
  { id: 'ready',    label: 'Ready',       icon: '✅', statuses: ['ready_for_pickup']    },
  { id: 'done',     label: 'Completed',   icon: '📦', statuses: ['delivered']           },
]

export default function ChefPortal() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const [orders,      setOrders]      = useState<Order[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<ChefTab>('new')
  const [kitchenOpen, setKitchenOpen] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [pwdOpen,     setPwdOpen]     = useState(false)
  const [curPwd,      setCurPwd]      = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [conPwd,      setConPwd]      = useState('')
  const [pwdError,    setPwdError]    = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersApi.all()
      setOrders(toArray<Order>(res.data))
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (e: any) {
      toast.error('Failed to load orders: ' + e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const timer = setInterval(fetchOrders, 20000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  async function updateStatus(id: number, status: OrderStatus) {
    try {
      await ordersApi.updateStatus(id, status)
      toast.success(status === 'preparing' ? '🍳 Order started!' : '✅ Order ready for pickup!')
      fetchOrders()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function handleChangePwd() {
    setPwdError('')
    if (!curPwd || !newPwd || !conPwd) { setPwdError('Fill all fields'); return }
    if (newPwd.length < 6) { setPwdError('Min 6 characters'); return }
    if (newPwd !== conPwd) { setPwdError('Passwords do not match'); return }
    try {
      await usersApi.changePassword(user!.id, curPwd, newPwd)
      toast.success('Password updated!')
      setPwdOpen(false)
    } catch (e: any) { setPwdError(e.message) }
  }

  const tabOrders = orders.filter((o) => TABS.find((t) => t.id === tab)?.statuses.includes(o.status))
  const stats = {
    new:      orders.filter((o) => ['placed','confirmed'].includes(o.status)).length,
    preparing:orders.filter((o) => o.status === 'preparing').length,
    ready:    orders.filter((o) => o.status === 'ready_for_pickup').length,
    done:     orders.filter((o) => o.status === 'delivered').length,
  }

  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-3.5" style={{ background: '#1a2744', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">👨‍🍳</span>
          <div>
            <p className="text-white font-semibold text-sm">{user?.name}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {user?.role === 'admin' ? 'Administrator' : 'Kitchen Chef'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPwdOpen(true)} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 flex items-center gap-1.5">
            <Key className="w-3 h-3" /> Pwd
          </button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 flex items-center gap-1.5">
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3 h-3" /> Switch
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Status Card */}
        <div className="rounded-2xl p-6" style={{ background: '#1a2744' }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-white font-semibold text-lg">
                Kitchen is {kitchenOpen ? 'Open ✅' : 'Closed 🔴'}
              </h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                {kitchenOpen ? 'Receiving and preparing orders' : 'Not accepting new orders'}
              </p>
            </div>
            <Toggle checked={kitchenOpen} onChange={setKitchenOpen} color="bg-ccs-green" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: stats.new,       label: 'New Orders',       color: 'text-ccs-blue'  },
            { value: stats.preparing, label: 'Preparing',        color: 'text-og'        },
            { value: stats.ready,     label: 'Ready for Pickup', color: 'text-og'        },
            { value: stats.done,      label: 'Completed Today',  color: 'text-ccs-green' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: '#1a2744' }}>
              <div className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-all text-center ${
                tab === t.id
                  ? 'bg-ccs-blue text-white'
                  : 'text-white/60 hover:bg-white/10'
              }`}
              style={tab !== t.id ? { background: '#1a2744' } : {}}
            >
              {t.icon} {t.label} {t.id === 'new' && stats.new > 0 && `(${stats.new})`}
            </button>
          ))}
        </div>

        {/* Refresh info */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#64748b' }}>
            Last updated: {lastUpdated} · Auto-refreshes every 20s
          </p>
          <button onClick={fetchOrders} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white/60 hover:bg-white/10">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-center py-12"><Spinner className="[&>*]:border-t-ccs-blue" /></div>
        ) : tabOrders.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <span className="text-5xl block mb-3">🍽️</span>
            <p className="font-medium">No orders in this tab</p>
            <p className="text-sm mt-1">Auto-refreshes every 20 seconds</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tabOrders.map((order) => (
              <ChefOrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
            ))}
          </div>
        )}
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

// ─── Order Card ──────────────────────────────────────
function ChefOrderCard({ order: o, onUpdateStatus }: { order: Order; onUpdateStatus: (id: number, status: OrderStatus) => void }) {
  const isNew  = ['placed', 'confirmed'].includes(o.status)
  const isPrep = o.status === 'preparing'
  const isReady = o.status === 'ready_for_pickup'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0f172a' }}>
        <div>
          <p className="text-white font-semibold text-sm">{o.orderNumber}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isNew ? 'bg-blue-500/20 text-blue-400' :
          isPrep ? 'bg-amber-500/20 text-amber-400' :
          isReady ? 'bg-green-500/20 text-green-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {o.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
        {(o.items ?? []).map((item, i) => (
          <p key={i} className="text-sm text-white/80">
            × {item.quantity} {item.productName}
            {item.weight && <span className="text-white/40 ml-1">({item.weight})</span>}
          </p>
        ))}
        {o.cakeMessage && (
          <p className="text-xs mt-2 italic" style={{ color: '#94a3b8' }}>💬 "{o.cakeMessage}"</p>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div>
          <p className="text-xs" style={{ color: '#64748b' }}>Deliver to</p>
          <p className="text-sm text-white/80 font-medium">{o.address?.name}</p>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{o.address?.city}</p>
          {o.address?.mobile && (
            <a href={`tel:${o.address.mobile}`} className="flex items-center gap-1 text-xs text-blue-400 mt-1">
              <Phone className="w-3 h-3" /> {o.address.mobile}
            </a>
          )}
        </div>
        <div>
          <p className="text-xs" style={{ color: '#64748b' }}>Slot</p>
          <p className="text-sm text-white/80">{o.deliverySlot ?? '—'}</p>
          <p className="text-xs mt-2" style={{ color: '#64748b' }}>Total</p>
          <p className="text-sm font-semibold text-og">{formatPrice(o.total)}</p>
        </div>
      </div>

      {/* Actions */}
      {(isNew || isPrep) && (
        <div className="px-4 pb-4">
          {isNew && (
            <button
              onClick={() => onUpdateStatus(o.id, 'preparing')}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-og hover:opacity-90 transition-opacity"
            >
              🍳 Start Preparing
            </button>
          )}
          {isPrep && (
            <button
              onClick={() => onUpdateStatus(o.id, 'ready_for_pickup')}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-ccs-green hover:opacity-90 transition-opacity"
            >
              ✅ Mark Ready for Pickup
            </button>
          )}
        </div>
      )}
      {isReady && (
        <div className="px-4 pb-4">
          <div className="bg-green-500/10 text-green-400 rounded-xl py-3 text-center text-sm font-medium">
            🎂 Ready! Waiting for delivery agent…
          </div>
        </div>
      )}
    </div>
  )
}
