import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';
import { FileUp, CheckCircle, UploadCloud } from 'lucide-react';

export const StudentDocuments: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [pyqFiles, setPyqFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      setError('Please enter a course name');
      return;
    }
    if (!syllabusFile && (!pyqFiles || pyqFiles.length === 0)) {
      setError('Please select at least one syllabus or PYQ file to upload.');
      return;
    }
    
    setLoading(true);
    setMessages([]);
    setError('');
    
    const newMessages: string[] = [];
    
    try {
      if (syllabusFile) {
        const formData = new FormData();
        formData.append('file', syllabusFile);
        formData.append('doc_type', 'SYLLABUS');
        formData.append('course_name', selectedCourse);

        const res = await apiClient.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newMessages.push(`Syllabus: ${res.data.message}`);
      }

      if (pyqFiles && pyqFiles.length > 0) {
        for (let i = 0; i < pyqFiles.length; i++) {
          const file = pyqFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('doc_type', 'QUESTION_PAPER');
          formData.append('course_name', selectedCourse);

          const res = await apiClient.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          newMessages.push(`PYQ (${file.name}): ${res.data.message}`);
        }
      }

      setMessages(newMessages);
      setSyllabusFile(null);
      setPyqFiles(null);
      
      const sylInput = document.getElementById('syllabus_input') as HTMLInputElement;
      if (sylInput) sylInput.value = '';
      
      const pyqInput = document.getElementById('pyq_input') as HTMLInputElement;
      if (pyqInput) pyqInput.value = '';

    } catch (err: any) {
      setError(err.response?.data?.detail || 'One or more uploads failed. Please check the logs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Document Ingestion</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Upload syllabus and previous year question papers to begin</p>
      </div>
      
      <Card style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--primary-subtle)', padding: '0.5rem', borderRadius: 'var(--radius)', color: 'var(--primary-color)' }}>
            <FileUp size={20} />
          </div>
          <h2 style={{ fontSize: '1.125rem' }}>Upload Materials</h2>
        </div>
        
        {messages.length > 0 && (
          <div className="animate-fade-in-up" style={{ padding: '0.875rem 1rem', background: 'var(--success-subtle)', border: '1px solid rgba(52, 211, 153, 0.2)', color: 'var(--success-color)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
              <CheckCircle size={16} /> Uploads Successful!
            </div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {messages.map((m, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        
        {error && <div style={{ padding: '0.875rem 1rem', background: 'var(--danger-subtle)', border: '1px solid rgba(248, 113, 113, 0.2)', color: 'var(--danger-color)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Input 
            label="Course Name"
            type="text"
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            placeholder="e.g. Advanced Databases"
            required
            hint="A new course will be created if it doesn't exist."
          />
          
          <div style={{ padding: '1.25rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', transition: 'border-color var(--transition-fast)' }} className="hover-lift">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Syllabus Document
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload a single syllabus file for this course.</p>
            <input 
              id="syllabus_input"
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setSyllabusFile(e.target.files?.[0] || null)}
              style={{ width: '100%', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}
            />
          </div>
          
          <div style={{ padding: '1.25rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', transition: 'border-color var(--transition-fast)' }} className="hover-lift">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              Previous Year Question Papers (PYQs)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload multiple question paper files simultaneously.</p>
            <input 
              id="pyq_input"
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={e => setPyqFiles(e.target.files)}
              style={{ width: '100%', fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0.5rem 0' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button type="submit" isLoading={loading} icon={<UploadCloud size={16} />}>
              Process Documents
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
