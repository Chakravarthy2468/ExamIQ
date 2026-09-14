import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import apiClient from '../../api/client';
import { Users, AlertCircle } from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [evals, setEvals] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/faculty/students')
      .then(res => setStudents(res.data))
      .catch(console.error);
      
    apiClient.get('/faculty/evaluations/review')
      .then(res => setEvals(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Faculty Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Assigned Students</p>
              <h2 style={{ margin: 0 }}>{students.length}</h2>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
            {students.slice(0,3).map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>{s.full_name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.email}</span>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--danger-color)' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending Evaluations for Review</p>
              <h2 style={{ margin: 0 }}>{evals.length}</h2>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            These evaluations were flagged by the AI for having low confidence. Please review them in the Review Queue.
          </p>
        </Card>
      </div>
    </div>
  );
};
