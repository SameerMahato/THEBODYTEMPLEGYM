import { MemberStatus } from '@/types'

/**
 * Weight carries as much meaning here as hue.
 *
 * A solid fill is reserved for the two states that want someone to do
 * something; the states that are merely informational are tinted. Without
 * that, a members table reads as a wall of filled pills and the exceptions
 * stop standing out — and since most rows are Active, a solid accent there
 * also spends the brand colour on the least noteworthy row in the table.
 *
 * Pending and Expiring were previously identical in every respect but their
 * label, which left two unrelated states indistinguishable at a glance.
 * They now differ by weight: Pending needs a plan assigned, Expiring is a
 * heads-up that nothing has gone wrong yet.
 *
 * Overdue is the one exception to the tinted pattern carrying its own hue
 * as text: --danger on the composited red tint measures 4.34:1 over a
 * hovered row, so it keeps white at 14.79:1.
 */
const CONFIG: Record<MemberStatus | 'overdue' | 'expiring', {
  label: string; color: string; bg: string; border: string
}> = {
  //                            text                       fill                    border
  active:   { label: 'Active',   color: 'var(--accent)',    bg: 'var(--accent-a15)',  border: 'var(--accent-a35)' },
  inactive: { label: 'Inactive', color: 'var(--text-secondary)', bg: 'transparent',   border: 'var(--border-strong)' },
  expiring: { label: 'Expiring', color: 'var(--warning)',   bg: 'var(--warning-a15)', border: 'var(--warning-a30)' },
  overdue:  { label: 'Overdue',  color: 'var(--text-primary)', bg: 'var(--danger-a15)', border: 'var(--danger-a40)' },
  pending:  { label: 'Pending',  color: 'var(--text-on-accent)', bg: 'var(--warning)', border: 'transparent' },
}

type StatusKey = keyof typeof CONFIG

export default function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = CONFIG[status] ?? CONFIG.inactive
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}
