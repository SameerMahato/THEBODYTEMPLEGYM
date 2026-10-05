'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MEMBERS_PAGE_SIZE, type MemberRow } from '@/types'
import { formatDate, membershipStatus } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterButton from '@/components/ui/FilterButton'
import RenewMembershipModal, { type RenewTarget } from '@/components/members/RenewMembershipModal'

// Matches the query the server rendered: no search, no status filter, page 0,
// never refreshed.
const INITIAL_QUERY_KEY = '||0|0'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Inactive', value: 'inactive' },
]

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

  const [renewTarget, setRenewTarget] = useState<RenewTarget | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Bumped after a renewal so the effect below re-runs and the renewed row
  // comes back with its new status and expiry.
  const [refreshToken, setRefreshToken] = useState(0)

  // The server already rendered the default view, so the effect only fetches
  // once the query actually differs from what the current data represents.
  const queryKey = `${search}|${statusFilter}|${page}|${refreshToken}`
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
      <div className="filter-bar">
        <div className="filter-search">
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
        <div className="filter-pills">
          {STATUS_FILTERS.map(f => (
            <FilterButton
              key={f.value}
              active={statusFilter === f.value}
              onClick={() => changeStatus(f.value)}
            >{f.label}</FilterButton>
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
      <div className="table-wrap table-cards" style={{
        opacity: loading ? 0.55 : 1,
        transition: 'opacity var(--motion-fast)',
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => {
                const displayStatus = membershipStatus(m.status, m.current_subscription?.end_date)
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
                    <td data-card-primary>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.full_name}</div>
                      {m.email && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{m.email}</div>}
                    </td>
                    <td data-label="Phone" style={{ color: 'var(--text-secondary)' }}>{m.phone ?? '—'}</td>
                    <td data-label="Status"><StatusBadge status={displayStatus} /></td>
                    <td data-label="Plan" style={{ color: 'var(--text-secondary)' }}>
                      {sub?.membership_plan?.name ?? '—'}
                    </td>
                    <td data-label="Expiry">
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
                    <td data-label="Joined" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(m.join_date)}</td>
                    <td data-card-action>
                      {/* Renewal is offered only once the membership has actually
                          lapsed. "Expiring" members are still active and renew
                          from their own detail page, which continues their
                          period rather than restarting it today. */}
                      {displayStatus === 'overdue' && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setRenewTarget({
                              id: m.id,
                              full_name: m.full_name,
                              previousPlan: sub?.membership_plan ?? null,
                              previousExpiry: sub?.end_date ?? null,
                            })
                          }}
                          style={{
                            padding: '5px 12px',
                            background: 'var(--accent-surface)',
                            color: 'var(--text-on-accent)',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-body)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Renew
                        </button>
                      )}
                    </td>
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

      {renewTarget && (
        <RenewMembershipModal
          member={renewTarget}
          onClose={() => setRenewTarget(null)}
          onSuccess={message => {
            setRenewTarget(null)
            setToast(message)
            // Re-run the current query so the renewed row reflects its new
            // status and expiry, and loses its Renew button.
            setRefreshToken(t => t + 1)
            // Keeps server-rendered counts elsewhere (sidebar, dashboard) honest.
            router.refresh()
          }}
        />
      )}

      {toast && <SuccessToast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: 'min(380px, calc(100vw - 48px))',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--success-a40)',
        borderLeft: '3px solid var(--success)',
        borderRadius: '6px',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '1px' }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700,
          letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: '3px',
        }}>
          MEMBERSHIP RENEWED SUCCESSFULLY
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.5 }}>
          {message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: 0, flexShrink: 0,
        }}
      >×</button>
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
