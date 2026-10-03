import { redirect } from 'next/navigation'
import { getStaffContext } from '@/lib/auth'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // pendingCount arrives with the context — it used to be a second round
  // trip here, which every dashboard page paid before rendering anything.
  const ctx = await getStaffContext()
  if (!ctx) redirect('/login')

  return (
    <DashboardShell pendingCount={ctx.pendingCount}>
      {children}
    </DashboardShell>
  )
}
