import { format, differenceInDays, parseISO } from 'date-fns'

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function daysUntil(date: string) {
  return differenceInDays(parseISO(date), new Date())
}

// Server renders run in UTC on Vercel; the gym operates in IST (UTC+5:30), so
// a bare `new Date()` reports yesterday's date between 00:00 and 05:30 local.
export const GYM_TIME_ZONE = 'Asia/Kolkata'

export function gymToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: GYM_TIME_ZONE }).format(new Date())
}

export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function calculateEndDate(startDate: string, durationDays: number): string {
  const start = parseISO(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + durationDays)
  return format(end, 'yyyy-MM-dd')
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  other: 'Other',
}
