'use client'
import { appConfig } from '@/config/app'

import { useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'

interface Props {
  memberName: string
  phone: string
  planName?: string
  daysRemaining?: number | null
  onClose: () => void
}

const TEMPLATES = (name: string, plan?: string, days?: number | null) => [
  {
    id: 'renewal',
    label: 'Renewal Reminder',
    icon: '🔔',
    message: `Hi ${name}! 👋\n\nYour *${plan ?? 'membership'}* at *${appConfig.brand.name}* ${days != null && days > 0 ? `expires in *${days} day${days !== 1 ? 's' : ''}*` : 'is expiring soon'}.\n\nRenew now to keep your fitness streak going! 💪\n\nContact us or visit the front desk to renew.\n\n— ${appConfig.brand.name}`,
  },
  {
    id: 'overdue',
    label: 'Overdue Notice',
    icon: '⚠️',
    message: `Hi ${name},\n\nYour *${appConfig.brand.name}* membership has expired. We'd love to have you back! 🏋️\n\nPlease visit the front desk or contact us to renew your membership and continue your fitness journey.\n\n— ${appConfig.brand.name}`,
  },
  {
    id: 'welcome',
    label: 'Welcome',
    icon: '🎉',
    message: `Welcome to *${appConfig.brand.name}*, ${name}! 🎉\n\nWe're thrilled to have you join our family. Your fitness journey starts today! 💪\n\nIf you need anything, our staff is always here to help. See you at the gym!\n\n— ${appConfig.brand.name}`,
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '✏️',
    message: '',
  },
]

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (raw.startsWith('+')) return digits
  if (digits.length === 10) return `91${digits}`
  return digits
}

export default function WhatsAppModal({ memberName, phone, planName, daysRemaining, onClose }: Props) {
  const templates = TEMPLATES(memberName, planName, daysRemaining)
  const [selected, setSelected] = useState('renewal')
  const [message, setMessage] = useState(templates[0].message)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    function trap(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }

    first?.focus()
    document.addEventListener('keydown', trap)
    return () => document.removeEventListener('keydown', trap)
  }, [onClose])

  function pickTemplate(id: string) {
    setSelected(id)
    const tpl = templates.find(t => t.id === id)
    if (tpl && id !== 'custom') setMessage(tpl.message)
    if (id === 'custom') setMessage('')
  }

  function openWhatsApp() {
    const formatted = formatPhone(phone)
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'var(--scrim-modal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: 'var(--whatsapp-a15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--whatsapp)">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                SEND WHATSAPP
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                {memberName} · {phone}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Template picker */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Message Template
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTemplate(t.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${selected === t.id ? 'var(--whatsapp)' : 'var(--border)'}`,
                    background: selected === t.id ? 'var(--whatsapp-a08)' : 'transparent',
                    color: selected === t.id ? 'var(--whatsapp)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message editor */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Message Preview
              <span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '8px', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                (editable · *bold* supported)
              </span>
            </div>
            <textarea
              id="whatsapp-message"
              value={message}
              onChange={e => { setMessage(e.target.value); setSelected('custom') }}
              rows={8}
              style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.6 }}
              placeholder="Type your message..."
            />
          </div>

          {/* Phone info */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            Will send to: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>+{formatPhone(phone)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(opens WhatsApp on your device)</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openWhatsApp}
              disabled={!message.trim()}
              style={{
                flex: 1,
                padding: '11px 20px',
                background: message.trim() ? 'var(--whatsapp)' : 'var(--bg-elevated)',
                color: message.trim() ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s',
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Open WhatsApp
            </button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
