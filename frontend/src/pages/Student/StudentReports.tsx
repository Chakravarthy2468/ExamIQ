import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Activity, Download, FileText, CheckCircle } from 'lucide-react';

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
      // Create a URL pointing to the download endpoint
      // Ensure backend knows how to serve this, or we just open the API endpoint
      const downloadUrl = `http://localhost:8000/api/v1/reports/download/${res.data.report_id}`;
      setReportUrl(downloadUrl);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="text-gradient" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity /> Readiness Reports
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Generate detailed analytics on your preparedness for the final exam.
      </p>

      {error && (
        <div style={{ background: 'var(--danger-color)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Course</label>
          <select 
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-primary)' }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleGeneratePdf}
          disabled={loading || !selectedCourse}
          style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          className="btn btn-primary"
        >
          <FileText size={20} />
          {loading ? 'Generating PDF...' : 'Generate PDF Report'}
        </button>
      </div>

      {reportUrl && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', background: 'var(--surface-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <CheckCircle size={48} className="text-primary" />
          <h2 style={{ color: 'var(--text-primary)' }}>Report Ready!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Your personalized exam readiness report has been generated.</p>
          <a 
            href={reportUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', textDecoration: 'none', borderRadius: 'var(--radius)', background: 'var(--primary-color)', color: '#fff', fontWeight: 600 }}
            className="hover-scale"
          >
            <Download size={20} />
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};
