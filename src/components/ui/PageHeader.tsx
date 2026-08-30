import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}>{title}</h1>
        {subtitle && (
          <p style={{
            marginTop: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}>{subtitle}</p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
