'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MemberWithSubscription, MemberStatus } from '@/types'
import { formatDate, daysUntil } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Inactive', value: 'inactive' },
]

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const t = setTimeout(() => {
      fetch(`/api/members?${params}`, { signal: controller.signal })
        .then(r => {
          if (!r.ok) {
            if (r.status === 401) { window.location.href = '/login'; return null }
            throw new Error('Failed')
          }
          return r.json()
        })
        .then(d => { if (d) { setMembers(d); setLoading(false) } })
        .catch(err => { if (err.name !== 'AbortError') { setMembers([]); setLoading(false) } })
    }, search ? 300 : 0)
    return () => { clearTimeout(t); controller.abort() }
  }, [search, statusFilter])

  function getMemberStatus(m: MemberWithSubscription): MemberStatus | 'overdue' | 'expiring' {
    if (m.status === 'pending') return 'pending'
    if (m.status === 'inactive') return 'inactive'
    const sub = m.current_subscription
    if (!sub) return 'active'
    const days = daysUntil(sub.end_date)
    if (days < 0) return 'overdue'
    if (days <= 7) return 'expiring'
    return 'active'
  }

  return (
    <div>
      <PageHeader
        title="MEMBERS"
        subtitle={loading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''} found`}
        action={
          <Link href="/members/new">
            <Button>+ Add Member</Button>
          </Link>
        }
      />

      <div style={{ padding: '20px 32px' }}>
        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingRight: search ? '32px' : undefined }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: 0,
                }}
              >×</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                style={{
                  padding: '8px 14px',
                  border: `1px solid ${statusFilter === f.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: statusFilter === f.value ? 'rgba(225,29,72,0.1)' : 'transparent',
                  color: statusFilter === f.value ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: statusFilter === f.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          overflowX: 'auto',
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : members.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No members found.{' '}
              <Link href="/members/new" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Add one →</Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Expiry</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const displayStatus = getMemberStatus(m)
                  const sub = m.current_subscription
                  return (
                    <tr
                      key={m.id}
                      onClick={() => router.push(`/members/${m.id}`)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/members/${m.id}`) } }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${m.full_name}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</div>
                        {m.email && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.email}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.phone ?? '—'}</td>
                      <td><StatusBadge status={displayStatus} /></td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {(sub as { membership_plan?: { name: string } } | null)?.membership_plan?.name ?? '—'}
                      </td>
                      <td>
                        {sub ? (
                          <span style={{
                            color: displayStatus === 'overdue' ? 'var(--danger)'
                              : displayStatus === 'expiring' ? 'var(--warning)'
                              : 'var(--text-secondary)',
                            fontWeight: displayStatus === 'overdue' || displayStatus === 'expiring' ? 600 : 400,
                          }}>
                            {formatDate(sub.end_date)}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(m.join_date)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
