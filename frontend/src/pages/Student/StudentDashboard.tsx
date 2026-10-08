import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import apiClient from '../../api/client';
import { FileText, BookOpen, PenTool, BarChart3, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCourses: number;
  totalDocuments: number;
  totalPlans: number;
  totalMocks: number;
}

export const StudentDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({ totalCourses: 0, totalDocuments: 0, totalPlans: 0, totalMocks: 0 });
  const [readiness, setReadiness] = useState<{overall_readiness: number, strong_areas: string[], needs_attention: string[]}>({
    overall_readiness: 0, strong_areas: [], needs_attention: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes, papersRes, readinessRes] = await Promise.allSettled([
          apiClient.get('/courses'),
          apiClient.get('/mock_papers'),
          apiClient.get('/progress/readiness'),
        ]);

        setStats({
          totalCourses: coursesRes.status === 'fulfilled' ? coursesRes.value.data.length : 0,
          totalDocuments: 0, // We don't have a count endpoint yet
          totalPlans: 0,
          totalMocks: papersRes.status === 'fulfilled' ? papersRes.value.data.length : 0,
        });

        if (readinessRes.status === 'fulfilled') {
          setReadiness(readinessRes.value.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickActions = [
    { label: 'Upload Documents', desc: 'Add syllabus & PYQs', path: '/student/documents', icon: <FileText size={20} /> },
    { label: 'Study Plans', desc: 'Personalized schedules', path: '/student/plans', icon: <BookOpen size={20} /> },
    { label: 'Mock Exams', desc: 'Practice with past papers', path: '/student/exams', icon: <PenTool size={20} /> },
  ];

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: '40px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: '#555555', fontSize: '16px' }}>Your exam preparation overview</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '48px' }}>
        <Card hover style={{ padding: '32px' }}>
          <p style={{ fontSize: '15px', color: '#555555', marginBottom: '8px', fontWeight: 500 }}>Active Courses</p>
          <p style={{ fontSize: '48px', fontWeight: 600, color: '#111111', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{stats.totalCourses}</p>
        </Card>
        <Card hover style={{ padding: '32px' }}>
          <p style={{ fontSize: '15px', color: '#555555', marginBottom: '8px', fontWeight: 500 }}>Mock Exams Completed</p>
          <p style={{ fontSize: '48px', fontWeight: 600, color: '#111111', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{stats.totalMocks}</p>
        </Card>
      </div>
      
      {/* Preparation Overview Example Section */}
      <h2 style={{ marginBottom: '20px', fontSize: '20px', color: '#171717' }}>Preparation Overview</h2>
      <Card style={{ marginBottom: '48px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider-color)', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ color: '#555555', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Overall Readiness</h3>
            <p style={{ color: '#111111', fontSize: '28px', fontWeight: 600, margin: 0 }}>{readiness.overall_readiness}%</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ color: '#555555', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Next Action</h3>
            <p style={{ color: '#111111', fontSize: '16px', fontWeight: 500, margin: 0 }}>Review weak topics</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <h3 style={{ color: '#555555', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Strong Areas</h3>
            <p style={{ color: '#111111', fontSize: '15px', fontWeight: 500, margin: 0 }}>{readiness.strong_areas.length > 0 ? readiness.strong_areas.join(', ') : 'Not enough data'}</p>
          </div>
          <div>
            <h3 style={{ color: '#555555', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Needs Attention</h3>
            <p style={{ color: '#111111', fontSize: '15px', fontWeight: 500, margin: 0 }}>{readiness.needs_attention.length > 0 ? readiness.needs_attention.join(', ') : 'Not enough data'}</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <h2 style={{ marginBottom: '20px', fontSize: '20px', color: '#171717' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        {quickActions.map((action) => (
          <Card key={action.path} hover style={{ cursor: 'pointer', padding: '24px' }}>
            <div onClick={() => navigate(action.path)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: '10px',
                background: '#FAFAFB',
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#111111',
              }}>
                {action.icon}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '16px', color: '#111111', margin: '0 0 6px 0' }}>{action.label}</p>
                <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0 }}>{action.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

    </div>
  );
};
