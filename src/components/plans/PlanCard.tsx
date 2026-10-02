'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MembershipPlan } from '@/types'
import { formatCurrency } from '@/lib/utils'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function durationLabel(days: number): string {
  if (days >= 365) {
    const years = Math.round(days / 365)
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  const months = Math.round(days / 30)
  return `${months} month${months !== 1 ? 's' : ''}`
}

export default function PlanCard({ plan }: { plan: MembershipPlan }) {
  const router = useRouter()
  const [deactivating, setDeactivating] = useState(false)

  async function handleDeactivate() {
    if (!confirm(`Deactivate "${plan.name}"? It will no longer appear in payment forms.`)) return
    setDeactivating(true)
    await fetch(`/api/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    setDeactivating(false)
    router.refresh()
  }

  return (
    <Card>
      <div style={{ padding: '24px' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
          letterSpacing: '0.02em',
        }}>
          {plan.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--accent)',
          lineHeight: 1.1,
          marginBottom: '12px',
        }}>
          {formatCurrency(plan.price)}
        </div>
        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          marginBottom: '16px',
        }}>
          {plan.duration_days} days · {durationLabel(plan.duration_days)}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/plans/${plan.id}/edit`} style={{ flex: 1 }}>
            <Button variant="secondary" style={{ width: '100%', fontSize: '12px', padding: '7px 12px' }}>
              Edit
            </Button>
          </Link>
          <Button
            variant="danger"
            loading={deactivating}
            onClick={handleDeactivate}
            style={{ fontSize: '12px', padding: '7px 12px' }}
          >
            Deactivate
          </Button>
        </div>
      </div>
    </Card>
  )
}
