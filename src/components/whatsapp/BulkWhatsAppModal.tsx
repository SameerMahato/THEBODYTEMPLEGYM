'use client'

import { useState } from 'react'
import { daysUntil } from '@/lib/utils'

interface SubWithMember {
  id: string
  end_date: string
  membership_plan: { name: string } | null
  member: { id: string; full_name: string; phone: string | null; status: string } | null
}

interface Props {
  overdue: SubWithMember[]
  expiring: SubWithMember[]
  onClose: () => void
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.startsWith('+')) return digits
  if (digits.length === 10) return `91${digits}`
  return digits
}

function buildMessage(name: string, plan: string | undefined, days: number, type: 'overdue' | 'expiring'): string {
  if (type === 'overdue') {
    return `Hi ${name},\n\nYour *Body Temple Gym* membership has expired. We'd love to have you back! 🏋️\n\nPlease visit the front desk to renew and continue your fitness journey.\n\n— Body Temple Gym`
  }
  return `Hi ${name}! 👋\n\nYour *${plan ?? 'membership'}* at *Body Temple Gym* ${days === 0 ? 'expires *today*' : `expires in *${days} day${days !== 1 ? 's' : ''}*`}.\n\nRenew now to keep your streak going! 💪\n\n— Body Temple Gym`
}

function openWhatsApp(phone: string, message: string) {
  window.open(`https://wa.me/${formatPhone(phone)}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}

export default function BulkWhatsAppModal({ overdue, expiring, onClose }: Props) {
  const allItems = [
    ...overdue.map(s => ({ ...s, type: 'overdue' as const })),
    ...expiring.map(s => ({ ...s, type: 'expiring' as const })),
  ].filter(s => s.member)

  const withPhone = allItems.filter(s => s.member?.phone)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  const sentCount = sent.size
  const totalWithPhone = withPhone.length

  function sendOne(s: typeof allItems[number]) {
    if (!s.member?.phone) return
    const days = daysUntil(s.end_date)
    const msg = buildMessage(s.member.full_name, s.membership_plan?.name, days, s.type)
    openWhatsApp(s.member.phone, msg)
    setSent(prev => new Set([...prev, s.id]))
  }

  function sendAll() {
    if (sending) return
    setSending(true)
    withPhone.forEach((s, i) => {
      setTimeout(() => {
        sendOne(s)
        if (i === withPhone.length - 1) setSending(false)
      }, i * 600)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: 'rgba(37,211,102,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                BULK REMINDERS
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {allItems.length} members need attention · {totalWithPhone} have WhatsApp
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        {/* Progress + Send All */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
          gap: '16px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Progress
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: sentCount === totalWithPhone && totalWithPhone > 0 ? '#25D366' : 'var(--text-secondary)' }}>
                {sentCount} / {totalWithPhone} sent
              </span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${totalWithPhone > 0 ? (sentCount / totalWithPhone) * 100 : 0}%`,
                background: '#25D366',
                borderRadius: '2px',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
          <button
            onClick={sendAll}
            disabled={totalWithPhone === 0 || sentCount === totalWithPhone || sending}
            style={{
              padding: '8px 16px',
              background: sentCount === totalWithPhone ? 'rgba(37,211,102,0.1)' : '#25D366',
              color: sentCount === totalWithPhone ? '#25D366' : '#fff',
              border: sentCount === totalWithPhone ? '1px solid #25D366' : 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: totalWithPhone === 0 || sentCount === totalWithPhone ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {sentCount === totalWithPhone && totalWithPhone > 0 ? (
              <>✓ All Sent</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send All
              </>
            )}
          </button>
        </div>

        {/* Member list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {allItems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No members need reminders right now.
            </div>
          ) : (
            allItems.map(s => {
              const m = s.member!
              const days = daysUntil(s.end_date)
              const hasPhone = !!m.phone
              const isSent = sent.has(s.id)
              const isOverdue = s.type === 'overdue'

              return (
                <div key={s.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 24px',
                  borderBottom: '1px solid var(--border)',
                  opacity: hasPhone ? 1 : 0.45,
                  background: isSent ? 'rgba(37,211,102,0.04)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: isOverdue ? 'rgba(255,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${isOverdue ? 'rgba(255,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: isOverdue ? 'var(--danger)' : 'var(--warning)',
                    flexShrink: 0,
                  }}>
                    {m.full_name[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.full_name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        color: isOverdue ? 'var(--danger)' : 'var(--warning)',
                        fontWeight: 600,
                        fontSize: '11px',
                      }}>
                        {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d left`}
                      </span>
                      <span>·</span>
                      <span>{s.membership_plan?.name ?? '—'}</span>
                      {m.phone ? (
                        <><span>·</span><span style={{ color: 'var(--text-muted)' }}>{m.phone}</span></>
                      ) : (
                        <><span>·</span><span style={{ color: 'var(--danger)', fontSize: '10px' }}>No phone</span></>
                      )}
                    </div>
                  </div>

                  {/* Send button */}
                  {isSent ? (
                    <div style={{
                      width: '80px',
                      padding: '7px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      color: '#25D366',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Sent
                    </div>
                  ) : (
                    <button
                      onClick={() => sendOne(s)}
                      disabled={!hasPhone}
                      style={{
                        width: '80px',
                        padding: '7px 0',
                        background: hasPhone ? '#25D366' : 'var(--bg-elevated)',
                        color: hasPhone ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-body)',
                        cursor: hasPhone ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0,
          background: 'var(--bg-elevated)',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px',
            background: 'transparent',
            border: '1px solid var(--border-strong)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
