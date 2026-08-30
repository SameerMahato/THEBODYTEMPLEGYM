import React from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  loading?: boolean
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: '1px solid var(--accent)',
    fontWeight: 600,
    boxShadow: '0 0 0 0 var(--accent-glow)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid var(--danger)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
  },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        padding: size === 'sm' ? '6px 14px' : '10px 20px',
        borderRadius: 'var(--radius-sm)',
        fontSize: size === 'sm' ? '12px' : '13.5px',
        fontFamily: 'var(--font-body)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s',
        letterSpacing: '0.01em',
        ...style,
      }}
      onMouseEnter={e => {
        if (disabled || loading) return
        const el = e.currentTarget
        if (variant === 'primary') el.style.boxShadow = '0 0 20px rgba(225,29,72,0.35)'
        if (variant === 'secondary') el.style.borderColor = 'var(--border-strong)', el.style.background = 'var(--bg-hover)'
        if (variant === 'danger') el.style.background = 'rgba(255,68,68,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        if (variant === 'primary') el.style.boxShadow = '0 0 0 0 var(--accent-glow)'
        if (variant === 'secondary') el.style.borderColor = 'var(--border-strong)', el.style.background = 'transparent'
        if (variant === 'danger') el.style.background = 'transparent'
      }}
      {...props}
    >
      {loading ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ animation: 'spin 0.8s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Saving…
        </>
      ) : children}
    </button>
  )
}
