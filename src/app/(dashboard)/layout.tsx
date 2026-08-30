import Sidebar from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: '256px',
        background: 'var(--bg-base)',
        minHeight: '100vh',
        minWidth: 0,
        overflowX: 'auto',
      }}>
        {children}
      </main>
    </div>
  )
}
