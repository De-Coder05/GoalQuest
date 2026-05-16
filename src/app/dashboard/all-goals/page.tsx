'use client';
import { useEffect, useState, useCallback } from 'react';

export default function AllGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const fetchGoals = useCallback(async () => {
    const url = selectedCycle ? `/api/goals?view=all&cycleId=${selectedCycle}` : '/api/goals?view=all';
    const res = await fetch(url);
    if (res.ok) setGoals(await res.json());
  }, [selectedCycle]);

  useEffect(() => { fetch('/api/cycles').then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) { setCycles(d); setSelectedCycle(d[0].id); } }); }, []);
  useEffect(() => { if (selectedCycle) fetchGoals(); }, [selectedCycle, fetchGoals]);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleUnlock = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'DRAFT' }) });
    if (res.ok) { fetchGoals(); showToast('Goal unlocked'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>All Goals</h2><p>Organization-wide goal overview</p></div>
        <div className="header-actions">
          {cycles.length > 0 && <select className="form-select" style={{ width: '200px' }} value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}>{cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>📊</div><div className="stat-value">{goals.length}</div><div className="stat-label">Total Goals</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>🔒</div><div className="stat-value">{goals.filter(g => g.status === 'LOCKED').length}</div><div className="stat-label">Locked</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>📝</div><div className="stat-value">{goals.filter(g => g.status === 'SUBMITTED').length}</div><div className="stat-label">Pending Review</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>✅</div><div className="stat-value">{new Set(goals.map(g => g.userId)).size}</div><div className="stat-label">Employees</div></div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Goal</th><th>Thrust Area</th><th>UoM</th><th>Target</th><th>Weight</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {goals.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 500 }}>{g.user?.name}</td>
                  <td>{g.user?.department}</td>
                  <td>{g.title}</td>
                  <td>{g.thrustArea}</td>
                  <td>{g.uomType.replace('_', ' ')}</td>
                  <td>{g.target}</td>
                  <td>{g.weightage}%</td>
                  <td><span className={`badge badge-${g.status.toLowerCase()}`}>{g.status}</span></td>
                  <td>{g.status === 'LOCKED' && <button className="btn btn-ghost btn-sm" onClick={() => handleUnlock(g.id)}>🔓 Unlock</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✓' : '✗'} {toast.msg}</div>}
    </div>
  );
}
