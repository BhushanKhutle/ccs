import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

const WS_URL = typeof window !== 'undefined'
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:4000`
  : 'ws://localhost:4000'

type SocketHandler = (order: any) => void

interface UseOrderSocketOptions {
  onNewOrder?:    SocketHandler
  onOrderUpdate?: SocketHandler
  enabled?: boolean
}

export function useOrderSocket({ onNewOrder, onOrderUpdate, enabled = true }: UseOrderSocketOptions = {}) {
  const socketRef  = useRef<any>(null)
  const { user }   = useAuthStore()
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!enabled || !user) return
    if (socketRef.current?.connected) return

    import('socket.io-client').then(({ io }) => {
      if (!mountedRef.current) return

      const socket = io(`${WS_URL}/orders`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      })

      socket.on('connect', () => {
        console.log('🔌 WebSocket connected')
        socket.emit('join', { role: user.role, userId: user.id })
      })

      socket.on('order:new', (order: any) => {
        if (!mountedRef.current) return
        toast.success(`🆕 New order ${order.orderNumber}!`, { duration: 5000 })
        onNewOrder?.(order)
      })

      socket.on('order:update', (order: any) => {
        if (!mountedRef.current) return
        onOrderUpdate?.(order)
      })

      socket.on('disconnect', () => console.log('🔌 WS disconnected'))
      socket.on('connect_error', (err: any) => console.warn('WS error:', err.message))

      socketRef.current = socket
    }).catch((err) => {
      console.warn('socket.io-client not available, using polling', err.message)
    })
  }, [user, enabled, onNewOrder, onOrderUpdate])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [connect])

  return { connected: socketRef.current?.connected ?? false }
}
