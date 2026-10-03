import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';
import { FileUp, File as FileIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const StudentDocuments: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [docType, setDocType] = useState<string>('SYLLABUS');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // No longer fetching predefined courses
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedCourse) return;
    
    setLoading(true);
    setMessage('');
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('course_name', selectedCourse);

    try {
      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Document Ingestion</h1>
      
      <Card style={{ maxWidth: '600px', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileUp size={24} color="var(--primary-color)" />
          Upload New Document
        </h2>
        
        {message && <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>{message}</div>}
        {error && <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>{error}</div>}
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Enter Course Name</label>
            <input 
              type="text"
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              placeholder="e.g. Advanced Databases"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Document Type</label>
            <select 
              value={docType} 
              onChange={e => setDocType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              required
            >
              <option value="SYLLABUS">Syllabus</option>
              <option value="QUESTION_PAPER">Question Paper (PYQ)</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>File (PDF, JPG, PNG)</label>
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--surface-color)' }}
              required
            />
          </div>
          
          <Button type="submit" isLoading={loading} style={{ marginTop: '1rem' }}>
            Upload and Process
          </Button>
        </form>
      </Card>
    </div>
  );
};
