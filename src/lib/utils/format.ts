import { appConfig } from '@/config/app'

/**
 * Number and currency formatting.
 *
 * Each Intl formatter is constructed once at module scope. formatCurrency in
 * particular is called for every money figure in every table row, and building
 * a NumberFormat per call is measurably wasteful.
 */

const currencyFormatter = new Intl.NumberFormat(appConfig.currency.locale, {
  style: 'currency',
  currency: appConfig.currency.code,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat(appConfig.currency.locale)

const percentFormatter = new Intl.NumberFormat(appConfig.currency.locale, {
  style: 'percent',
  maximumFractionDigits: 1,
})

/** `₹2,999` — whole rupees, Indian digit grouping. */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

/** `1,24,500` — Indian digit grouping, no currency symbol. */
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** `12.5%`. Takes a fraction, so 0.125 renders as 12.5%. */
export function formatPercent(fraction: number): string {
  return percentFormatter.format(fraction)
}

export { PAYMENT_METHOD_LABELS } from '@/config/app'
