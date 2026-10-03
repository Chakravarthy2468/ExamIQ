import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';
import { Download, FileText, CheckCircle, BarChart3 } from 'lucide-react';

export const StudentReports: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/courses')
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].id.toString());
      })
      .catch(err => console.error('Failed to load courses', err));
  }, []);

  const handleGeneratePdf = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError('');
    setReportUrl(null);
    try {
      const res = await apiClient.post(`/reports/generate/${selectedCourse}/pdf`);
      const downloadUrl = `http://localhost:8000/api/v1/reports/download/${res.data.report_id}`;
      setReportUrl(downloadUrl);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Readiness Reports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Generate detailed PDF analytics on your preparedness for the final exam.</p>
      </div>

      {error && (
        <div style={{ padding: '0.875rem 1rem', background: 'var(--danger-subtle)', border: '1px solid rgba(248, 113, 113, 0.2)', color: 'var(--danger-color)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--warning-subtle)', padding: '0.5rem', borderRadius: 'var(--radius)', color: 'var(--warning-color)' }}>
            <BarChart3 size={20} />
          </div>
          <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Analytics Generation</h2>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Select Course</label>
          <select 
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {courses.length === 0 && <option value="" disabled>No courses available</option>}
          </select>
        </div>
        
        <Button 
          onClick={handleGeneratePdf}
          disabled={loading || !selectedCourse}
          style={{ width: '100%' }}
          icon={<FileText size={16} />}
        >
          {loading ? 'Compiling Analysis...' : 'Generate PDF Report'}
        </Button>
      </Card>

      {reportUrl && (
        <Card className="animate-fade-in-up" style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--success-subtle)', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'var(--success-color)', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)' }}>
            <CheckCircle size={32} color="#fff" />
          </div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Report Ready!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '2rem' }}>Your personalized exam readiness analytics report has been generated successfully.</p>
          <a 
            href={reportUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.75rem 1.5rem', textDecoration: 'none', 
              borderRadius: 'var(--radius)', background: 'var(--success-color)', 
              color: '#fff', fontWeight: 600, fontSize: '0.9375rem',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)' 
            }}
            className="hover-lift"
          >
            <Download size={18} />
            Download PDF
          </a>
        </Card>
      )}
    </div>
  );
};
