import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { ordersApi, usersApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { toArray, formatDate, formatPrice, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/utils'
import { Order } from '@/lib/types'
import { Spinner, Empty, Modal, Input, Alert, Button, PageHeader } from '@/components/ui'
import { LogOut, Key, User, Package, ChevronRight, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountPage() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [tab,      setTab]      = useState<'orders' | 'profile'>('orders')
  const [pwdOpen,  setPwdOpen]  = useState(false)
  const [curPwd,   setCurPwd]   = useState('')
  const [newPwd,   setNewPwd]   = useState('')
  const [conPwd,   setConPwd]   = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.mine().then((r) => r.data),
  })
  const orders = toArray<Order>(data)

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
    total: orders.length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    active: orders.filter((o) => !['delivered','cancelled'].includes(o.status)).length,
    spent: orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.total), 0),
  }

  return (
    <div>
      <PageHeader
        title="My Account"
        breadcrumb={[{ label: 'Home', onClick: () => navigate('/home') }, { label: 'Account', onClick: () => {} }]}
        action={
          <button onClick={() => { clearAuth(); navigate('/login') }} className="flex items-center gap-2 text-sm text-ccs-red hover:bg-ccs-red-lt px-4 py-2 rounded-xl transition-colors font-medium">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Profile card */}
        <div className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-plum to-plum-dark flex items-center justify-center text-white font-display text-xl font-bold flex-shrink-0">
            {user?.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-ink text-lg">{user?.name}</h2>
            <div className="flex flex-wrap gap-3 mt-1">
              {user?.email && <span className="flex items-center gap-1 text-xs text-muted"><Mail className="w-3 h-3" />{user.email}</span>}
              {user?.mobile && <span className="flex items-center gap-1 text-xs text-muted"><Phone className="w-3 h-3" />{user.mobile}</span>}
            </div>
          </div>
          <button onClick={() => setPwdOpen(true)} className="flex items-center gap-2 text-xs text-plum border border-plum-mid bg-plum-light px-4 py-2 rounded-xl font-medium hover:bg-plum hover:text-white transition-all">
            <Key className="w-3.5 h-3.5" /> Change Password
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders', value: stats.total,              color: 'text-plum'      },
            { label: 'Delivered',    value: stats.delivered,          color: 'text-ccs-green' },
            { label: 'Active',       value: stats.active,             color: 'text-og'        },
            { label: 'Total Spent',  value: formatPrice(stats.spent), color: 'text-ccs-blue'  },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-2xl p-4 text-center">
              <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Orders list */}
        <div>
          <h3 className="font-display text-xl text-plum mb-4">My Orders</h3>
          {isLoading ? <Spinner /> : orders.length === 0 ? (
            <Empty icon="🛒" title="No orders yet" subtitle="Your order history will appear here" action={
              <Button onClick={() => navigate('/catalog')}>Start Shopping</Button>
            } />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="bg-white border border-border rounded-2xl p-4 hover:shadow-cake transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-ink text-sm">{o.orderNumber}</p>
                      <p className="text-xs text-muted mt-0.5">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[o.status]}`}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                      <span className="font-bold text-plum text-sm">{formatPrice(Number(o.total))}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted flex flex-wrap gap-x-2">
                    {(o.items ?? []).map((item, i) => (
                      <span key={i}>{item.productName} ×{item.quantity}{i < (o.items?.length ?? 0) - 1 ? ',' : ''}</span>
                    ))}
                  </div>
                  {!['delivered','cancelled'].includes(o.status) && (
                    <button onClick={() => navigate(`/track?q=${o.orderNumber}`)} className="flex items-center gap-1 text-xs text-plum font-medium mt-3 hover:underline">
                      <Package className="w-3 h-3" /> Track this order <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
