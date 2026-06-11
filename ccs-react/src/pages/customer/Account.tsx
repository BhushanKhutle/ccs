import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { toArray, formatDate, formatPrice, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/utils'
import { Order } from '@/lib/types'
import { Spinner, Empty } from '@/components/ui'
import { LogOut } from 'lucide-react'

export default function AccountPage() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.mine().then((r) => r.data),
  })

  const orders = toArray<Order>(data)

  function logout() { clearAuth(); navigate('/login') }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Profile */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-plum-light flex items-center justify-center text-plum font-display text-xl font-bold">
            {user?.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-ink text-lg">{user?.name}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            {user?.mobile && <p className="text-sm text-muted">{user.mobile}</p>}
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-ccs-red hover:bg-ccs-red-lt px-3 py-2 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Orders */}
      <h3 className="font-display text-2xl text-plum mb-4">My Orders</h3>
      {isLoading ? <Spinner /> : orders.length === 0 ? (
        <Empty icon="🛒" title="No orders yet" subtitle="Your orders will appear here" action={
          <button onClick={() => navigate('/catalog')} className="btn-primary px-6 py-2.5 text-sm mt-2">Start Shopping</button>
        } />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-ink text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                  <span className="font-semibold text-plum text-sm">{formatPrice(+o.total)}</span>
                </div>
              </div>
              <div className="text-sm text-muted">
                {(o.items ?? []).map((i, idx) => (
                  <span key={idx}>{i.productName} ×{i.quantity}{idx < (o.items?.length ?? 0) - 1 ? ', ' : ''}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
