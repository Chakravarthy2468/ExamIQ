import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';

import apiClient from '../../api/client';
import { FileText, BookOpen, PenTool, BarChart3, ArrowRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCourses: number;
  totalDocuments: number;
  totalPlans: number;
  totalMocks: number;
}

export const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({ totalCourses: 0, totalDocuments: 0, totalPlans: 0, totalMocks: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes, papersRes] = await Promise.allSettled([
          apiClient.get('/courses'),
          apiClient.get('/mock_papers'),
        ]);

        setStats({
          totalCourses: coursesRes.status === 'fulfilled' ? coursesRes.value.data.length : 0,
          totalDocuments: 0, // We don't have a count endpoint yet
          totalPlans: 0,
          totalMocks: papersRes.status === 'fulfilled' ? papersRes.value.data.length : 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    { label: 'Upload Documents', desc: 'Add syllabus & PYQs', path: '/student/documents', icon: <FileText size={20} />, color: 'var(--primary-color)' },
    { label: 'Study Plans', desc: 'Generate AI schedules', path: '/student/plans', icon: <BookOpen size={20} />, color: 'var(--accent-color)' },
    { label: 'Mock Exams', desc: 'Practice with PYQs', path: '/student/exams', icon: <PenTool size={20} />, color: 'var(--success-color)' },
    { label: 'Reports', desc: 'Download analytics', path: '/student/reports', icon: <BarChart3 size={20} />, color: 'var(--warning-color)' },
  ];

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 28, width: 200, marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Your exam preparation at a glance</p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
        <Card>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courses</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{stats.totalCourses}</p>
        </Card>
        <Card>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mock Exams</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{stats.totalMocks}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '1rem' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }} className="stagger-children">
        {quickActions.map((action) => (
          <Card key={action.path} hover style={{ cursor: 'pointer' }}>
            <div onClick={() => navigate(action.path)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                width: 36, height: 36,
                borderRadius: 'var(--radius)',
                background: `${action.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: action.color,
              }}>
                {action.icon}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{action.label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>{action.desc}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ArrowRight size={14} color="var(--text-muted)" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Disclosure */}
      <div style={{
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        padding: '0.875rem 1rem',
        background: 'var(--warning-subtle)',
        border: '1px solid rgba(251, 191, 36, 0.12)',
        borderRadius: 'var(--radius)',
        fontSize: '0.8125rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}>
        <Info size={16} color="var(--warning-color)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ color: 'var(--warning-color)', display: 'block', marginBottom: '0.125rem', fontSize: '0.8125rem' }}>AI Disclaimer</strong>
          AI-generated study plans, mock exams, and answer evaluations are advisory. They do not guarantee exam outcomes and may contain errors. Always verify with your official course material.
        </div>
      </div>
    </div>
  );
};
