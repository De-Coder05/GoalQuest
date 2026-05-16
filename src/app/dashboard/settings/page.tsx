'use client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleForm, setCycleForm] = useState({ name: '', year: '', startDate: '', endDate: '' });
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  useEffect(() => {
    fetch('/api/cycles').then(r => r.json()).then(d => { if (Array.isArray(d)) setCycles(d); });
  }, []);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/cycles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cycleForm, year: parseInt(cycleForm.year) }),
    });
    if (res.ok) {
      const newCycle = await res.json();
      setCycles([newCycle, ...cycles]);
      setShowCycleModal(false);
      setCycleForm({ name: '', year: '', startDate: '', endDate: '' });
      showToast('Cycle created!');
    }
  };

  return (
    <div>
      <div className="page-header"><div><h2>Settings</h2><p>Manage cycles, escalation rules, and system configuration</p></div></div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Goal Cycles</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCycleModal(true)}>+ New Cycle</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Year</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {cycles.map(c => (
                <tr key={c.id}><td style={{ fontWeight: 500 }}>{c.name}</td><td>{c.year}</td><td>{new Date(c.startDate).toLocaleDateString()}</td><td>{new Date(c.endDate).toLocaleDateString()}</td><td><span className={`badge ${c.status === 'ACTIVE' ? 'badge-approved' : 'badge-draft'}`}>{c.status}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Escalation Rules</h3></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: '⏰', title: 'Goal Submission Overdue', desc: 'Auto-notify if employee hasn\'t submitted goals within 7 days', active: true },
            { icon: '📋', title: 'Approval Pending', desc: 'Escalate if manager hasn\'t approved within 5 days of submission', active: true },
            { icon: '🔔', title: 'Check-in Reminder', desc: 'Remind managers about pending check-ins after 7 days', active: true },
          ].map(rule => (
            <div key={rule.title} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-input)', borderRadius: '8px' }}>
              <span style={{ fontSize: '24px' }}>{rule.icon}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '14px' }}>{rule.title}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rule.desc}</div></div>
              <span className="badge badge-approved">Active</span>
            </div>
          ))}
        </div>
      </div>

      {showCycleModal && (
        <div className="modal-overlay" onClick={() => setShowCycleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Create Goal Cycle</h3><button className="modal-close" onClick={() => setShowCycleModal(false)}>✕</button></div>
            <form onSubmit={handleCreateCycle}>
              <div className="form-group"><label className="form-label">Cycle Name</label><input className="form-input" value={cycleForm.name} onChange={e => setCycleForm({ ...cycleForm, name: e.target.value })} placeholder="FY 2027-28" required /></div>
              <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={cycleForm.year} onChange={e => setCycleForm({ ...cycleForm, year: e.target.value })} placeholder="2027" required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={cycleForm.startDate} onChange={e => setCycleForm({ ...cycleForm, startDate: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={cycleForm.endDate} onChange={e => setCycleForm({ ...cycleForm, endDate: e.target.value })} required /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowCycleModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create</button></div>
            </form>
          </div>
        </div>
      )}
      {toast && <div className={`toast toast-${toast.type}`}>✓ {toast.msg}</div>}
    </div>
  );
}
