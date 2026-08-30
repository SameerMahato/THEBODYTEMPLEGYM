'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import { Member } from '@/types'
import Card, { CardHeader } from '@/components/ui/Card'
import BulkWhatsAppModal from '@/components/whatsapp/BulkWhatsAppModal'

interface SubWithMember {
  id: string
  end_date: string
  start_date: string
  is_current: boolean
  membership_plan: { name: string; price: number } | null
  member: { id: string; full_name: string; phone: string | null; email: string | null; status: string } | null
}

interface DashboardData {
  total_active: number
  revenue_this_month: number
  expiring_soon: SubWithMember[]
  overdue: SubWithMember[]
  pending_signups: Member[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBulkWhatsApp, setShowBulkWhatsApp] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  const expiringSoon = stats?.expiring_soon ?? []
  const overdue = stats?.overdue ?? []
  const pending = stats?.pending_signups ?? []
  const alertCount = expiringSoon.length + overdue.length + pending.length

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1400px' }} className="fade-up">

      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
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
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
          boxShadow: '0 0 20px rgba(225,29,72,0.25)',
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
          value={stats?.total_active ?? 0}
          color="var(--accent)"
          accent
          icon={<UsersIcon />}
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(stats?.revenue_this_month ?? 0)}
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
              <button
                onClick={() => setShowBulkWhatsApp(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: 'rgba(37,211,102,0.1)',
                  color: '#25D366',
                  border: '1px solid rgba(37,211,102,0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send Reminders
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {overdue.length > 0 && (
              <AlertCard
                title="OVERDUE"
                color="var(--danger)"
                borderColor="rgba(255,68,68,0.3)"
                bgColor="rgba(255,68,68,0.04)"
                subs={overdue}
                type="overdue"
              />
            )}
            {expiringSoon.length > 0 && (
              <AlertCard
                title="EXPIRING SOON"
                color="var(--warning)"
                borderColor="rgba(245,158,11,0.3)"
                bgColor="rgba(245,158,11,0.04)"
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

      {showBulkWhatsApp && (
        <BulkWhatsAppModal
          overdue={overdue}
          expiring={expiringSoon}
          onClose={() => setShowBulkWhatsApp(false)}
        />
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
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
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
      background: accent ? 'linear-gradient(135deg, rgba(225,29,72,0.12) 0%, rgba(225,29,72,0.04) 100%)' : 'var(--bg-surface)',
      border: accent ? '1px solid rgba(225,29,72,0.2)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '22px 24px',
      boxShadow: accent ? '0 0 24px rgba(225,29,72,0.08)' : 'var(--shadow-sm)',
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
            <Link key={s.id} href={`/members/${m?.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
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
                    background: type === 'overdue' ? 'rgba(255,68,68,0.1)' : 'rgba(245,158,11,0.1)',
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

function PendingSignupsCard({ members }: { members: Member[] }) {
  return (
    <Card style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }}>
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
          <Link key={m.id} href={`/members/${m.id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
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

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ height: '14px', width: '180px', background: 'var(--bg-elevated)', borderRadius: '4px', marginBottom: '10px' }} />
      <div style={{ height: '44px', width: '240px', background: 'var(--bg-elevated)', borderRadius: '4px', marginBottom: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: '110px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    </div>
  )
}

// Icons
import React from 'react'
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
