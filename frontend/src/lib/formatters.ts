import { format, parseISO } from 'date-fns'

export function formatGhs(kobo: number | null | undefined): string {
  const n = (kobo ?? 0) / 100
  return `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatWeight(grams: number | null | undefined): string {
  if (!grams) return ''
  return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`
}

export function formatDate(value: string | Date, pattern = 'd MMM yyyy'): string {
  const d = typeof value === 'string' ? parseISO(value) : value
  return format(d, pattern)
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, 'd MMM yyyy • h:mm a')
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}
export const formatStatus = (s: string): string => STATUS_LABELS[s] || s
