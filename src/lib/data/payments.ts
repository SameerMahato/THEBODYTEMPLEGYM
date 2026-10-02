import { getStaffContext } from '@/lib/auth'
import { PAYMENTS_PAGE_SIZE, type PaymentRow, type PaymentListResult } from '@/types'

export interface PaymentListParams {
  type?: string
  from?: string
  to?: string
  page?: number
}

export async function getPayments(params: PaymentListParams): Promise<PaymentListResult | null> {
  const ctx = await getStaffContext()
  if (!ctx) return null

  const page = Math.max(0, params.page ?? 0)
  const start = page * PAYMENTS_PAGE_SIZE

  // Only the columns the table renders — gym_id, recorded_by, subscription_id,
  // related_payment_id and created_at were being shipped and never read.
  let query = ctx.supabase
    .from('payment')
    .select(
      `id, type, amount, payment_date, payment_method,
       period_start, period_end, notes, reason,
       member(id, full_name),
       staff_user(full_name)`,
      { count: 'exact' }
    )
    .eq('gym_id', ctx.gymId)
    .order('payment_date', { ascending: false })
    .range(start, start + PAYMENTS_PAGE_SIZE - 1)

  if (params.type) query = query.eq('type', params.type)
  if (params.from) query = query.gte('payment_date', params.from)
  if (params.to)   query = query.lte('payment_date', params.to)

  // The total must cover the whole filtered set, not just the current page.
  // Summing in Postgres avoids shipping every matching row here to .reduce().
  const totalsQuery = ctx.supabase.rpc('get_payment_totals', {
    p_type: params.type || null,
    p_from: params.from || null,
    p_to: params.to || null,
  })

  const [listResult, totalsResult] = await Promise.all([query, totalsQuery])

  if (listResult.error) throw new Error(listResult.error.message)

  // A failed total must not silently render as ₹0 — that reads as "no revenue"
  // rather than "revenue unknown", which is worse than an error on a money figure.
  if (totalsResult.error) throw new Error(totalsResult.error.message)

  return {
    payments: (listResult.data ?? []) as unknown as PaymentRow[],
    total: listResult.count ?? 0,
    net_revenue: Number(totalsResult.data ?? 0),
  }
}
