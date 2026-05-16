'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetch('/api/analytics').then(r => r.json()).then(setData).catch(() => {}); }, []);

  if (!data) return <div className="loading"><div className="spinner"></div></div>;

  const statusColors: Record<string, string> = { DRAFT: '#94a3b8', SUBMITTED: '#60a5fa', APPROVED: '#34d399', LOCKED: '#a78bfa', RETURNED: '#f87171' };

  return (
    <div>
      <div className="page-header"><div><h2>Analytics</h2><p>Organization performance insights</p></div></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>👥</div><div className="stat-value">{data.summary.totalUsers}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>🎯</div><div className="stat-value">{data.summary.totalGoals}</div><div className="stat-label">Total Goals</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🔒</div><div className="stat-value">{data.summary.lockedGoals}</div><div className="stat-label">Active (Locked)</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(236,72,153,0.15)' }}>📈</div><div className="stat-value">{data.summary.completionRate}%</div><div className="stat-label">Completion Rate</div></div>
      </div>

      <div className="grid-2">
        <div className="chart-container">
          <h3>Goal Status Distribution</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(data.statusDistribution).map(([status, count]) => (
              <div key={status} style={{ flex: '1', minWidth: '100px', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: statusColors[status], margin: '0 auto 8px' }}></div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>{count as number}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>{status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3>Thrust Area Distribution</h3>
          {Object.entries(data.thrustAreas).map(([area, count]) => (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', minWidth: '160px', color: 'var(--text-secondary)' }}>{area}</span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${((count as number) / data.summary.totalGoals) * 100}%` }}></div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '24px' }}>{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="chart-container">
          <h3>Department Performance</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Department</th><th>Goals</th><th>Locked</th><th>With Updates</th></tr></thead>
              <tbody>
                {Object.entries(data.departments).map(([dept, info]: [string, any]) => (
                  <tr key={dept}><td style={{ fontWeight: 500 }}>{dept}</td><td>{info.total}</td><td>{info.locked}</td><td>{info.withAchievements}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-container">
          <h3>Manager Effectiveness</h3>
          {data.managerEffectiveness.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No data yet</p> : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Manager</th><th>Team</th><th>Goals</th><th>Checked-in</th><th>Rate</th></tr></thead>
                <tbody>
                  {data.managerEffectiveness.map((m: any) => (
                    <tr key={m.name}><td style={{ fontWeight: 500 }}>{m.name}</td><td>{m.teamSize}</td><td>{m.totalGoals}</td><td>{m.checkedInGoals}</td><td><span className={`badge ${m.completionRate >= 80 ? 'badge-completed' : m.completionRate >= 50 ? 'badge-on-track' : 'badge-not-started'}`}>{m.completionRate}%</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
