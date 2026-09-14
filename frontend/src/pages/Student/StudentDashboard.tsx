import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import apiClient from '../../api/client';
import { BookOpen, Target, Clock, AlertCircle } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading basic student data
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Welcome back!</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-color)' }}>
              <Target size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Overall Readiness</p>
              <h2 style={{ margin: 0 }}>78%</h2>
            </div>
          </div>
        </Card>
        
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-color)' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Study Plans</p>
              <h2 style={{ margin: 0 }}>2</h2>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--success-color)' }}>
              <Clock size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Next Mock Exam</p>
              <h2 style={{ margin: 0 }}>In 2 days</h2>
            </div>
          </div>
        </Card>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Recent Activity</h2>
      <Card>
        <p style={{ color: 'var(--text-secondary)' }}>You completed a Mock Exam for Software Engineering on Oct 12.</p>
        <p style={{ color: 'var(--text-secondary)' }}>AI Tutor generated a new study plan for Advanced Databases.</p>
      </Card>
      
      <div style={{ background: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: 'var(--radius)', marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Responsible AI Disclosure</strong>
          AI answer evaluation is advisory and not equivalent to official faculty grading. AI-generated tutoring content and topic importance estimates may contain errors and do not guarantee future examination contents. Low-confidence evaluations may require human review.
        </div>
      </div>
    </div>
  );
};
