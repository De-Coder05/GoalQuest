'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

const UOM_OPTIONS = [
  { value: 'MIN_NUMERIC', label: 'Min (Numeric) — Higher is better' },
  { value: 'MIN_PERCENT', label: 'Min (%) — Higher is better' },
  { value: 'MAX_NUMERIC', label: 'Max (Numeric) — Lower is better' },
  { value: 'MAX_PERCENT', label: 'Max (%) — Lower is better' },
  { value: 'TIMELINE', label: 'Timeline — Date-based' },
  { value: 'ZERO', label: 'Zero — Zero = Success' },
];

const THRUST_AREAS = ['Product Development', 'Quality', 'Innovation', 'Efficiency', 'Customer Satisfaction', 'Safety', 'Learning', 'Cost Optimization', 'Revenue Growth', 'Other'];

export default function MyGoalsPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [form, setForm] = useState({ thrustArea: '', title: '', description: '', uomType: 'MIN_NUMERIC', target: '', weightage: '' });

  const fetchGoals = useCallback(async () => {
    const url = selectedCycle ? `/api/goals?view=my&cycleId=${selectedCycle}` : '/api/goals?view=my';
    const res = await fetch(url);
    if (res.ok) setGoals(await res.json());
  }, [selectedCycle]);

  useEffect(() => { fetch('/api/cycles').then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) { setCycles(d); setSelectedCycle(d[0].id); } }); }, []);
  useEffect(() => { if (selectedCycle) fetchGoals(); }, [selectedCycle, fetchGoals]);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, weightage: parseFloat(form.weightage), cycleId: selectedCycle }),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ thrustArea: '', title: '', description: '', uomType: 'MIN_NUMERIC', target: '', weightage: '' });
      fetchGoals();
      showToast('Goal created successfully!');
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to create goal', 'error');
    }
  };

  const handleSubmit = async () => {
    if (Math.abs(totalWeight - 100) > 0.01) { showToast(`Total weightage must be 100% (current: ${totalWeight}%)`, 'error'); return; }
    const res = await fetch('/api/goals/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleId: selectedCycle }),
    });
    if (res.ok) { fetchGoals(); showToast('Goals submitted for approval!'); }
    else { const e = await res.json(); showToast(e.error, 'error'); }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    if (res.ok) { fetchGoals(); showToast('Goal deleted'); }
  };

  const hasDrafts = goals.some(g => g.status === 'DRAFT' || g.status === 'RETURNED');
  const canCreate = goals.length < 8 && goals.some(g => g.status === 'DRAFT' || g.status === 'RETURNED') || goals.filter(g => g.status !== 'LOCKED' && g.status !== 'APPROVED' && g.status !== 'SUBMITTED').length >= 0 && goals.length < 8;

  return (
    <div>
      <div className="page-header">
        <div><h2>My Goals</h2><p>Create and manage your performance goals</p></div>
        <div className="header-actions">
          {cycles.length > 0 && (
            <select className="form-select" style={{ width: '200px' }} value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {goals.length < 8 && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Goal</button>}
          {hasDrafts && <button className="btn btn-success" onClick={handleSubmit}>Submit for Approval</button>}
        </div>
      </div>

      <div className="weightage-bar">
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Weightage:</span>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${Math.min(totalWeight, 100)}%`, background: totalWeight === 100 ? 'var(--gradient-success)' : totalWeight > 100 ? 'var(--accent-red)' : 'var(--gradient-primary)' }} />
        </div>
        <span className="weightage-label" style={{ color: totalWeight === 100 ? 'var(--accent-green)' : totalWeight > 100 ? 'var(--accent-red)' : 'var(--accent-blue)' }}>{totalWeight}%</span>
      </div>

      <div style={{ marginTop: '24px' }}>
        {goals.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎯</div><h3>No goals yet</h3><p>Click &quot;Add Goal&quot; to create your first performance goal.</p></div>
        ) : goals.map(g => (
          <div className="goal-card" key={g.id}>
            <div className="goal-card-header">
              <div>
                <div className="goal-card-title">{g.title} {g.isShared && <span className="badge badge-shared">Shared</span>}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{g.description}</div>
              </div>
              <span className={`badge badge-${g.status.toLowerCase()}`}>{g.status}</span>
            </div>
            <div className="goal-card-meta">
              <span>📌 {g.thrustArea}</span>
              <span>📏 {g.uomType.replace('_', ' ')}</span>
              <span>🎯 Target: {g.target}</span>
              <span>⚖️ Weight: {g.weightage}%</span>
            </div>
            {(g.status === 'DRAFT' || g.status === 'RETURNED') && (
              <div className="goal-card-actions">
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>Delete</button>
              </div>
            )}
            {g.achievements?.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {g.achievements.map((a: any) => (
                  <div key={a.id} className="checkin-card" style={{ flex: '1', minWidth: '140px' }}>
                    <div className="checkin-quarter">{a.quarter}</div>
                    <div style={{ fontSize: '13px' }}>Actual: <strong>{a.actualAchievement}</strong></div>
                    <div style={{ fontSize: '13px' }}>Score: <strong className={`score ${a.score >= 80 ? 'high' : a.score >= 50 ? 'medium' : 'low'}`} style={{ fontSize: '16px' }}>{a.score}%</strong></div>
                    <span className={`badge badge-${a.progressStatus.toLowerCase().replace('_', '-')}`}>{a.progressStatus.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Create New Goal</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Thrust Area *</label>
                <select className="form-select" value={form.thrustArea} onChange={e => setForm({ ...form, thrustArea: e.target.value })} required>
                  <option value="">Select...</option>
                  {THRUST_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Goal Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Increase Sales Revenue by 20%" required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the goal in detail..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit of Measurement *</label>
                  <select className="form-select" value={form.uomType} onChange={e => setForm({ ...form, uomType: e.target.value })}>
                    {UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target *</label>
                  <input className="form-input" type={form.uomType === 'TIMELINE' ? 'date' : 'text'} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder={form.uomType === 'ZERO' ? '0' : 'Enter target value'} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Weightage (%) * — Min 10%, remaining: {100 - totalWeight}%</label>
                <input className="form-input" type="number" min="10" max={100 - totalWeight + (form.weightage ? parseFloat(form.weightage) : 0)} value={form.weightage} onChange={e => setForm({ ...form, weightage: e.target.value })} placeholder="10-100" required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✓' : '✗'} {toast.msg}</div>}
    </div>
  );
}
