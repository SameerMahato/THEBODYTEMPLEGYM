import { format, differenceInDays, parseISO } from 'date-fns'
import { appConfig } from '@/config/app'
import type { MemberStatus } from '@/types'

/**
 * All date handling for the application.
 *
 * The gym operates in IST while server renders run in UTC on Vercel, so a bare
 * `new Date()` reports yesterday between 00:00 and 05:30 IST. Anything that
 * represents a gym-calendar day must go through gymToday().
 */

export const GYM_TIME_ZONE = appConfig.timezone

// Intl formatters are comparatively expensive to construct, so each is built
// once at module scope rather than per call inside a render.
const gymDayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: GYM_TIME_ZONE })

const longDateFormatter = new Intl.DateTimeFormat(appConfig.displayLocale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: GYM_TIME_ZONE,
})

const dateTimeFormatter = new Intl.DateTimeFormat(appConfig.displayLocale, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: GYM_TIME_ZONE,
})

/** Today in the gym's own calendar, as `YYYY-MM-DD`. */
export function gymToday(): string {
  return gymDayFormatter.format(new Date())
}

/** `03 Oct 2026` — the standard date rendering across the app. */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

/** `Saturday, 3 October 2026` — used for the dashboard header. */
export function formatLongDate(date: Date = new Date()): string {
  return longDateFormatter.format(date)
}

/** `03 Oct 2026, 09:15` — for timestamps rather than calendar days. */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return dateTimeFormatter.format(d)
}

/** Whole days from now until `date`. Negative once the date has passed. */
export function daysUntil(date: string): number {
  return differenceInDays(parseISO(date), new Date())
}

/**
 * Adds days to a `YYYY-MM-DD` string in UTC, matching what Postgres does with
 * `start_date + N days`. Doing this in local time can shift the result by a day.
 */
export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

/** End date for a membership starting on `startDate` and running `durationDays`. */
export function calculateMembershipExpiry(startDate: string, durationDays: number): string {
  return addDaysISO(startDate, durationDays)
}

export function isMembershipExpired(endDate: string): boolean {
  return daysUntil(endDate) < 0
}

export function isMembershipExpiringSoon(endDate: string): boolean {
  const days = daysUntil(endDate)
  return days >= 0 && days <= appConfig.membership.expiringSoonDays
}

/** What a member's row or badge shows, as opposed to their stored status. */
export type DisplayStatus = MemberStatus | 'overdue' | 'expiring'

/**
 * The single source of truth for the status a member is shown as.
 *
 * `pending` and `inactive` are stored states and win outright. An active member
 * is then graded against their current subscription's end date. This was
 * previously written out at each call site, so moving the expiring window meant
 * finding every copy.
 */
export function membershipStatus(
  memberStatus: string,
  currentSubscriptionEnd: string | null | undefined,
): DisplayStatus {
  if (memberStatus === 'pending') return 'pending'
  if (memberStatus === 'inactive') return 'inactive'
  if (!currentSubscriptionEnd) return 'active'
  if (isMembershipExpired(currentSubscriptionEnd)) return 'overdue'
  if (isMembershipExpiringSoon(currentSubscriptionEnd)) return 'expiring'
  return 'active'
}
