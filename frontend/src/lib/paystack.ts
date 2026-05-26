declare global {
  interface Window {
    PaystackPop: any
  }
}

export interface PaystackOptions {
  email: string
  amountKobo: number
  reference?: string
  metadata?: Record<string, any>
  onSuccess: (reference: string) => void
  onClose?: () => void
}

export function openPaystack({ email, amountKobo, reference, metadata, onSuccess, onClose }: PaystackOptions) {
  if (!window.PaystackPop) {
    alert('Payment library not loaded — please refresh and try again.')
    return
  }

  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!key) {
    alert('Payment is not configured.')
    return
  }

  const handler = window.PaystackPop.setup({
    key,
    email,
    amount: amountKobo,
    currency: 'GHS',
    ref: reference || `APH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    metadata: metadata || {},
    callback: (response: any) => onSuccess(response.reference),
    onClose: () => onClose?.(),
  })

  handler.openIframe()
}
