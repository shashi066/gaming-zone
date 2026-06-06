import { prisma } from '@/lib/prisma';
import { Users, Shield, Calendar } from 'lucide-react';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const userCount = users.filter((u) => u.role === 'USER').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{userCount} customers · {adminCount} admins</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total Users', value: users.length, color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
          { label: 'Customers', value: userCount, color: '#00d4ff', bg: 'rgba(0,212,255,0.08)' },
          { label: 'Admins', value: adminCount, color: '#ffaa00', bg: 'rgba(255,170,0,0.08)' },
        ].map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
              <Users size={22} />
            </div>
            <div className="stat-value" style={{ color: card.color, fontSize: '1.8rem' }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Total Bookings</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: user.role === 'ADMIN' ? 'var(--gradient-primary)' : 'rgba(108,99,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
                      color: user.role === 'ADMIN' ? 'white' : 'var(--color-accent-primary)',
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{user.name}</strong>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                        #{user.id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div>{user.email}</div>
                  {user.phone && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.phone}</div>
                  )}
                </td>
                <td>
                  {user.role === 'ADMIN' ? (
                    <span className="badge badge-confirmed">
                      <Shield size={11} /> Admin
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                      User
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{user._count.bookings}</strong>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} />
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
