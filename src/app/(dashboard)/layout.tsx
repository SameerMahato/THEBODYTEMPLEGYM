import { redirect } from 'next/navigation'
import { getStaffContext } from '@/lib/auth'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getStaffContext()
  if (!ctx) redirect('/login')

  const { data: pendingCount } = await ctx.supabase.rpc('get_pending_count')

  return (
    <DashboardShell pendingCount={pendingCount ?? 0}>
      {children}
    </DashboardShell>
  )
}
