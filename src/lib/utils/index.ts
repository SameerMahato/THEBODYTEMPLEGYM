/**
 * Barrel for the utility layer, so `@/lib/utils` keeps resolving for the
 * existing import sites while the implementations live in focused modules.
 *
 *   dates.ts   calendar, IST handling, membership status
 *   format.ts  currency and number formatting
 */

export {
  GYM_TIME_ZONE,
  gymToday,
  formatDate,
  formatLongDate,
  formatDateTime,
  daysUntil,
  addDaysISO,
  calculateMembershipExpiry,
  isMembershipExpired,
  isMembershipExpiringSoon,
  membershipStatus,
  type DisplayStatus,
} from './dates'

export {
  formatCurrency,
  formatNumber,
  formatPercent,
  PAYMENT_METHOD_LABELS,
} from './format'
