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
