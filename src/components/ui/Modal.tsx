'use client'

import { useEffect, useRef } from 'react'

/**
 * Shared dialog shell: scrim, panel, header and optional pinned banner and
 * footer. The payment and renewal modals each carried their own copy of this,
 * including slightly different scrim opacities and only one of the two having
 * a focus trap.
 *
 * Escape and scrim clicks both close, unless `closeDisabled` is set — which
 * callers use to stop a dialog being dismissed mid-submit.
 */
export default function Modal({
  title, subtitle, width = 'sm', banner, footer, children,
  onClose, closeDisabled = false,
}: {
  title: string
  subtitle?: React.ReactNode
  /** sm = 520px (forms), md = 560px (multi-step flows). */
  width?: 'sm' | 'md'
  /** Pinned between header and body; does not scroll with the content. */
  banner?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  onClose: () => void
  closeDisabled?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = panelRef.current
    if (!el) return

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!closeDisabled) onClose()
        return
      }
      if (e.key !== 'Tab') return
      // Keep focus inside the dialog rather than letting Tab walk the page behind it.
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }

    first?.focus()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, closeDisabled])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'var(--scrim-modal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 'var(--space-6)',
      }}
      onClick={() => { if (!closeDisabled) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          width: '100%',
          maxWidth: width === 'md' ? 'var(--modal-width-md)' : 'var(--modal-width-sm)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700,
              letterSpacing: '0.05em', color: 'var(--text-primary)',
            }}>{title}</div>
            {subtitle && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: closeDisabled ? 'not-allowed' : 'pointer',
              fontSize: '20px', lineHeight: 1,
            }}
          >×</button>
        </div>

        {banner && <div style={{ flexShrink: 0 }}>{banner}</div>}

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            display: 'flex', gap: '12px', padding: '16px 24px',
            borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
