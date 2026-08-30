'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MembershipPlan } from '@/types'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function PlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/plans')
      .then(r => r.json())
      .then(d => { setPlans(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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
              <Card key={plan.id}>
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
                  }}>
                    {plan.duration_days} days · {plan.duration_days >= 365 ? `${Math.round(plan.duration_days / 365)} year${Math.round(plan.duration_days / 365) > 1 ? 's' : ''}` : `${Math.round(plan.duration_days / 30)} months`}
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
