import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, formatLongDate, daysUntil } from '@/lib/utils'
import Card, { CardHeader } from '@/components/ui/Card'
import BulkReminderButton from '@/components/dashboard/BulkReminderButton'
import { getDashboardData } from '@/lib/data/dashboard'
import type { SubWithMember, DashboardData } from '@/types'

export default async function DashboardPage() {
  const stats = await getDashboardData()
  if (!stats) redirect('/login')

  const expiringSoon = stats.expiring_soon
  const overdue = stats.overdue
  const pending = stats.pending_signups
  const alertCount = expiringSoon.length + overdue.length + pending.length

  return (
    <div className="dash-page fade-up">

      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '6px',
          }}>
            {formatLongDate()}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '44px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}>OVERVIEW</h1>
        </div>
        <Link href="/members/new" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          background: 'var(--accent)',
          color: '#fff',
          borderRadius: 'var(--radius-sm)',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 0 20px var(--accent-a25)',
          transition: 'box-shadow 0.2s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Member
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        <StatCard
          label="Active Members"
          value={stats.total_active}
          color="var(--accent)"
          accent
          icon={<UsersIcon />}
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(stats.revenue_this_month)}
          color="var(--text-primary)"
          isString
          icon={<RevenueIcon />}
        />
        <StatCard
          label="Expiring Soon"
          value={expiringSoon.length}
          color={expiringSoon.length > 0 ? 'var(--warning)' : 'var(--text-muted)'}
          icon={<ClockIcon />}
        />
        <StatCard
          label="Overdue"
          value={overdue.length}
          color={overdue.length > 0 ? 'var(--danger)' : 'var(--text-muted)'}
          icon={<AlertIcon />}
        />
      </div>

      {/* Action Required */}
      {alertCount > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '3px', height: '20px',
                background: 'var(--accent)',
                borderRadius: '2px',
              }} />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.06em',
              }}>ACTION REQUIRED</span>
              <span style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '2px 9px',
              }}>{alertCount}</span>
            </div>
            {(overdue.length > 0 || expiringSoon.length > 0) && (
              <BulkReminderButton overdue={overdue} expiring={expiringSoon} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {overdue.length > 0 && (
              <AlertCard
                title="OVERDUE"
                color="var(--danger)"
                borderColor="var(--danger-a30)"
                bgColor="var(--danger-a04)"
                subs={overdue}
                type="overdue"
              />
            )}
            {expiringSoon.length > 0 && (
              <AlertCard
                title="EXPIRING SOON"
                color="var(--warning)"
                borderColor="var(--warning-a30)"
                bgColor="var(--warning-a04)"
                subs={expiringSoon}
                type="expiring"
              />
            )}
            {pending.length > 0 && (
              <PendingSignupsCard members={pending} />
            )}
          </div>
        </div>
      )}

      {alertCount === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px 32px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'var(--success-a10)',
            border: '1px solid var(--success-a20)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}>ALL CLEAR</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '280px' }}>
            No overdue payments, no expiring memberships, no pending signups.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, isString, accent, icon }: {
  label: string
  value: number | string
  color: string
  isString?: boolean
  accent?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div style={{
      background: accent ? 'linear-gradient(135deg, var(--accent-a12) 0%, var(--accent-a04) 100%)' : 'var(--bg-surface)',
      border: accent ? '1px solid var(--accent-a20)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '22px 24px',
      boxShadow: accent ? '0 0 24px var(--accent-a08)' : 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {accent && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--accent) 0%, transparent 100%)',
        }} />
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}>{label}</span>
        <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: isString ? '30px' : '54px',
        fontWeight: 800,
        color,
        lineHeight: 1,
        letterSpacing: isString ? '0.01em' : '-0.02em',
      }}>
        {value}
      </div>
    </div>
  )
}

function AlertCard({ title, color, borderColor, bgColor, subs, type }: {
  title: string
  color: string
  borderColor: string
  bgColor: string
  subs: SubWithMember[]
  type: 'overdue' | 'expiring'
}) {
  return (
    <Card style={{ borderColor, background: bgColor }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 700,
            color,
            letterSpacing: '0.1em',
          }}>{title}</span>
        </div>
        <span style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>{subs.length} member{subs.length !== 1 ? 's' : ''}</span>
      </CardHeader>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {subs.map(s => {
          const m = s.member
          const days = daysUntil(s.end_date)
          return (
            <Link key={s.id} href={`/members/${m?.id}`} className="row-hover" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                  }}>
                    {m?.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>{m?.full_name ?? '—'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', marginTop: '1px' }}>
                      {s.membership_plan?.name ?? 'No plan'} · {m?.phone ?? '—'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    color,
                    fontWeight: 700,
                    fontSize: '12px',
                    background: type === 'overdue' ? 'var(--danger-a10)' : 'var(--warning-a10)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {type === 'overdue'
                      ? `${Math.abs(days)}d overdue`
                      : days === 0 ? 'Today' : `${days}d left`}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                    {formatDate(s.end_date)}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </Card>
  )
}

function PendingSignupsCard({ members }: { members: DashboardData['pending_signups'] }) {
  return (
    <Card style={{ borderColor: 'var(--warning-a30)', background: 'var(--warning-a04)' }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--warning)',
            letterSpacing: '0.1em',
          }}>PENDING SIGNUPS</span>
        </div>
        <Link href="/pending-signups" style={{
          color: 'var(--accent)',
          fontSize: '12px',
          textDecoration: 'none',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </CardHeader>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {members.map(m => (
          <Link key={m.id} href={`/members/${m.id}`} className="row-hover" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: 'var(--warning-a10)',
                  border: '1px solid var(--warning-a20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--warning)',
                  flexShrink: 0,
                }}>
                  {m.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>{m.full_name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', marginTop: '1px' }}>
                    {m.phone ?? m.email ?? '—'}
                  </div>
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{formatDate(m.created_at)}</div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}

// Icons
function UsersIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function RevenueIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function AlertIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
