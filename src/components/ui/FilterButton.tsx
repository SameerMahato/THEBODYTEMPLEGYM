'use client'

/**
 * Pill used by the members and payments filter bars. Both had byte-identical
 * copies of this style object.
 */
export default function FilterButton({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '8px 14px',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-a10)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        borderRadius: '4px',
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: active ? 600 : 400,
        transition: `all var(--motion-fast)`,
      }}
    >
      {children}
    </button>
  )
}
