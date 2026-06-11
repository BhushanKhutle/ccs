import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, usersApi } from '@/lib/api'
import { Order, OrderStatus } from '@/lib/types'
import { Toggle, Spinner, Modal, Input, Button, Alert } from '@/components/ui'
import { toArray, formatPrice } from '@/lib/utils'
import { LogOut, ArrowLeftRight, Key, RefreshCw, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

type DvTab = 'ready' | 'transit' | 'done'

export default function DeliveryPortal() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<DvTab>('ready')
  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('')
  const [pwdOpen,  setPwdOpen]  = useState(false)
  const [curPwd,   setCurPwd]   = useState('')
  const [newPwd,   setNewPwd]   = useState('')
  const [conPwd,   setConPwd]   = useState('')
  const [pwdError, setPwdError] = useState('')

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
    const timer = setInterval(fetchOrders, 30000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  async function acceptOrder(id: number) {
    try {
      await ordersApi.updateStatus(id, 'out_for_delivery')
      toast.success('📦 Picked up! Head to the delivery address.')
      fetchOrders()
    } catch (e: any) { toast.error(e.message) }
  }

  async function confirmDelivery(id: number, otpInput: string) {
    if (!otpInput || otpInput.length < 4) { toast.error('Enter the 4-digit OTP'); return }
    try {
      await ordersApi.updateStatus(id, 'delivered')
      toast.success('🎉 Order delivered successfully!')
      fetchOrders()
    } catch (e: any) { toast.error(e.message) }
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

  const readyOrders   = orders.filter((o) => o.status === 'ready_for_pickup')
  const transitOrders = orders.filter((o) => o.status === 'out_for_delivery')
  const doneOrders    = orders.filter((o) => o.status === 'delivered')

  const tabOrders = tab === 'ready' ? readyOrders : tab === 'transit' ? transitOrders : doneOrders

  return (
    <div className="min-h-screen" style={{ background: '#0a1628' }}>
      {/* Topbar */}
      <header className="flex items-center justify-between px-6 py-3.5" style={{ background: '#0f2744', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚚</span>
          <div>
            <p className="text-white font-semibold text-sm">{user?.name}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Delivery Agent</p>
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
        <div className="rounded-2xl p-6" style={{ background: '#0f2744' }}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">
                You are {isOnline ? 'Online ✅' : 'Offline 🔴'}
              </h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                {isOnline ? 'Ready to accept deliveries' : 'Not accepting deliveries'}
              </p>
            </div>
            <Toggle checked={isOnline} onChange={setIsOnline} color="bg-ccs-green" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: readyOrders.length,   label: 'Ready to Pick', color: 'text-og'        },
            { value: transitOrders.length, label: 'In Transit',    color: 'text-ccs-blue'  },
            { value: doneOrders.length,    label: 'Delivered',     color: 'text-ccs-green' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: '#0f2744' }}>
              <div className={`text-3xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'ready'   as DvTab, icon: '🎁', label: 'Ready to Pick' },
            { id: 'transit' as DvTab, icon: '🚚', label: 'In Transit'    },
            { id: 'done'    as DvTab, icon: '✅', label: 'Delivered'     },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2.5 rounded-xl text-xs font-medium transition-all ${tab === t.id ? 'bg-ccs-blue text-white' : 'text-white/60 hover:bg-white/10'}`}
              style={tab !== t.id ? { background: '#0f2744' } : {}}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#64748b' }}>
            Last updated: {lastUpdated} · Auto-refreshes every 30s
          </p>
          <button onClick={fetchOrders} className="flex items-center gap-1.5 text-xs text-white/60 hover:bg-white/10 px-3 py-1.5 rounded-lg">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {/* Orders */}
        {loading ? (
          <Spinner />
        ) : tabOrders.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <span className="text-5xl block mb-3">📦</span>
            <p className="font-medium">
              {tab === 'ready' ? 'No orders ready for pickup. Chef will mark orders ready.' :
               tab === 'transit' ? 'No orders in transit.' : 'No deliveries yet today.'}
            </p>
            <p className="text-sm mt-1">Auto-refreshes every 30 seconds</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tabOrders.map((order) => (
              <DeliveryOrderCard
                key={order.id}
                order={order}
                onAccept={acceptOrder}
                onConfirm={confirmDelivery}
              />
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

// ─── Delivery Order Card ─────────────────────────────
function DeliveryOrderCard({
  order: o, onAccept, onConfirm,
}: {
  order: Order
  onAccept: (id: number) => void
  onConfirm: (id: number, otp: string) => void
}) {
  const [otp, setOtp] = useState('')
  const isReady   = o.status === 'ready_for_pickup'
  const isTransit = o.status === 'out_for_delivery'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#1e3a5f', border: '1px solid rgba(255,255,255,.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0f2744' }}>
        <div>
          <p className="text-white font-semibold text-sm">{o.orderNumber}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>
            {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isReady ? 'bg-og/20 text-amber-300' : isTransit ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-400'
        }`}>
          {o.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
        {(o.items ?? []).map((item, i) => (
          <p key={i} className="text-sm text-white/80">× {item.quantity} {item.productName}</p>
        ))}
      </div>

      {/* Address */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-2 mb-2">
          <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium">{o.address?.name}</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {[o.address?.line1, o.address?.city, o.address?.pincode].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
        {o.address?.mobile && (
          <a href={`tel:${o.address.mobile}`} className="flex items-center gap-1.5 text-xs text-blue-400 mb-3 w-fit">
            <Phone className="w-3 h-3" /> Call {o.address.mobile}
          </a>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span style={{ color: '#64748b' }}>Slot </span><span className="text-white/80">{o.deliverySlot ?? '—'}</span></div>
          <div><span style={{ color: '#64748b' }}>Total </span><span className="font-semibold text-og">{formatPrice(o.total)}</span></div>
          <div><span style={{ color: '#64748b' }}>Payment </span><span className="text-white/80">{o.paymentMethod}</span></div>
        </div>
      </div>

      {/* Actions */}
      {isReady && (
        <div className="px-4 pb-4">
          <button onClick={() => onAccept(o.id)} className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-og hover:opacity-90 transition-opacity">
            📦 Accept & Pick Up
          </button>
        </div>
      )}

      {isTransit && (
        <div className="px-4 pb-4 space-y-2">
          <div style={{ background: '#0f2744' }} className="rounded-xl p-3">
            <p className="text-xs text-white/60 mb-2">Enter OTP from customer to confirm delivery:</p>
            <input
              type="number"
              maxLength={6}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-transparent text-white text-center text-2xl font-bold tracking-[0.5em] border border-white/20 rounded-xl py-3 outline-none focus:border-ccs-blue"
            />
          </div>
          <button onClick={() => onConfirm(o.id, otp)} className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-ccs-green hover:opacity-90 transition-opacity">
            ✅ Confirm Delivery
          </button>
        </div>
      )}
    </div>
  )
}
