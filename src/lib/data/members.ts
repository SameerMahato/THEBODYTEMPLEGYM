import { getStaffContext } from '@/lib/auth'
import { MEMBERS_PAGE_SIZE, type MemberRow, type MemberListResult } from '@/types'

export interface MemberListParams {
  search?: string
  status?: string
  page?: number
}

// PostgREST treats % and _ as wildcards inside ilike patterns.
function escapeLike(value: string) {
  return value.replace(/[%_]/g, m => '\\' + m)
}

export interface MemberDetailSubscription {
  id: string
  start_date: string
  end_date: string
  is_current: boolean
  membership_plan: { name: string; price: number; duration_days: number } | null
}

export interface MemberDetailPayment {
  id: string
  type: string
  amount: number
  payment_date: string
  payment_method: string
  period_start: string | null
  period_end: string | null
  notes: string | null
  reason: string | null
  staff_user: { full_name: string } | null
}

export interface MemberDetail {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  date_of_birth: string | null
  join_date: string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  status: string
  member_subscription: MemberDetailSubscription[]
  payments: MemberDetailPayment[]
}

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  const ctx = await getStaffContext()
  if (!ctx) return null

  // Independent reads — issued concurrently rather than one after the other.
  const [memberResult, paymentsResult] = await Promise.all([
    ctx.supabase
      .from('member')
      .select(`
        id, full_name, phone, email, date_of_birth, join_date,
        emergency_contact_name, emergency_contact_phone, notes, status,
        member_subscription(
          id, start_date, end_date, is_current,
          membership_plan(name, price, duration_days)
        )
      `)
      .eq('id', id)
      .eq('gym_id', ctx.gymId)
      .single(),
    ctx.supabase
      .from('payment')
      .select(`
        id, type, amount, payment_date, payment_method,
        period_start, period_end, notes, reason,
        staff_user(full_name)
      `)
      .eq('member_id', id)
      .eq('gym_id', ctx.gymId)
      .order('payment_date', { ascending: false }),
  ])

  if (memberResult.error || !memberResult.data) return null

  return {
    ...(memberResult.data as unknown as Omit<MemberDetail, 'payments'>),
    payments: (paymentsResult.data ?? []) as unknown as MemberDetailPayment[],
  }
}

export interface EditableMember {
  full_name: string
  phone: string
  email: string
  date_of_birth: string
  emergency_contact_name: string
  emergency_contact_phone: string
  notes: string
}

// Only the fields the edit form writes. The page previously loaded the member's
// entire subscription and payment history to fill in seven inputs.
export async function getMemberForEdit(id: string): Promise<EditableMember | null> {
  const ctx = await getStaffContext()
  if (!ctx) return null

  const { data } = await ctx.supabase
    .from('member')
    .select('full_name, phone, email, date_of_birth, emergency_contact_name, emergency_contact_phone, notes')
    .eq('id', id)
    .eq('gym_id', ctx.gymId)
    .single()

  if (!data) return null

  return {
    full_name: data.full_name ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    date_of_birth: data.date_of_birth ?? '',
    emergency_contact_name: data.emergency_contact_name ?? '',
    emergency_contact_phone: data.emergency_contact_phone ?? '',
    notes: data.notes ?? '',
  }
}

export async function getMembers(params: MemberListParams): Promise<MemberListResult | null> {
  const ctx = await getStaffContext()
  if (!ctx) return null

  const page = Math.max(0, params.page ?? 0)
  const from = page * MEMBERS_PAGE_SIZE
  const to = from + MEMBERS_PAGE_SIZE - 1

  // Only the columns the table renders, and only the *current* subscription —
  // the previous query embedded every subscription a member had ever held.
  let query = ctx.supabase
    .from('member')
    .select(
      `id, full_name, phone, email, status, join_date, created_at,
       member_subscription!left(end_date, membership_plan(name))`,
      { count: 'exact' }
    )
    .eq('gym_id', ctx.gymId)
    .eq('member_subscription.is_current', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.status) query = query.eq('status', params.status)

  if (params.search) {
    const s = escapeLike(params.search)
    query = query.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const members: MemberRow[] = (data ?? []).map(row => {
    const { member_subscription, ...rest } = row as unknown as Omit<MemberRow, 'current_subscription'> & {
      member_subscription: { end_date: string; membership_plan: { name: string } | null }[] | null
    }
    return { ...rest, current_subscription: member_subscription?.[0] ?? null }
  })

  return { members, total: count ?? 0 }
}
