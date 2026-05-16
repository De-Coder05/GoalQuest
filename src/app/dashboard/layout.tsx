'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

const navItems: Record<string, { label: string; icon: string; roles: string[] }[]> = {
  Main: [
    { label: 'Dashboard', icon: '📊', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { label: 'My Goals', icon: '🎯', roles: ['EMPLOYEE'] },
    { label: 'Team Goals', icon: '👥', roles: ['MANAGER'] },
    { label: 'All Goals', icon: '📋', roles: ['ADMIN'] },
  ],
  Tracking: [
    { label: 'Check-ins', icon: '✅', roles: ['EMPLOYEE', 'MANAGER'] },
    { label: 'Achievements', icon: '🏆', roles: ['EMPLOYEE'] },
  ],
  Admin: [
    { label: 'Analytics', icon: '📈', roles: ['MANAGER', 'ADMIN'] },
    { label: 'Audit Trail', icon: '🔍', roles: ['ADMIN'] },
    { label: 'Reports', icon: '📄', roles: ['MANAGER', 'ADMIN'] },
    { label: 'Settings', icon: '⚙️', roles: ['ADMIN'] },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchNotifications();
  }, [status, fetchNotifications]);

  if (status !== 'authenticated') return <div className="loading"><div className="spinner"></div></div>;

  const user = session?.user as any;
  const unread = notifications.filter(n => !n.read).length;

  const getPath = (label: string) => '/dashboard' + (label === 'Dashboard' ? '' : '/' + label.toLowerCase().replace(/\s/g, '-'));
  const isActive = (label: string) => {
    const path = getPath(label);
    return path === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(path);
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">G</div>
          <div><h1>GoalQuest</h1><span>Performance Portal</span></div>
        </div>
        <nav className="sidebar-nav">
          {Object.entries(navItems).map(([section, items]) => {
            const visible = items.filter(i => i.roles.includes(user.role));
            if (!visible.length) return null;
            return (
              <div key={section}>
                <div className="nav-section-title">{section}</div>
                {visible.map(item => (
                  <button key={item.label} className={`nav-item ${isActive(item.label) ? 'active' : ''}`} onClick={() => router.push(getPath(item.label))}>
                    <span className="icon">{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.name?.[0]}</div>
          <div className="sidebar-user-info">
            <div className="name">{user.name}</div>
            <div className="role">{user.role}</div>
          </div>
          <button className="btn-ghost" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out">🚪</button>
        </div>
      </aside>
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', position: 'relative' }}>
          <button className="notification-bell" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) fetchNotifications(); }}>
            🔔 {unread > 0 && <span className="notification-count">{unread}</span>}
          </button>
          {showNotifs && (
            <div className="notification-dropdown">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-message">{n.message}</div>
                    <div className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
