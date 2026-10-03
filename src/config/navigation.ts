/**
 * Sidebar navigation. Pure data — icons live in the Sidebar component and are
 * looked up by `icon` key, so this stays a .ts module importable anywhere
 * without dragging JSX along.
 */

export type NavIconKey =
  | 'dashboard'
  | 'members'
  | 'plans'
  | 'payments'
  | 'pending'
  | 'qr'

export interface NavItem {
  href: string
  label: string
  icon: NavIconKey
  /** Renders the live pending-signup count as a badge on this item. */
  showsPendingBadge?: boolean
}

export const navigation: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',       icon: 'dashboard' },
  { href: '/members',         label: 'Members',         icon: 'members' },
  { href: '/plans',           label: 'Plans',           icon: 'plans' },
  { href: '/payments',        label: 'Payments',        icon: 'payments' },
  { href: '/pending-signups', label: 'Pending Signups', icon: 'pending', showsPendingBadge: true },
  { href: '/join-qr',         label: 'Join QR Code',    icon: 'qr' },
]
