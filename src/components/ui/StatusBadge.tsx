import { MemberStatus } from '@/types'

const CONFIG: Record<MemberStatus | 'overdue' | 'expiring', {
  label: string; color: string; bg: string; border: string
}> = {
  active:   { label: 'Active',    color: '#fff',                   bg: 'var(--accent)',              border: 'transparent' },
  inactive: { label: 'Inactive',  color: 'var(--text-secondary)',  bg: 'transparent',                border: 'var(--border-strong)' },
  pending:  { label: 'Pending',   color: '#000',                   bg: 'var(--warning)',              border: 'transparent' },
  overdue:  { label: 'Overdue',   color: '#fff',                   bg: 'var(--danger-a15)',        border: 'var(--danger-a40)' },
  expiring: { label: 'Expiring',  color: '#000',                   bg: 'var(--warning)',              border: 'transparent' },
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
