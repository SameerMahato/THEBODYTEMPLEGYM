/**
 * Non-secret application configuration — the single source of truth for
 * branding, locale, pagination and membership rules.
 *
 * Safe to import from client components: nothing here is a secret. Secrets
 * stay in environment variables, read only by server-only modules
 * (lib/supabase/server.ts, scripts/seed.ts).
 */

export const appConfig = {
  /**
   * Brand lockup. The display variants are separate fields rather than
   * derived, because the UI sets them in different fonts and sizes —
   * "BODY TEMPLE" renders large in the display face with "GYM" beneath it.
   */
  brand: {
    /** Full name, used in prose, page titles and WhatsApp messages. */
    name: 'Body Temple Gym',
    /** Primary line of the display lockup. */
    displayPrimary: 'BODY TEMPLE',
    /** Secondary line of the display lockup. */
    displaySecondary: 'GYM',
    /** Sidebar subtitle in the staff area. */
    adminLabel: 'GYM ADMIN',
    /** Login page footer. */
    portalLabel: 'Staff Portal',
    description: 'Member management system for Body Temple Gym',
  },

  /**
   * The gym's own timezone. Vercel runs UTC, so a bare `new Date()` reports
   * yesterday between 00:00 and 05:30 IST. Every date that represents a
   * gym-calendar day must be resolved through this.
   */
  timezone: 'Asia/Kolkata',

  currency: {
    code: 'INR',
    locale: 'en-IN',
  },

  /** Locale used for long-form dates such as the dashboard header. */
  displayLocale: 'en-IN',

  pagination: {
    members: 50,
    payments: 100,
  },

  membership: {
    /**
     * A membership within this many days of its end date is shown as
     * "expiring"; past the end date it is "overdue". Single source for a
     * threshold that was previously written out at four call sites.
     */
    expiringSoonDays: 7,
  },

  /**
   * Payment methods, in the order they are offered in the UI. `value` must
   * match the payment_method CHECK constraint in migration 001.
   */
  paymentMethods: [
    { value: 'cash',          label: 'Cash' },
    { value: 'upi',           label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card',          label: 'Card' },
    { value: 'other',         label: 'Other' },
  ],
} as const

export type AppConfig = typeof appConfig
export type PaymentMethodOption = (typeof appConfig.paymentMethods)[number]

/** `{ cash: 'Cash', upi: 'UPI', … }` — derived so the list stays the source. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = Object.fromEntries(
  appConfig.paymentMethods.map(m => [m.value, m.label])
)
