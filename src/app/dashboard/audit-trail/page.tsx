'use client';
import { useEffect, useState } from 'react';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { fetch('/api/audit-logs').then(r => r.json()).then(d => { if (Array.isArray(d)) setLogs(d); }); }, []);

  return (
    <div>
      <div className="page-header"><div><h2>Audit Trail</h2><p>Complete log of all goal changes</p></div></div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Timestamp</th><th>User</th><th>Goal</th><th>Action</th><th>Field</th><th>Old Value</th><th>New Value</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(l.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>{l.user?.name}</td>
                  <td>{l.goal?.title || '-'}</td>
                  <td><span className={`badge badge-${l.action.includes('APPROVED') ? 'approved' : l.action.includes('RETURN') ? 'returned' : l.action.includes('SUBMIT') ? 'submitted' : 'draft'}`}>{l.action}</span></td>
                  <td>{l.field || '-'}</td>
                  <td style={{ color: 'var(--accent-red)' }}>{l.oldValue || '-'}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{l.newValue || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && <div className="empty-state"><div className="empty-icon">🔍</div><h3>No audit logs</h3><p>Changes will be tracked here.</p></div>}
      </div>
    </div>
  );
}
