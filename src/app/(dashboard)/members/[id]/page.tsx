'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Member, MemberSubscription, Payment, MembershipPlan } from '@/types'
import { formatDate, formatCurrency, daysUntil, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import RecordPaymentModal from '@/components/payments/RecordPaymentModal'
import WhatsAppModal from '@/components/whatsapp/WhatsAppModal'

interface MemberDetail extends Member {
  member_subscription: (MemberSubscription & { membership_plan: MembershipPlan })[]
  payments: (Payment & { staff_user: { full_name: string } })[]
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  function load() {
    fetch(`/api/members/${id}`)
      .then(r => r.json())
      .then(d => { setMember(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function handleDeactivate() {
    if (!confirm('Mark this member as inactive?')) return
    setDeactivating(true)
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    })
    load()
    setDeactivating(false)
  }

  async function handleActivate() {
    await fetch(`/api/members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    load()
  }

  if (loading) return (
    <div style={{ padding: '40px 32px', color: 'var(--text-muted)' }}>Loading member...</div>
  )

  if (!member) return (
    <div style={{ padding: '40px 32px', color: 'var(--danger)' }}>Member not found.</div>
  )

  const currentSub = member.member_subscription?.find(s => s.is_current)
  const days = currentSub ? daysUntil(currentSub.end_date) : null
  const displayStatus = member.status === 'pending' ? 'pending'
    : member.status === 'inactive' ? 'inactive'
    : days !== null && days < 0 ? 'overdue'
    : days !== null && days <= 7 ? 'expiring'
    : 'active'

  const originalPayments = member.payments?.filter(p => p.type === 'payment') ?? []
  const adjustments = member.payments?.filter(p => p.type === 'adjustment') ?? []

  return (
    <div>
      <PageHeader
        title={member.full_name.toUpperCase()}
        subtitle={`Member since ${formatDate(member.join_date)}`}
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="primary" onClick={() => setShowPaymentModal(true)}>
              + Record Payment
            </Button>
            {member.phone && (
              <Button variant="secondary" onClick={() => setShowWhatsAppModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
            )}
            <Link href={`/members/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            {member.status === 'active' ? (
              <Button variant="danger" loading={deactivating} onClick={handleDeactivate}>
                Deactivate
              </Button>
            ) : member.status === 'inactive' ? (
              <Button variant="secondary" onClick={handleActivate}>Reactivate</Button>
            ) : null}
          </div>
        }
      />

      <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', maxWidth: '1200px' }}>
        {/* Left column: Member info + Current plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status */}
          <Card>
            <CardBody style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <StatusBadge status={displayStatus} />
              {currentSub && (
                <span style={{
                  color: displayStatus === 'overdue' ? 'var(--danger)' : displayStatus === 'expiring' ? 'var(--warning)' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}>
                  {days !== null && days < 0 ? `${Math.abs(days)} days overdue`
                    : days === 0 ? 'Expires today'
                    : `${days} days remaining`}
                </span>
              )}
            </CardBody>
          </Card>

          {/* Personal info */}
          <Card>
            <CardHeader>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                PERSONAL INFO
              </span>
            </CardHeader>
            <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <InfoRow label="Phone" value={member.phone ?? '—'} />
              <InfoRow label="Email" value={member.email ?? '—'} />
              <InfoRow label="Date of Birth" value={member.date_of_birth ? formatDate(member.date_of_birth) : '—'} />
              <InfoRow label="Emergency Contact" value={
                member.emergency_contact_name
                  ? `${member.emergency_contact_name}${member.emergency_contact_phone ? ` · ${member.emergency_contact_phone}` : ''}`
                  : '—'
              } />
            </CardBody>
          </Card>

          {/* Current plan */}
          <Card>
            <CardHeader>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                CURRENT PLAN
              </span>
            </CardHeader>
            <CardBody>
              {currentSub ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>
                    {currentSub.membership_plan.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatCurrency(currentSub.membership_plan.price)} · {currentSub.membership_plan.duration_days} days
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <InfoRow label="Start" value={formatDate(currentSub.start_date)} />
                    <InfoRow label="End" value={formatDate(currentSub.end_date)} />
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>No active plan</p>
                  <Button size="sm" onClick={() => setShowPaymentModal(true)}>Assign Plan</Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          {member.notes && (
            <Card>
              <CardHeader>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>NOTES</span>
              </CardHeader>
              <CardBody>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>{member.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right column: Payment history */}
        <div>
          <Card>
            <CardHeader>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                PAYMENT HISTORY
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{originalPayments.length} payments</span>
            </CardHeader>

            {member.payments?.length === 0 ? (
              <CardBody>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No payment records yet.</p>
              </CardBody>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Period</th>
                      <th>Recorded By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {member.payments?.map(p => {
                      const isAdj = p.type === 'adjustment'
                      return (
                        <tr key={p.id} style={isAdj ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {isAdj && <span style={{ color: 'var(--danger)', fontSize: '10px', fontWeight: 700, marginRight: '4px' }}>ADJ</span>}
                            {formatDate(p.payment_date)}
                          </td>
                          <td style={{ fontWeight: 600, color: isAdj ? 'var(--danger)' : 'var(--accent)' }}>
                            {isAdj ? '−' : ''}{formatCurrency(Math.abs(p.amount))}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{PAYMENT_METHOD_LABELS[p.payment_method]}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {p.period_start && p.period_end
                              ? `${formatDate(p.period_start)} – ${formatDate(p.period_end)}`
                              : '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {p.staff_user?.full_name ?? '—'}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '180px' }}>
                            {isAdj ? (
                              <span style={{ color: 'var(--danger)' }}>Adj: {p.reason}</span>
                            ) : p.notes ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Subscription history */}
          {member.member_subscription?.length > 1 && (
            <Card style={{ marginTop: '16px' }}>
              <CardHeader>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                  PLAN HISTORY
                </span>
              </CardHeader>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...member.member_subscription].sort((a,b) => b.start_date.localeCompare(a.start_date)).map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.membership_plan.name}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{formatDate(s.start_date)}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{formatDate(s.end_date)}</td>
                        <td>
                          {s.is_current
                            ? <span style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: 700 }}>CURRENT</span>
                            : <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Past</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <RecordPaymentModal
          memberId={id}
          memberName={member.full_name}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { setShowPaymentModal(false); load() }}
        />
      )}

      {showWhatsAppModal && member.phone && (
        <WhatsAppModal
          memberName={member.full_name}
          phone={member.phone}
          planName={currentSub?.membership_plan.name}
          daysRemaining={days}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
