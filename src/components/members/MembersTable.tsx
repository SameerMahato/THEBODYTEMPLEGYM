'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MEMBERS_PAGE_SIZE, type MemberStatus, type MemberRow } from '@/types'
import { formatDate, daysUntil } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'

// Matches the query the server rendered: no search, no status filter, page 0.
const INITIAL_QUERY_KEY = '||0'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Inactive', value: 'inactive' },
]

function displayStatusOf(m: MemberRow): MemberStatus | 'overdue' | 'expiring' {
  if (m.status === 'pending') return 'pending'
  if (m.status === 'inactive') return 'inactive'
  const sub = m.current_subscription
  if (!sub) return 'active'
  const days = daysUntil(sub.end_date)
  if (days < 0) return 'overdue'
  if (days <= 7) return 'expiring'
  return 'active'
}

export default function MembersTable({ initialMembers, initialTotal }: {
  initialMembers: MemberRow[]
  initialTotal: number
}) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)

  // The server already rendered the default view, so the effect only fetches
  // once the query actually differs from what the current data represents.
  const queryKey = `${search}|${statusFilter}|${page}`
  const [loadedKey, setLoadedKey] = useState(INITIAL_QUERY_KEY)

  // Derived, not stored: the table is stale exactly while the requested query
  // differs from the one the current rows came from.
  const loading = queryKey !== loadedKey

  useEffect(() => {
    if (queryKey === loadedKey) return

    const controller = new AbortController()

    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (page) params.set('page', String(page))

    const t = setTimeout(() => {
      fetch(`/api/members?${params}`, { signal: controller.signal })
        .then(r => {
          if (!r.ok) {
            if (r.status === 401) { window.location.href = '/login'; return null }
            throw new Error('Failed')
          }
          return r.json()
        })
        .then(d => {
          if (!d) return
          setMembers(d.members)
          setTotal(d.total)
          setLoadedKey(queryKey)
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            setMembers([]); setTotal(0); setLoadedKey(queryKey)
          }
        })
    }, search ? 300 : 0)

    return () => { clearTimeout(t); controller.abort() }
  }, [queryKey, loadedKey, search, statusFilter, page])

  function changeSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  function changeStatus(value: string) {
    setStatusFilter(value)
    setPage(0)
  }

  const pageCount = Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : page * MEMBERS_PAGE_SIZE + 1
  const rangeEnd = Math.min(total, page * MEMBERS_PAGE_SIZE + members.length)

  return (
    <div style={{ padding: '20px 32px' }}>
      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={e => changeSearch(e.target.value)}
            style={{ width: '100%', paddingRight: search ? '32px' : undefined }}
          />
          {search && (
            <button
              onClick={() => changeSearch('')}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px',
                lineHeight: 1, padding: 0,
              }}
            >×</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => changeStatus(f.value)}
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

      <div style={{
        color: 'var(--text-secondary)',
        fontSize: '12px',
        marginBottom: '12px',
        minHeight: '18px',
      }}>
        {loading ? 'Loading…' : total === 0 ? 'No members found'
          : `Showing ${rangeStart}–${rangeEnd} of ${total} member${total !== 1 ? 's' : ''}`}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        overflowX: 'auto',
        opacity: loading ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}>
        {members.length === 0 && !loading ? (
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
                const displayStatus = displayStatusOf(m)
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
                      {sub?.membership_plan?.name ?? '—'}
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

      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            style={pagerStyle(page === 0 || loading)}
          >← Previous</button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Page {page + 1} of {pageCount}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1 || loading}
            style={pagerStyle(page >= pageCount - 1 || loading)}
          >Next →</button>
        </div>
      )}
    </div>
  )
}

function pagerStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '7px 14px',
    border: '1px solid var(--border-strong)',
    background: 'transparent',
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
