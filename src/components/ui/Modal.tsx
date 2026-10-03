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

  // Stops the page behind the dialog scrolling under a thumb drag, which on
  // iOS otherwise moves the page while the sheet stays put.
  useEffect(() => {
    document.body.classList.add('scroll-locked')
    return () => document.body.classList.remove('scroll-locked')
  }, [])

  return (
    <div
      className="modal-overlay"
      onClick={() => { if (!closeDisabled) onClose() }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-panel${width === 'md' ? ' modal-panel--md' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700,
              letterSpacing: '0.05em', color: 'var(--text-primary)',
            }}>{title}</div>
            {subtitle && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-small)', marginTop: '2px' }}>
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
              /* Comfortable tap target without moving the glyph. */
              padding: '4px 8px', margin: '-4px -8px',
            }}
          >×</button>
        </div>

        {banner && <div style={{ flexShrink: 0 }}>{banner}</div>}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
