import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import apiClient from '../../api/client';
import { Activity, Server, Database } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [health, setHealth] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/admin/health')
      .then(res => setHealth(res.data))
      .catch(console.error);
      
    apiClient.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      <h2 style={{ marginBottom: '1rem' }}>System Health</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Server size={24} color={health.application === 'UP' ? 'var(--success-color)' : 'var(--danger-color)'} />
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Application API</p>
              <h3 style={{ margin: 0 }}>{health.application || 'Loading...'}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Database size={24} color={health.database === 'UP' ? 'var(--success-color)' : 'var(--danger-color)'} />
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Database</p>
              <h3 style={{ margin: 0 }}>{health.database || 'Loading...'}</h3>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={24} color={health.ollama === 'UP' ? 'var(--success-color)' : 'var(--danger-color)'} />
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Local Ollama (AI)</p>
              <h3 style={{ margin: 0 }}>{health.ollama || 'Loading...'}</h3>
            </div>
          </div>
        </Card>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Registered Users</h2>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 0' }}>Email</th>
              <th style={{ padding: '1rem 0' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0' }}>{u.email}</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'FACULTY' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: u.role === 'ADMIN' ? 'var(--danger-color)' : u.role === 'FACULTY' ? 'var(--primary-color)' : 'var(--success-color)'
                  }}>
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
