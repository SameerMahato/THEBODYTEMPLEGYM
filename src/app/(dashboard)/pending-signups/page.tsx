'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Member } from '@/types'
import { formatDate } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

export default function PendingSignupsPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/members?status=pending')
      .then(r => {
        if (!r.ok) {
          if (r.status === 401) { window.location.href = '/login'; return null }
          throw new Error('Failed')
        }
        return r.json()
      })
      .then(d => { if (d) { setMembers(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader
        title="PENDING SIGNUPS"
        subtitle="Walk-in self-signups awaiting review — assign a plan and record first payment to activate"
      />

      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : members.length === 0 ? (
          <Card style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>
              ALL CLEAR
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              No pending signups. Walk-ins will appear here after scanning the QR code at the front desk.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {members.map(m => (
              <Link key={m.id} href={`/members/${m.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--warning)',
                  borderLeft: '4px solid var(--warning)',
                  borderRadius: '6px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {m.full_name}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {m.phone && <span>{m.phone}</span>}
                      {m.email && <span>{m.email}</span>}
                      {!m.phone && !m.email && <span>No contact info</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--warning)', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>PENDING</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Signed up {formatDate(m.created_at)}</div>
                    <div style={{ color: 'var(--accent)', fontSize: '12px', marginTop: '4px', fontWeight: 500 }}>Click to review →</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
