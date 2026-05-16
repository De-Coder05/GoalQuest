'use client';
import { useState } from 'react';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      if (format === 'csv') {
        if (!data.length) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((r: any) => Object.values(r).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'achievement_report.csv'; a.click();
      }
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><div><h2>Reports</h2><p>Export achievement and completion reports</p></div></div>
      <div className="grid-2">
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => handleExport('csv')}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
          <h3 className="card-title">Achievement Report</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>Planned vs Actual achievement for all employees. Export as CSV.</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} disabled={loading}>{loading ? 'Exporting...' : '⬇ Download CSV'}</button>
        </div>
        <div className="card">
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
          <h3 className="card-title">Completion Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>Real-time view of quarterly check-in completion status across the organization.</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => window.location.href = '/dashboard/analytics'}>View Analytics →</button>
        </div>
      </div>
    </div>
  );
}
