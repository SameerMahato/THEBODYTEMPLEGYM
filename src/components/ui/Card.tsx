import React from 'react'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export default function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ children, style }: CardProps) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--surface-sheen)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardBody({ children, style }: CardProps) {
  return (
    <div style={{ padding: '20px', ...style }}>
      {children}
    </div>
  )
}
