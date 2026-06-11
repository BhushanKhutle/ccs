import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

interface RazorpayOptions {
  amount: number        // in rupees
  orderId: number       // your DB order ID
  name?: string
  description?: string
  onSuccess: (paymentId: string) => void
  onFailure?: (error: any) => void
}

export function useRazorpay() {
  const { user } = useAuthStore()

  const pay = useCallback(async (opts: RazorpayOptions) => {
    // Step 1: Create Razorpay order on backend
    const token = useAuthStore.getState().token
    let rzpOrderId = ''
    let keyId = ''
    let simulated = false

    try {
      const res = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: opts.amount, orderId: opts.orderId }),
      })
      const data = await res.json()
      const d = data.data ?? data
      rzpOrderId = d.id
      keyId = d.keyId
      simulated = d.simulated

      // If simulated (no Razorpay keys), skip to success
      if (simulated) {
        toast.success('Payment simulated ✅ (add Razorpay keys for live payments)')
        opts.onSuccess(`sim_${Date.now()}`)
        return
      }
    } catch (e: any) {
      toast.error('Failed to create payment order: ' + e.message)
      opts.onFailure?.(e)
      return
    }

    // Step 2: Load Razorpay SDK dynamically
    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
        document.head.appendChild(script)
      })
    }

    // Step 3: Open Razorpay checkout
    const rzp = new (window as any).Razorpay({
      key: keyId,
      amount: opts.amount * 100,
      currency: 'INR',
      order_id: rzpOrderId,
      name: opts.name ?? 'Celebration Cake Shop',
      description: opts.description ?? `Order #${opts.orderId}`,
      prefill: {
        name:  user?.name ?? '',
        email: user?.email ?? '',
      },
      theme: { color: '#3D1C52' },
      handler: async (response: any) => {
        // Step 4: Verify payment on backend
        try {
          const vRes = await fetch('/api/v1/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId: opts.orderId,
            }),
          })
          const vData = await vRes.json()
          if (vData.data?.success || vData.success) {
            toast.success('Payment successful! 🎉')
            opts.onSuccess(response.razorpay_payment_id)
          } else {
            throw new Error('Verification failed')
          }
        } catch (e: any) {
          toast.error('Payment verification failed')
          opts.onFailure?.(e)
        }
      },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled')
          opts.onFailure?.({ message: 'Payment cancelled by user' })
        },
      },
    })
    rzp.open()
  }, [user])

  return { pay }
}
