import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency, daysUntil, addDaysISO, gymToday, membershipStatus, PAYMENT_METHOD_LABELS } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import {
  RecordPaymentButton, RenewIcon, WhatsAppButton, MemberStatusButton,
} from '@/components/members/MemberActionButtons'
import { getMemberDetail } from '@/lib/data/members'
import { getPlans } from '@/lib/data/plans'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Plans are needed the instant the payment modal opens; loading them here
  // (concurrently) means the modal no longer fetches on open.
  const [member, plans] = await Promise.all([getMemberDetail(id), getPlans()])
  if (!member) notFound()

  const currentSub = member.member_subscription?.find(s => s.is_current)
  const days = currentSub ? daysUntil(currentSub.end_date) : null
  const displayStatus = membershipStatus(member.status, currentSub?.end_date)

  const originalPayments = member.payments.filter(p => p.type === 'payment')

  // A renewal picks up the day after the current subscription ends, so the
  // periods neither overlap nor leave a gap.
  const renewalStartDate = currentSub
    ? addDaysISO(currentSub.end_date, 1)
    : gymToday()

  const canRenew = displayStatus === 'active' || displayStatus === 'expiring' || displayStatus === 'overdue'

  return (
    <div>
      <PageHeader
        title={member.full_name.toUpperCase()}
        subtitle={`Member since ${formatDate(member.join_date)}`}
        action={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <RecordPaymentButton
              memberId={id}
              memberName={member.full_name}
              plans={plans ?? []}
              label="+ Record Payment"
            />
            {canRenew && (
              <RecordPaymentButton
                memberId={id}
                memberName={member.full_name}
                plans={plans ?? []}
                label="Renew Plan"
                variant="secondary"
                renewalStartDate={renewalStartDate}
                icon={<RenewIcon />}
              />
            )}
            {member.phone && (
              <WhatsAppButton
                memberName={member.full_name}
                phone={member.phone}
                planName={currentSub?.membership_plan?.name}
                daysRemaining={days}
              />
            )}
            <Link href={`/members/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <MemberStatusButton memberId={id} status={member.status} />
          </div>
        }
      />

      <div className="member-detail-grid">
        {/* Left column: Member info + Current plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <Card>
            <CardHeader>
              <span style={sectionTitle}>PERSONAL INFO</span>
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

          <Card>
            <CardHeader>
              <span style={sectionTitle}>CURRENT PLAN</span>
            </CardHeader>
            <CardBody>
              {currentSub ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--accent)' }}>
                    {currentSub.membership_plan?.name ?? '—'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {currentSub.membership_plan
                      ? `${formatCurrency(currentSub.membership_plan.price)} · ${currentSub.membership_plan.duration_days} days`
                      : '—'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <InfoRow label="Start" value={formatDate(currentSub.start_date)} />
                    <InfoRow label="End" value={formatDate(currentSub.end_date)} />
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>No active plan</p>
                  <RecordPaymentButton
                    memberId={id}
                    memberName={member.full_name}
                    plans={plans ?? []}
                    label="Assign Plan"
                    size="sm"
                  />
                </div>
              )}
            </CardBody>
          </Card>

          {member.notes && (
            <Card>
              <CardHeader><span style={sectionTitle}>NOTES</span></CardHeader>
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
              <span style={sectionTitle}>PAYMENT HISTORY</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{originalPayments.length} payments</span>
            </CardHeader>

            {member.payments.length === 0 ? (
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
                    {member.payments.map(p => {
                      const isAdj = p.type === 'adjustment'
                      return (
                        <tr key={p.id} style={isAdj ? { background: 'var(--danger-alt-a05)' } : {}}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {isAdj && <span style={{ color: 'var(--danger)', fontSize: '10px', fontWeight: 700, marginRight: '4px' }}>ADJ</span>}
                            {formatDate(p.payment_date)}
                          </td>
                          <td style={{ fontWeight: 600, color: isAdj ? 'var(--danger)' : 'var(--accent)' }}>
                            {isAdj ? '−' : ''}{formatCurrency(Math.abs(p.amount))}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {PAYMENT_METHOD_LABELS[p.payment_method]}
                            {p.reference && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace', marginTop: '2px' }}>
                                {p.reference}
                              </div>
                            )}
                          </td>
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

          {member.member_subscription.length > 1 && (
            <Card style={{ marginTop: '16px' }}>
              <CardHeader><span style={sectionTitle}>PLAN HISTORY</span></CardHeader>
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
                    {[...member.member_subscription]
                      .sort((a, b) => b.start_date.localeCompare(a.start_date))
                      .map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 500 }}>{s.membership_plan?.name ?? '—'}</td>
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
    </div>
  )
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--text-secondary)',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}
