import { appConfig } from '@/config/app'

export type MemberStatus = 'pending' | 'active' | 'inactive'
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other'
export type PaymentType = 'payment' | 'adjustment'
export type StaffRole = 'admin' | 'staff'

export interface Gym {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export interface StaffUser {
  id: string
  gym_id: string
  full_name: string
  email: string
  role: StaffRole
  created_at: string
}

export interface MembershipPlan {
  id: string
  gym_id: string
  name: string
  price: number
  duration_days: number
  is_active: boolean
  created_at: string
}

export interface Member {
  id: string
  gym_id: string
  full_name: string
  phone: string | null
  email: string | null
  date_of_birth: string | null
  join_date: string
  photo_url: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  status: MemberStatus
  created_at: string
  updated_at: string
}

export interface MemberSubscription {
  id: string
  gym_id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
  membership_plan?: MembershipPlan
}

export interface Payment {
  id: string
  gym_id: string
  member_id: string
  subscription_id: string | null
  recorded_by: string
  type: PaymentType
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  period_start: string | null
  period_end: string | null
  notes: string | null
  related_payment_id: string | null
  reason: string | null
  created_at: string
  staff_user?: StaffUser
  member?: Member
  adjustments?: Payment[]
}

export interface DashboardStats {
  total_active: number
  revenue_this_month: number
  expiring_soon: MemberWithSubscription[]
  overdue: MemberWithSubscription[]
  pending_signups: Member[]
}

export interface MemberWithSubscription extends Member {
  current_subscription: MemberSubscription | null
}

// ── List shapes shared between the server data layer and the client tables.
// Kept here (and not in src/lib/data/*) so client components can import them
// without dragging next/headers into the browser bundle.

// Page sizes are configuration, not types — they live in config/app.ts and are
// re-exported here so the existing import sites keep working.
export const MEMBERS_PAGE_SIZE = appConfig.pagination.members
export const PAYMENTS_PAGE_SIZE = appConfig.pagination.payments

export interface MemberRow {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  status: string
  join_date: string
  created_at: string
  current_subscription: {
    end_date: string
    // id/price/duration_days let the renewal modal offer "Renew Previous Plan"
    // without a further round trip per row.
    membership_plan: { id: string; name: string; price: number; duration_days: number } | null
  } | null
}

export interface MemberListResult {
  members: MemberRow[]
  total: number
}

export interface PaymentRow {
  id: string
  type: PaymentType
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  period_start: string | null
  period_end: string | null
  notes: string | null
  reason: string | null
  member: { id: string; full_name: string } | null
  staff_user: { full_name: string } | null
}

export interface PaymentListResult {
  payments: PaymentRow[]
  total: number
  net_revenue: number
}

export interface SubWithMember {
  id: string
  start_date: string
  end_date: string
  is_current: boolean
  membership_plan: { name: string | null; price: number | null } | null
  member: {
    id: string
    full_name: string
    phone: string | null
    email: string | null
    status: string
  } | null
}

export interface DashboardData {
  total_active: number
  revenue_this_month: number
  expiring_soon: SubWithMember[]
  overdue: SubWithMember[]
  pending_signups: Pick<Member, 'id' | 'full_name' | 'phone' | 'email' | 'created_at'>[]
  pending_count: number
}
