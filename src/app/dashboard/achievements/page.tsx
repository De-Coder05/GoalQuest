'use client';
import { useEffect, useState, useCallback } from 'react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const STATUS_OPTIONS = ['NOT_STARTED', 'ON_TRACK', 'COMPLETED'];

export default function AchievementsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedQ, setSelectedQ] = useState('Q1');
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [forms, setForms] = useState<Record<string, { actual: string; status: string }>>({});

  const fetchGoals = useCallback(async () => {
    const res = await fetch('/api/goals?view=my');
    if (res.ok) {
      const data = await res.json();
      setGoals(data.filter((g: any) => g.status === 'LOCKED'));
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSave = async (goalId: string) => {
    const form = forms[goalId];
    if (!form?.actual) { showToast('Please enter actual achievement', 'error'); return; }
    const res = await fetch('/api/achievements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, quarter: selectedQ, actualAchievement: form.actual, progressStatus: form.status || 'ON_TRACK' }),
    });
    if (res.ok) { fetchGoals(); showToast('Achievement saved!'); }
    else { const e = await res.json(); showToast(e.error, 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h2>Log Achievements</h2><p>Record your actual progress against planned targets</p></div>
        <div className="tabs">
          {QUARTERS.map(q => <button key={q} className={`tab ${selectedQ === q ? 'active' : ''}`} onClick={() => setSelectedQ(q)}>{q}</button>)}
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🏆</div><h3>No locked goals</h3><p>Your goals need to be approved before you can log achievements.</p></div>
      ) : goals.map(g => {
        const existing = g.achievements?.find((a: any) => a.quarter === selectedQ);
        const form = forms[g.id] || { actual: existing?.actualAchievement || '', status: existing?.progressStatus || 'NOT_STARTED' };
        return (
          <div className="goal-card" key={g.id}>
            <div className="goal-card-header">
              <div>
                <div className="goal-card-title">{g.title}</div>
                <div className="goal-card-meta"><span>🎯 Target: {g.target}</span><span>📏 {g.uomType.replace('_', ' ')}</span><span>⚖️ {g.weightage}%</span></div>
              </div>
              {existing && <span className={`score ${existing.score >= 80 ? 'high' : existing.score >= 50 ? 'medium' : 'low'}`}>{existing.score}%</span>}
            </div>
            <div className="form-row" style={{ marginTop: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Actual Achievement ({selectedQ})</label>
                <input className="form-input" type={g.uomType === 'TIMELINE' ? 'date' : 'text'} value={form.actual}
                  onChange={e => setForms({ ...forms, [g.id]: { ...form, actual: e.target.value } })}
                  placeholder={g.uomType === 'ZERO' ? '0 or count' : 'Enter actual value'} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForms({ ...forms, [g.id]: { ...form, status: e.target.value } })}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => handleSave(g.id)}>{existing ? 'Update' : 'Save'} Achievement</button>
            </div>
          </div>
        );
      })}
      {toast && <div className={`toast toast-${toast.type}`}>✓ {toast.msg}</div>}
    </div>
  );
}
