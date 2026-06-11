import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, usersApi } from '@/lib/api'
import { Order, OrderStatus } from '@/lib/types'
import { Toggle, Modal, Input, Button, Alert } from '@/components/ui'
import { toArray, formatPrice } from '@/lib/utils'
import { LogOut, ArrowLeftRight, Key, RefreshCw, Phone, MapPin, Navigation, Clock, CheckCircle2, Truck, Wifi, WifiOff } from 'lucide-react'
import { useOrderSocket } from '@/hooks/useOrderSocket'
import toast from 'react-hot-toast'

type DvTab = 'ready' | 'transit' | 'done'

export default function DeliveryPortal() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const [orders,    setOrders]    = useState<Order[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<DvTab>('ready')
  const [isOnline,  setIsOnline]  = useState(true)
  const [lastUpd,   setLastUpd]   = useState('')
  const [countdown, setCountdown] = useState(30)
  const [pwdOpen,   setPwdOpen]   = useState(false)
  const [curPwd,    setCurPwd]    = useState('')
  const [newPwd,    setNewPwd]    = useState('')
  const [conPwd,    setConPwd]    = useState('')
  const [pwdLoading,setPwdLoading]= useState(false)
  const [pwdError,  setPwdError]  = useState('')
  const countRef = useRef<any>(null)
  const [wsConnected, setWsConnected] = useState(false)

  // WebSocket — real-time delivery updates
  useOrderSocket({
    onOrderUpdate: (order) => { fetchOrders(true) },
    onNewOrder:    (order) => { fetchOrders(true) },
    enabled: true,
  })

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await ordersApi.all()
      setOrders(toArray<Order>(res.data))
      setLastUpd(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCountdown(30)
    } catch { toast.error('Failed to refresh') }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const timer = setInterval(() => fetchOrders(true), 30000)
    countRef.current = setInterval(() => setCountdown((c) => (c <= 1 ? 30 : c - 1)), 1000)
    return () => { clearInterval(timer); clearInterval(countRef.current) }
  }, [fetchOrders])

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

  async function acceptOrder(id: number) {
    try {
      await ordersApi.updateStatus(id, 'out_for_delivery')
      toast.success('📦 Picked up! Head to the delivery address.')
      fetchOrders(true)
    } catch (e: any) { toast.error(e.message) }
  }

  async function confirmDelivery(id: number, otp: string) {
    if (!otp || otp.length < 4) { toast.error('Enter the 4-digit OTP from customer'); return }
    try {
      // Send OTP to backend for validation
      const token = localStorage.getItem('ccs-auth')
        ? JSON.parse(localStorage.getItem('ccs-auth')!).state?.token
        : ''
      const res = await fetch(`/api/v1/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'delivered', otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.message || data?.data?.message || 'Invalid OTP'
        toast.error(`❌ ${msg}`)
        return
      }
      toast.success('🎉 Delivery confirmed successfully!')
      fetchOrders(true)
    } catch (e: any) { toast.error(e.message) }
  }

  const readyOrders   = orders.filter((o) => o.status === 'ready_for_pickup')
  const transitOrders = orders.filter((o) => o.status === 'out_for_delivery')
  const doneOrders    = orders.filter((o) => o.status === 'delivered')
  const tabOrders     = tab === 'ready' ? readyOrders : tab === 'transit' ? transitOrders : doneOrders

  const TABS = [
    { id: 'ready'   as DvTab, emoji: '🎁', label: 'Ready to Pick', count: readyOrders.length,   activeBg: '#b45309' },
    { id: 'transit' as DvTab, emoji: '🚚', label: 'In Transit',    count: transitOrders.length, activeBg: '#1d4ed8' },
    { id: 'done'    as DvTab, emoji: '✅', label: 'Delivered',     count: doneOrders.length,    activeBg: '#065f46' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>

      {/* Top Bar */}
      <header style={{ background: '#0f2040', borderBottom: '1px solid rgba(255,255,255,.07)' }} className="sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1d4ed8' }}>
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">{user?.name}</p>
            <p className="text-xs" style={{ color: '#64748b' }}>Delivery Agent</p>
          </div>
          <button onClick={() => setPwdOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><Key className="w-4 h-4" /></button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><ArrowLeftRight className="w-4 h-4" /></button>
          <button onClick={() => { clearAuth(); navigate('/login') }} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Status Card */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: isOnline ? 'linear-gradient(135deg,#0f3460,#0a2444)' : 'linear-gradient(135deg,#1a1a2e,#0d0d1a)',
            border: `1px solid ${isOnline ? 'rgba(29,78,216,.4)' : 'rgba(100,116,139,.2)'}`,
          }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                <h2 className="text-white font-bold text-lg">You are {isOnline ? 'Online' : 'Offline'}</h2>
              </div>
              <p className="text-sm" style={{ color: isOnline ? '#93c5fd' : '#94a3b8' }}>
                {isOnline ? 'Ready to accept deliveries' : 'Not accepting deliveries'}
              </p>
            </div>
            <Toggle checked={isOnline} onChange={setIsOnline} color="bg-blue-500" />
          </div>
          {isOnline && (
            <div className="mt-3 flex items-center gap-4 text-xs" style={{ color: '#60a5fa' }}>
              <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> GPS Active</span>
              <span>·</span>
              <span>{readyOrders.length} order{readyOrders.length !== 1 ? 's' : ''} waiting</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: readyOrders.length,   label: 'Ready to Pick', color: '#fbbf24', bg: 'rgba(251,191,36,.1)',  border: 'rgba(251,191,36,.2)'  },
            { value: transitOrders.length, label: 'In Transit',    color: '#60a5fa', bg: 'rgba(96,165,250,.1)', border: 'rgba(96,165,250,.2)'  },
            { value: doneOrders.length,    label: 'Delivered',     color: '#34d399', bg: 'rgba(52,211,153,.1)', border: 'rgba(52,211,153,.2)'  },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="text-3xl font-bold font-display" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] mt-1" style={{ color: '#94a3b8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative py-3 rounded-2xl text-xs font-semibold transition-all duration-200"
              style={{
                background: tab === t.id ? t.activeBg : 'rgba(255,255,255,.04)',
                border: `1px solid ${tab === t.id ? 'transparent' : 'rgba(255,255,255,.07)'}`,
                color: tab === t.id ? '#fff' : '#94a3b8',
                transform: tab === t.id ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div className="text-lg mb-0.5">{t.emoji}</div>
              <div>{t.label}</div>
              {t.count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Refresh info */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#64748b' }}>
            <Clock className="w-3 h-3" /> Updated {lastUpd} · Next in {countdown}s
            <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-full text-[10px]"
              style={{ background: wsConnected ? 'rgba(52,211,153,.15)' : 'rgba(107,114,128,.15)', color: wsConnected ? '#34d399' : '#9ca3af' }}>
              {wsConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {wsConnected ? 'Live' : 'Polling'}
            </span>
          </p>
          <button onClick={() => fetchOrders()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: '#94a3b8' }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="space-y-3">
            {[1,2].map((i) => <div key={i} className="rounded-2xl h-48 animate-pulse" style={{ background: 'rgba(255,255,255,.04)' }} />)}
          </div>
        ) : tabOrders.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#64748b' }}>
            <div className="text-5xl mb-3">{tab === 'ready' ? '📦' : tab === 'transit' ? '🚚' : '✅'}</div>
            <p className="font-medium text-gray-300">
              {tab === 'ready' ? 'No orders ready for pickup' : tab === 'transit' ? 'No orders in transit' : 'No deliveries yet today'}
            </p>
            <p className="text-sm mt-1 text-gray-500">
              {tab === 'ready' ? 'Chef will mark orders ready for pickup' : 'Auto-refreshes every 30 seconds'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tabOrders.map((order) => (
              <DeliveryOrderCard key={order.id} order={order} onAccept={acceptOrder} onConfirm={confirmDelivery} />
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

// ─── Delivery Order Card ─────────────────────────────
function DeliveryOrderCard({ order: o, onAccept, onConfirm }: {
  order: Order
  onAccept: (id: number) => void
  onConfirm: (id: number, otp: string) => void
}) {
  const [otp,           setOtp]           = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const isReady   = o.status === 'ready_for_pickup'
  const isTransit = o.status === 'out_for_delivery'
  const isDone    = o.status === 'delivered'

  async function doAccept() {
    setActionLoading(true)
    await onAccept(o.id)
    setActionLoading(false)
  }

  async function doConfirm() {
    setActionLoading(true)
    await onConfirm(o.id, otp)
    setActionLoading(false)
  }

  const timeAgo = () => {
    return new Date(o.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.005]"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,.08)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0c1220', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-amber-400' : isTransit ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
          <div>
            <p className="text-white font-bold text-sm">{o.orderNumber}</p>
            <p className="text-[11px]" style={{ color: '#6b7280' }}>{timeAgo()}</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          isReady   ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
          isTransit ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
          'bg-green-500/15 text-green-300 border border-green-500/30'
        }`}>
          {isReady ? '🎁 READY' : isTransit ? '🚚 IN TRANSIT' : '✅ DELIVERED'}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        {(o.items ?? []).map((item, i) => (
          <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
            <span className="text-white/30 text-xs font-mono">×{item.quantity}</span>
            <span className="text-white/90 text-sm">{item.productName}</span>
          </div>
        ))}
      </div>

      {/* Address */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#60a5fa' }} />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{o.address?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {[o.address?.line1, o.address?.city, o.address?.pincode].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        {o.address?.mobile && (
          <a href={`tel:${o.address.mobile}`}
            className="mt-2.5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors"
            style={{ background: 'rgba(59,130,246,.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,.2)' }}>
            <Phone className="w-4 h-4" /> Call {o.address.mobile}
          </a>
        )}
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-px px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
        {[
          { label: 'Slot',    value: o.deliverySlot ?? '—' },
          { label: 'Amount',  value: formatPrice(o.total), color: '#fbbf24' },
          { label: 'Payment', value: o.paymentMethod ?? '—' },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: '#6b7280' }}>{m.label}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: m.color ?? '#e5e7eb' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      {isReady && (
        <div className="px-4 pb-4 pt-3">
          <button
            onClick={doAccept}
            disabled={actionLoading}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-98 disabled:opacity-60 text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#d97706,#92400e)', boxShadow: '0 4px 20px rgba(217,119,6,.25)' }}
          >
            {actionLoading ? '⏳ Processing…' : <><Truck className="w-4 h-4" /> Accept & Pick Up</>}
          </button>
        </div>
      )}

      {isTransit && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(29,78,216,.08)', border: '1px solid rgba(29,78,216,.2)' }}>
            <p className="text-xs font-medium mb-3 text-center" style={{ color: '#93c5fd' }}>
              Ask customer for their OTP to confirm delivery
            </p>
            <input
              type="number"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              placeholder="Enter OTP"
              className="w-full bg-transparent text-center text-3xl font-bold tracking-[0.5em] border-2 rounded-2xl py-4 outline-none transition-colors"
              style={{
                color: '#fff',
                borderColor: otp.length >= 4 ? '#3b82f6' : 'rgba(255,255,255,.15)',
              }}
            />
            {otp.length >= 4 && (
              <p className="text-center text-xs mt-2" style={{ color: '#6ee7b7' }}>✓ OTP entered — tap confirm below</p>
            )}
          </div>
          <button
            onClick={doConfirm}
            disabled={actionLoading || otp.length < 4}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-98 disabled:opacity-40 text-sm flex items-center justify-center gap-2"
            style={{ background: otp.length >= 4 ? 'linear-gradient(135deg,#059669,#065f46)' : 'rgba(255,255,255,.08)', boxShadow: otp.length >= 4 ? '0 4px 20px rgba(5,150,105,.25)' : 'none' }}
          >
            {actionLoading ? '⏳ Confirming…' : <><CheckCircle2 className="w-4 h-4" /> Confirm Delivery</>}
          </button>
        </div>
      )}

      {isDone && (
        <div className="px-4 pb-4 pt-3">
          <div className="rounded-2xl py-3.5 text-center text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: 'rgba(5,150,105,.1)', border: '1px solid rgba(5,150,105,.2)', color: '#6ee7b7' }}>
            <CheckCircle2 className="w-4 h-4" /> Delivered successfully 🎂
          </div>
        </div>
      )}
    </div>
  )
}
