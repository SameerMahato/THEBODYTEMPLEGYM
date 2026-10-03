import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import PlanCard from '@/components/plans/PlanCard'
import { getPlans } from '@/lib/data/plans'

export default async function PlansPage() {
  const plans = await getPlans()
  if (!plans) redirect('/login')

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
        {plans.length === 0 ? (
          <Card style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No plans yet.</p>
            <Link href="/plans/new"><Button>Create First Plan</Button></Link>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '16px' }}>
            {plans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        )}
      </div>
    </div>
  )
}
