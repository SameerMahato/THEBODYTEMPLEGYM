'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MembershipPlan } from '@/types'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

function durationLabel(days: number): string {
  if (days >= 365) {
    const years = Math.round(days / 365)
    return `${years} year${years !== 1 ? 's' : ''}`
  }
  const months = Math.round(days / 30)
  return `${months} month${months !== 1 ? 's' : ''}`
}

export default function PlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [deactivating, setDeactivating] = useState<string | null>(null)

  function loadPlans() {
    fetch('/api/plans')
      .then(r => {
        if (!r.ok) {
          if (r.status === 401) { window.location.href = '/login'; return null }
          return null
        }
        return r.json()
      })
      .then(d => { if (d) { setPlans(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadPlans() }, [])

  async function handleDeactivate(plan: MembershipPlan) {
    if (!confirm(`Deactivate "${plan.name}"? It will no longer appear in payment forms.`)) return
    setDeactivating(plan.id)
    await fetch(`/api/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    setDeactivating(null)
    loadPlans()
  }

  return (
    <div>
      <PageHeader
        title="MEMBERSHIP PLANS"
        subtitle="Manage plan types and pricing"
        action={
          <Link href="/plans/new">
            <Button>+ New Plan</Button>
          </Link>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : plans.length === 0 ? (
          <Card style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No plans yet.</p>
            <Link href="/plans/new"><Button>Create First Plan</Button></Link>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {plans.map(plan => (
              <Card key={plan.id} style={{ transition: 'border-color 0.15s' }}>
                <div style={{ padding: '24px', cursor: 'default' }}>
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
                      loading={deactivating === plan.id}
                      onClick={() => handleDeactivate(plan)}
                      style={{ fontSize: '12px', padding: '7px 12px' }}
                    >
                      Deactivate
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
