import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import PaymentsTable from '@/components/payments/PaymentsTable'
import { getPayments } from '@/lib/data/payments'

export default async function PaymentsPage() {
  const initial = await getPayments({})
  if (!initial) redirect('/login')

  return (
    <div>
      <PageHeader
        title="PAYMENTS"
        subtitle="All payment records and adjustments"
      />
      <PaymentsTable initial={initial} />
    </div>
  )
}
