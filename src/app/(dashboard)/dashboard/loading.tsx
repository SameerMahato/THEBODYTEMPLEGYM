export default function DashboardLoading() {
  return (
    <div className="dash-page">
      <div className="skeleton" style={{ height: '14px', width: '180px', marginBottom: '10px' }} />
      <div className="skeleton" style={{ height: '44px', width: '240px', marginBottom: '32px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '110px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    </div>
  )
}
