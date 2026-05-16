'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const demoAccounts = [
  { role: 'Admin', email: 'admin@atomberg.com', icon: '🛡️' },
  { role: 'Manager', email: 'manager@atomberg.com', icon: '👔' },
  { role: 'Employee', email: 'employee@atomberg.com', icon: '👤' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      email: demoEmail,
      password: 'password123',
      redirect: false,
    });

    if (result?.error) {
      setError('Login failed');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '40px' }}>🎯</div>
        <h1>GoalQuest</h1>
        <p className="login-subtitle">Employee Goal Setting & Tracking Portal</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@atomberg.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="form-error" style={{ marginBottom: '16px' }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>🚀 Quick Demo Access</h4>
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              className="demo-account-btn"
              onClick={() => handleDemoLogin(acc.email)}
              disabled={loading}
            >
              <span style={{ fontSize: '20px' }}>{acc.icon}</span>
              <span className="demo-role">{acc.role}</span>
              <span className="demo-email">{acc.email}</span>
            </button>
          ))}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Password for all demo accounts: <code style={{ color: 'var(--accent-blue)' }}>password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
