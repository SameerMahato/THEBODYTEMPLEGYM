'use client'
import { appConfig } from '@/config/app'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardShell({ pendingCount, children }: {
  pendingCount: number
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Escape closes the drawer, and the page behind it stops scrolling while it
  // is open — a drag over the scrim otherwise moves the page under it.
  useEffect(() => {
    if (!sidebarOpen) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('scroll-locked')

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('scroll-locked')
    }
  }, [sidebarOpen])

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar-wrapper${sidebarOpen ? ' open' : ''}`}>
        <Sidebar pendingCount={pendingCount} onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="main-content">
        <div className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-primary)', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px', height: '24px',
              background: 'var(--accent)', borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: '17px', letterSpacing: '0.04em', color: 'var(--text-primary)',
            }}>{appConfig.brand.displayPrimary}</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
