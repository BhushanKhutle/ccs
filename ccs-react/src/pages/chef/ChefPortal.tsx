import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, usersApi } from '@/lib/api'
import { Order, OrderStatus } from '@/lib/types'
import { Toggle, Modal, Input, Button, Alert } from '@/components/ui'
import { toArray, formatPrice } from '@/lib/utils'
import { LogOut, ArrowLeftRight, Key, RefreshCw, Phone, ChefHat, Clock, CheckCircle2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

type ChefTab = 'new' | 'preparing' | 'ready' | 'done'

const TABS: { id: ChefTab; label: string; emoji: string; statuses: OrderStatus[]; color: string; activeColor: string }[] = [
  { id: 'new',       label: 'New',       emoji: '🆕', statuses: ['placed','confirmed'],  color: 'text-blue-400',  activeColor: 'bg-blue-500'  },
  { id: 'preparing', label: 'Preparing', emoji: '🍳', statuses: ['preparing'],           color: 'text-amber-400', activeColor: 'bg-amber-500' },
  { id: 'ready',     label: 'Ready',     emoji: '✅', statuses: ['ready_for_pickup'],    color: 'text-green-400', activeColor: 'bg-green-500' },
  { id: 'done',      label: 'Completed', emoji: '📦', statuses: ['delivered'],           color: 'text-gray-400',  activeColor: 'bg-gray-500'  },
]

export default function ChefPortal() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const [orders,      setOrders]      = useState<Order[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<ChefTab>('new')
  const [kitchenOpen, setKitchenOpen] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [countdown,   setCountdown]   = useState(20)
  const [pwdOpen,     setPwdOpen]     = useState(false)
  const [curPwd,      setCurPwd]      = useState('')
  const [newPwd,      setNewPwd]      = useState('')
  const [conPwd,      setConPwd]      = useState('')
  const [pwdLoading,  setPwdLoading]  = useState(false)
  const [pwdError,    setPwdError]    = useState('')
  const countRef = useRef<any>(null)

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await ordersApi.all()
      setOrders(toArray<Order>(res.data))
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCountdown(20)
    } catch (e: any) {
      toast.error('Failed to refresh orders')
    }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const timer = setInterval(() => fetchOrders(true), 20000)
    countRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 20 : c - 1)), 1000)
    return () => { clearInterval(timer); clearInterval(countRef.current) }
  }, [fetchOrders])

  async function updateStatus(id: number, status: OrderStatus, msg: string) {
    try {
      await ordersApi.updateStatus(id, status)
      toast.success(msg)
      fetchOrders(true)
    } catch (e: any) { toast.error(e.message) }
  }

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

  const stats = {
    new:       orders.filter((o) => ['placed','confirmed'].includes(o.status)).length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready:     orders.filter((o) => o.status === 'ready_for_pickup').length,
    done:      orders.filter((o) => o.status === 'delivered').length,
  }

  const tabOrders = orders.filter((o) => TABS.find((t) => t.id === tab)?.statuses.includes(o.status))

  return (
    <div className="min-h-screen" style={{ background: '#0c1220' }}>

      {/* Top Bar */}
      <header style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,.07)' }} className="sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: '#D97706' }}>
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">{user?.name}</p>
            <p className="text-xs" style={{ color: '#6b7280' }}>Kitchen Chef</p>
          </div>
          <button onClick={() => setPwdOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Change password">
            <Key className="w-4 h-4" />
          </button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Switch portal">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Kitchen Status Card */}
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: kitchenOpen ? 'linear-gradient(135deg,#1a3a2a,#0d2618)' : 'linear-gradient(135deg,#2a1a1a,#1a0d0d)', border: `1px solid ${kitchenOpen ? 'rgba(26,127,90,.3)' : 'rgba(181,41,43,.3)'}` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${kitchenOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <h2 className="text-white font-bold text-lg">Kitchen is {kitchenOpen ? 'Open' : 'Closed'}</h2>
              </div>
              <p className="text-sm" style={{ color: kitchenOpen ? '#6ee7b7' : '#fca5a5' }}>
                {kitchenOpen ? 'Receiving and preparing orders' : 'Not accepting new orders'}
              </p>
            </div>
            <Toggle checked={kitchenOpen} onChange={setKitchenOpen} color="bg-green-500" />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { value: stats.new,       label: 'New',        color: '#60a5fa', bg: 'rgba(96,165,250,.1)'  },
            { value: stats.preparing, label: 'Preparing',  color: '#fbbf24', bg: 'rgba(251,191,36,.1)'  },
            { value: stats.ready,     label: 'Ready',      color: '#34d399', bg: 'rgba(52,211,153,.1)'  },
            { value: stats.done,      label: 'Completed',  color: '#9ca3af', bg: 'rgba(156,163,175,.1)' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: s.bg, border: `1px solid ${s.color}25` }}>
              <div className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2">
          {TABS.map((t) => {
            const count = orders.filter((o) => t.statuses.includes(o.status)).length
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${tab === t.id ? 'text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-200'}`}
                style={{
                  background: tab === t.id
                    ? t.id === 'new' ? '#1d4ed8' : t.id === 'preparing' ? '#b45309' : t.id === 'ready' ? '#065f46' : '#374151'
                    : 'rgba(255,255,255,.05)',
                  border: `1px solid ${tab === t.id ? 'transparent' : 'rgba(255,255,255,.07)'}`,
                }}
              >
                <div className="text-base mb-0.5">{t.emoji}</div>
                <div>{t.label}</div>
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: t.id === 'new' ? '#3b82f6' : t.id === 'preparing' ? '#f59e0b' : t.id === 'ready' ? '#10b981' : '#6b7280' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Refresh info */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#6b7280' }}>
            <Clock className="w-3 h-3" />
            Updated {lastUpdated} · Next in {countdown}s
          </p>
          <button onClick={() => fetchOrders()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#9ca3af' }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="space-y-3">
            {[1,2].map((i) => (
              <div key={i} className="rounded-2xl h-40 animate-pulse" style={{ background: 'rgba(255,255,255,.05)' }} />
            ))}
          </div>
        ) : tabOrders.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#6b7280' }}>
            <div className="text-5xl mb-3">
              {tab === 'new' ? '🆕' : tab === 'preparing' ? '🍳' : tab === 'ready' ? '✅' : '📦'}
            </div>
            <p className="font-medium text-gray-300">No {tab === 'new' ? 'new orders' : tab === 'preparing' ? 'orders being prepared' : tab === 'ready' ? 'orders ready' : 'completed orders'}</p>
            <p className="text-sm mt-1">Auto-refreshes every 20 seconds</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tabOrders.map((order) => (
              <ChefOrderCard key={order.id} order={order} onStartPreparing={(id) => updateStatus(id, 'preparing', '🍳 Started preparing!')} onMarkReady={(id) => updateStatus(id, 'ready_for_pickup', '✅ Order ready for pickup!')} />
            ))}
          </div>
        )}
      </div>

      {/* Password Modal */}
      <Modal open={pwdOpen} onClose={() => { setPwdOpen(false); setPwdError('') }} title="Change Password">
        <div className="flex flex-col gap-3">
          <Alert message={pwdError} type="error" />
          <Input label="Current Password" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="••••••••" />
          <Input label="New Password"     type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min 6 chars" />
          <Input label="Confirm Password" type="password" value={conPwd} onChange={(e) => setConPwd(e.target.value)} placeholder="Repeat new password" />
          <Button onClick={handleChangePwd} loading={pwdLoading} className="w-full mt-1">Update Password</Button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Chef Order Card ─────────────────────────────────
function ChefOrderCard({ order: o, onStartPreparing, onMarkReady }: {
  order: Order
  onStartPreparing: (id: number) => void
  onMarkReady: (id: number) => void
}) {
  const [actionLoading, setActionLoading] = useState(false)
  const isNew   = ['placed','confirmed'].includes(o.status)
  const isPrep  = o.status === 'preparing'
  const isReady = o.status === 'ready_for_pickup'
  const isDone  = o.status === 'delivered'

  const statusColor = isNew ? { bg: 'rgba(59,130,246,.15)', text: '#93c5fd', border: 'rgba(59,130,246,.3)' }
    : isPrep  ? { bg: 'rgba(245,158,11,.15)', text: '#fcd34d', border: 'rgba(245,158,11,.3)' }
    : isReady ? { bg: 'rgba(16,185,129,.15)', text: '#6ee7b7', border: 'rgba(16,185,129,.3)' }
    : { bg: 'rgba(107,114,128,.15)', text: '#9ca3af', border: 'rgba(107,114,128,.3)' }

  async function doAction(fn: (id: number) => void) {
    setActionLoading(true)
    await fn(o.id)
    setActionLoading(false)
  }

  const timeAgo = () => {
    const mins = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins/60)}h ago`
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0c1220', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: statusColor.text }} />
          <div>
            <p className="text-white font-bold text-sm tracking-wide">{o.orderNumber}</p>
            <p className="text-[11px]" style={{ color: '#6b7280' }}>{timeAgo()} · {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}>
          {o.status.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="space-y-1.5">
          {(o.items ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-white/40 text-xs font-mono">×{item.quantity}</span>
              <span className="text-white/90 text-sm font-medium">{item.productName}</span>
              {item.weight && <span className="text-[11px] px-1.5 py-0.5 rounded-md text-white/40" style={{ background: 'rgba(255,255,255,.05)' }}>{item.weight}</span>}
              {item.eggOption && <span className="text-[11px] text-green-400">🌱</span>}
            </div>
          ))}
        </div>
        {o.cakeMessage && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(201,151,58,.1)', border: '1px solid rgba(201,151,58,.2)' }}>
            <span className="text-sm">💬</span>
            <p className="text-xs italic" style={{ color: '#fcd34d' }}>"{o.cakeMessage}"</p>
          </div>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-px" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        {[
          { label: 'Deliver to', value: o.address?.name ?? '—', sub: o.address?.city },
          { label: 'Slot',       value: o.deliverySlot ?? '—' },
          { label: 'Amount',     value: formatPrice(o.total), valueColor: '#fbbf24' },
          { label: 'Payment',    value: o.paymentMethod ?? '—' },
        ].map((m) => (
          <div key={m.label} className="px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: '#6b7280' }}>{m.label}</p>
            <p className="text-sm font-medium" style={{ color: m.valueColor ?? '#e5e7eb' }}>{m.value}</p>
            {m.sub && <p className="text-[11px]" style={{ color: '#6b7280' }}>{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Address & call */}
      {o.address?.mobile && (
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <p className="text-xs" style={{ color: '#9ca3af' }}>{o.address.line1}, {o.address.pincode}</p>
          <a href={`tel:${o.address.mobile}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors hover:bg-blue-500/20" style={{ color: '#60a5fa', background: 'rgba(59,130,246,.1)' }}>
            <Phone className="w-3 h-3" /> {o.address.mobile}
          </a>
        </div>
      )}

      {/* Action buttons */}
      {(isNew || isPrep) && (
        <div className="px-4 pb-4 pt-3">
          {isNew && (
            <button
              onClick={() => doAction(onStartPreparing)}
              disabled={actionLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', boxShadow: '0 4px 20px rgba(217,119,6,.3)' }}
            >
              {actionLoading ? <span className="animate-spin">⏳</span> : '🍳'} Start Preparing
            </button>
          )}
          {isPrep && (
            <button
              onClick={() => doAction(onMarkReady)}
              disabled={actionLoading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#059669,#065f46)', boxShadow: '0 4px 20px rgba(5,150,105,.3)' }}
            >
              {actionLoading ? <span className="animate-spin">⏳</span> : '✅'} Mark Ready for Pickup
            </button>
          )}
        </div>
      )}

      {isReady && (
        <div className="px-4 pb-4 pt-3">
          <div className="rounded-2xl py-3.5 text-center font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', color: '#6ee7b7' }}>
            <Package className="w-4 h-4" /> Waiting for delivery agent…
          </div>
        </div>
      )}

      {isDone && (
        <div className="px-4 pb-4 pt-3">
          <div className="rounded-2xl py-3 text-center text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(107,114,128,.08)', color: '#9ca3af' }}>
            <CheckCircle2 className="w-4 h-4" /> Delivered successfully
          </div>
        </div>
      )}
    </div>
  )
}
