'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

export default function TeamGoalsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [goals, setGoals] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [editGoal, setEditGoal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ target: '', weightage: '' });
  const [returnComment, setReturnComment] = useState('');
  const [showReturn, setShowReturn] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [shareForm, setShareForm] = useState({ thrustArea: '', title: '', description: '', uomType: 'MIN_NUMERIC', target: '', weightage: '10', employeeIds: [] as string[] });
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');

  const fetchGoals = useCallback(async () => {
    const url = selectedCycle ? `/api/goals?view=team&cycleId=${selectedCycle}` : '/api/goals?view=team';
    const res = await fetch(url);
    if (res.ok) setGoals(await res.json());
  }, [selectedCycle]);

  useEffect(() => {
    fetch('/api/cycles').then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) { setCycles(d); setSelectedCycle(d[0].id); } });
    fetch('/api/users?view=team').then(r => r.json()).then(d => { if (Array.isArray(d)) setEmployees(d); });
  }, []);

  useEffect(() => { if (selectedCycle) fetchGoals(); }, [selectedCycle, fetchGoals]);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const grouped = goals.reduce((acc: Record<string, any[]>, g) => {
    const name = g.user?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(g);
    return acc;
  }, {});

  const handleApprove = async (empGoals: any[]) => {
    const ids = empGoals.filter(g => g.status === 'SUBMITTED').map(g => g.id);
    if (!ids.length) return;
    const res = await fetch('/api/goals/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalIds: ids, action: 'approve' }),
    });
    if (res.ok) { fetchGoals(); showToast('Goals approved and locked!'); }
  };

  const handleReturn = async (empGoals: any[]) => {
    const ids = empGoals.filter(g => g.status === 'SUBMITTED').map(g => g.id);
    if (!ids.length) return;
    const res = await fetch('/api/goals/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalIds: ids, action: 'return', comment: returnComment }),
    });
    if (res.ok) { fetchGoals(); showToast('Goals returned for rework'); setShowReturn(null); setReturnComment(''); }
  };

  const handleInlineEdit = async () => {
    if (!editGoal) return;
    const res = await fetch(`/api/goals/${editGoal.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: editForm.target, weightage: parseFloat(editForm.weightage) }),
    });
    if (res.ok) { fetchGoals(); setEditGoal(null); showToast('Goal updated'); }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/goals/share', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalData: { ...shareForm, weightage: parseFloat(shareForm.weightage), cycleId: selectedCycle }, employeeIds: shareForm.employeeIds }),
    });
    if (res.ok) { setShareModal(false); fetchGoals(); showToast('Goal shared with team!'); setShareForm({ thrustArea: '', title: '', description: '', uomType: 'MIN_NUMERIC', target: '', weightage: '10', employeeIds: [] }); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Team Goals</h2><p>Review and manage your team&apos;s goals</p></div>
        <div className="header-actions">
          {cycles.length > 0 && <select className="form-select" style={{ width: '200px' }} value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}>{cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
          <button className="btn btn-primary" onClick={() => setShareModal(true)}>📤 Share Goal</button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👥</div><h3>No team goals</h3><p>Your team members haven&apos;t created any goals yet.</p></div>
      ) : Object.entries(grouped).map(([name, empGoals]) => {
        const totalWeight = empGoals.reduce((s, g) => s + g.weightage, 0);
        const hasSubmitted = empGoals.some(g => g.status === 'SUBMITTED');
        return (
          <div className="card" key={name} style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">{name}</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{empGoals[0]?.user?.department} • {empGoals.length} goals • Weight: {totalWeight}%</span>
              </div>
              {hasSubmitted && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(empGoals)}>✓ Approve All</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowReturn(name)}>↩ Return</button>
                </div>
              )}
            </div>
            {showReturn === name && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                <textarea className="form-textarea" placeholder="Reason for return..." value={returnComment} onChange={e => setReturnComment(e.target.value)} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReturn(empGoals)}>Confirm Return</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowReturn(null)}>Cancel</button>
                </div>
              </div>
            )}
            {empGoals.map(g => (
              <div className="goal-card" key={g.id} style={{ margin: '0 0 8px' }}>
                <div className="goal-card-header">
                  <div>
                    <div className="goal-card-title">{g.title} {g.isShared && <span className="badge badge-shared">Shared</span>}</div>
                    <div className="goal-card-meta"><span>📌 {g.thrustArea}</span><span>📏 {g.uomType.replace('_',' ')}</span><span>🎯 {g.target}</span><span>⚖️ {g.weightage}%</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`badge badge-${g.status.toLowerCase()}`}>{g.status}</span>
                    {g.status === 'SUBMITTED' && <button className="btn btn-ghost btn-sm" onClick={() => { setEditGoal(g); setEditForm({ target: g.target, weightage: String(g.weightage) }); }}>✏️ Edit</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {editGoal && (
        <div className="modal-overlay" onClick={() => setEditGoal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Goal: {editGoal.title}</h3><button className="modal-close" onClick={() => setEditGoal(null)}>✕</button></div>
            <div className="form-group"><label className="form-label">Target</label><input className="form-input" value={editForm.target} onChange={e => setEditForm({ ...editForm, target: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Weightage (%)</label><input className="form-input" type="number" value={editForm.weightage} onChange={e => setEditForm({ ...editForm, weightage: e.target.value })} /></div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setEditGoal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleInlineEdit}>Save Changes</button></div>
          </div>
        </div>
      )}

      {shareModal && (
        <div className="modal-overlay" onClick={() => setShareModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Share Departmental KPI</h3><button className="modal-close" onClick={() => setShareModal(false)}>✕</button></div>
            <form onSubmit={handleShare}>
              <div className="form-group"><label className="form-label">Goal Title</label><input className="form-input" value={shareForm.title} onChange={e => setShareForm({ ...shareForm, title: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Thrust Area</label><select className="form-select" value={shareForm.thrustArea} onChange={e => setShareForm({ ...shareForm, thrustArea: e.target.value })} required><option value="">Select...</option>{['Product Development','Quality','Safety','Efficiency','Cost Optimization'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">UoM</label><select className="form-select" value={shareForm.uomType} onChange={e => setShareForm({ ...shareForm, uomType: e.target.value })}><option value="MIN_NUMERIC">Min Numeric</option><option value="MAX_NUMERIC">Max Numeric</option><option value="TIMELINE">Timeline</option><option value="ZERO">Zero</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Target</label><input className="form-input" value={shareForm.target} onChange={e => setShareForm({ ...shareForm, target: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Default Weightage</label><input className="form-input" type="number" value={shareForm.weightage} onChange={e => setShareForm({ ...shareForm, weightage: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Share with Employees</label>
                {employees.map(emp => (
                  <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={shareForm.employeeIds.includes(emp.id)} onChange={e => {
                      const ids = e.target.checked ? [...shareForm.employeeIds, emp.id] : shareForm.employeeIds.filter(id => id !== emp.id);
                      setShareForm({ ...shareForm, employeeIds: ids });
                    }} />
                    <span>{emp.name} ({emp.department})</span>
                  </label>
                ))}
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShareModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Share Goal</button></div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✓' : '✗'} {toast.msg}</div>}
    </div>
  );
}
