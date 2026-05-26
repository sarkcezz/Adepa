import { MessageCircle } from 'lucide-react'

export function WhatsAppFAB() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '233500000000'
  const message = encodeURIComponent('Hello Adepa Pork Hub, I’d like to place an order.')

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/40 transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
