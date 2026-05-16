'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [goals, setGoals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, locked: 0, submitted: 0, draft: 0 });

  useEffect(() => {
    const view = user?.role === 'ADMIN' ? 'all' : user?.role === 'MANAGER' ? 'team' : 'my';
    fetch(`/api/goals?view=${view}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGoals(data);
          setStats({
            total: data.length,
            locked: data.filter((g: any) => g.status === 'LOCKED').length,
            submitted: data.filter((g: any) => g.status === 'SUBMITTED').length,
            draft: data.filter((g: any) => g.status === 'DRAFT').length,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const avgScore = () => {
    const locked = goals.filter(g => g.status === 'LOCKED' && g.achievements?.length > 0);
    if (!locked.length) return 0;
    const total = locked.reduce((s, g) => s + (g.achievements?.reduce((a: number, ac: any) => a + ac.score, 0) || 0) / (g.achievements?.length || 1), 0);
    return Math.round(total / locked.length);
  };

  const statCards = [
    { icon: '🎯', label: 'Total Goals', value: stats.total, color: 'rgba(59,130,246,0.15)' },
    { icon: '🔒', label: 'Locked & Active', value: stats.locked, color: 'rgba(139,92,246,0.15)' },
    { icon: '📝', label: 'Pending Review', value: stats.submitted, color: 'rgba(245,158,11,0.15)' },
    { icon: '📊', label: 'Avg. Score', value: `${avgScore()}%`, color: 'rgba(16,185,129,0.15)' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p>Here&apos;s your {user?.role === 'ADMIN' ? 'organization' : user?.role === 'MANAGER' ? 'team' : 'goal'} overview</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Goals</h3>
        </div>
        {goals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No goals yet</h3>
            <p>Start by creating your first goal for this cycle.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {(user?.role !== 'EMPLOYEE') && <th>Employee</th>}
                  <th>Goal Title</th>
                  <th>Thrust Area</th>
                  <th>UoM</th>
                  <th>Target</th>
                  <th>Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {goals.slice(0, 10).map(g => (
                  <tr key={g.id}>
                    {(user?.role !== 'EMPLOYEE') && <td>{g.user?.name}</td>}
                    <td style={{ fontWeight: 500 }}>{g.title}</td>
                    <td>{g.thrustArea}</td>
                    <td><span className="badge badge-draft">{g.uomType.replace('_', ' ')}</span></td>
                    <td>{g.target}</td>
                    <td>{g.weightage}%</td>
                    <td><span className={`badge badge-${g.status.toLowerCase()}`}>{g.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
