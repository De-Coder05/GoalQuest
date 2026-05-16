'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function CheckInsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedQ, setSelectedQ] = useState('Q1');
  const [comment, setComment] = useState('');
  const [activeGoal, setActiveGoal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const fetchGoals = useCallback(async () => {
    const view = user?.role === 'MANAGER' ? 'team' : 'my';
    const res = await fetch(`/api/goals?view=${view}`);
    if (res.ok) {
      const data = await res.json();
      setGoals(data.filter((g: any) => g.status === 'LOCKED'));
    }
  }, [user]);

  useEffect(() => { if (user) fetchGoals(); }, [user, fetchGoals]);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleCheckIn = async (goalId: string) => {
    const res = await fetch('/api/checkins', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId, quarter: selectedQ, comment }),
    });
    if (res.ok) { fetchGoals(); setComment(''); setActiveGoal(null); showToast('Check-in recorded!'); }
  };

  const grouped = goals.reduce((acc: Record<string, any[]>, g) => {
    const name = g.user?.name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(g);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div><h2>Quarterly Check-ins</h2><p>{user?.role === 'MANAGER' ? 'Review team progress and add feedback' : 'View your check-in history'}</p></div>
        <div className="tabs">
          {QUARTERS.map(q => <button key={q} className={`tab ${selectedQ === q ? 'active' : ''}`} onClick={() => setSelectedQ(q)}>{q}</button>)}
        </div>
      </div>

      {Object.entries(grouped).map(([name, empGoals]) => (
        <div className="card" key={name} style={{ marginBottom: '20px' }}>
          <h3 className="card-title" style={{ marginBottom: '16px' }}>{name} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 400 }}>• {empGoals[0]?.user?.department}</span></h3>
          {empGoals.map(g => {
            const achievement = g.achievements?.find((a: any) => a.quarter === selectedQ);
            const checkIn = g.checkIns?.find((c: any) => c.quarter === selectedQ);
            return (
              <div className="goal-card" key={g.id} style={{ margin: '0 0 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="goal-card-title">{g.title}</div>
                    <div className="goal-card-meta"><span>🎯 Target: {g.target}</span><span>📏 {g.uomType.replace('_',' ')}</span><span>⚖️ {g.weightage}%</span></div>
                  </div>
                  {achievement && <span className={`score ${achievement.score >= 80 ? 'high' : achievement.score >= 50 ? 'medium' : 'low'}`} style={{ fontSize: '20px' }}>{achievement.score}%</span>}
                </div>
                {achievement && (
                  <div className="checkin-card">
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <span>Actual: <strong>{achievement.actualAchievement}</strong></span>
                      <span className={`badge badge-${achievement.progressStatus.toLowerCase().replace('_','-')}`}>{achievement.progressStatus.replace('_',' ')}</span>
                    </div>
                  </div>
                )}
                {checkIn && (
                  <div className="checkin-card" style={{ borderLeft: '3px solid var(--accent-green)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>Manager Check-in by {checkIn.manager?.name}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px' }}>{checkIn.comment}</div>
                  </div>
                )}
                {user?.role === 'MANAGER' && !checkIn && (
                  <div style={{ marginTop: '8px' }}>
                    {activeGoal === g.id ? (
                      <div>
                        <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add check-in comment..." style={{ minHeight: '60px' }} />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleCheckIn(g.id)}>Submit Check-in</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setActiveGoal(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => setActiveGoal(g.id)}>💬 Add Check-in</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {goals.length === 0 && <div className="empty-state"><div className="empty-icon">✅</div><h3>No locked goals</h3><p>Goals must be approved and locked before check-ins can begin.</p></div>}
      {toast && <div className={`toast toast-${toast.type}`}>✓ {toast.msg}</div>}
    </div>
  );
}
