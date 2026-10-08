import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';
import { FileUp, CheckCircle, UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';

type ProcessingDoc = { id: number; name: string; status: string; progress: number; error: string | null };

export const StudentDocuments: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [pyqFiles, setPyqFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [processingDocs, setProcessingDocs] = useState<ProcessingDoc[]>([]);
  
  // Polling mechanism
  useEffect(() => {
    const activeDocs = processingDocs.filter(d => d.status !== 'COMPLETED' && d.status !== 'FAILED');
    if (activeDocs.length === 0) return;

    const intervalId = setInterval(async () => {
      setProcessingDocs(prev => [...prev]); // Trigger re-render
      
      for (const doc of activeDocs) {
        try {
          const res = await apiClient.get(`/documents/${doc.id}/status`);
          setProcessingDocs(prev => prev.map(p => 
            p.id === doc.id ? { ...p, status: res.data.status, progress: res.data.progress, error: res.data.error } : p
          ));
        } catch (err) {
          console.error(err);
        }
      }
    }, 3000); // poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [processingDocs]);
  
  const syllabusInputRef = useRef<HTMLInputElement>(null);
  const pyqInputRef = useRef<HTMLInputElement>(null);

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
        setProcessingDocs(prev => [...prev, { id: res.data.document_id, name: syllabusFile.name, status: 'PROCESSING', progress: 0, error: null }]);
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
          setProcessingDocs(prev => [...prev, { id: res.data.document_id, name: file.name, status: 'PROCESSING', progress: 0, error: null }]);
        }
      }

      setMessages(newMessages);
      setSyllabusFile(null);
      setPyqFiles(null);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'One or more uploads failed. Please check the logs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '8px' }}>Document Ingestion</h1>
        <p style={{ color: '#555555', fontSize: '16px' }}>Upload syllabus and previous year question papers to begin</p>
      </div>
      
      <Card style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: '10px', color: '#111111', background: '#FAFAFB' }}>
            <FileUp size={24} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Upload Materials</h2>
        </div>
        
        {messages.length > 0 && processingDocs.every(d => d.status === 'COMPLETED' || d.status === 'FAILED') && (
          <div className="animate-fade-in-up" style={{ padding: '16px', background: 'var(--success-subtle)', border: '1px solid rgba(30, 142, 62, 0.2)', color: 'var(--success-color)', borderRadius: '10px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 500, fontSize: '15px' }}>
              <CheckCircle size={18} /> Uploads & Processing Finished!
            </div>
          </div>
        )}
        
        {processingDocs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>AI Processing Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {processingDocs.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: '#FAFAFB' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#111111', margin: '0 0 4px 0' }}>{doc.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {doc.status === 'COMPLETED' && <CheckCircle size={14} color="var(--success-color)" />}
                      {doc.status === 'FAILED' && <AlertCircle size={14} color="var(--danger-color)" />}
                      {doc.status !== 'COMPLETED' && doc.status !== 'FAILED' && <Loader2 size={14} className="animate-spin" color="#6B6B6B" />}
                      <span style={{ fontSize: '13px', color: doc.status === 'FAILED' ? 'var(--danger-color)' : '#6B6B6B', textTransform: 'capitalize' }}>
                        {doc.status.toLowerCase()} {doc.status === 'FAILED' && `- ${doc.error}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {error && <div style={{ padding: '16px', background: 'var(--danger-subtle)', border: '1px solid rgba(217, 48, 37, 0.2)', color: 'var(--danger-color)', borderRadius: '10px', marginBottom: '32px', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <Input 
            label="Course Name"
            type="text"
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            placeholder="e.g. Advanced Databases"
            required
            hint="A new course will be created if it doesn't exist."
          />
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#333333', marginBottom: '12px' }}>Syllabus Document</label>
            {!syllabusFile ? (
              <div 
                style={{ border: '1px dashed #BFC0C5', background: '#FAFAFB', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer' }}
                onClick={() => syllabusInputRef.current?.click()}
              >
                <UploadCloud size={28} color="#6B6B6B" style={{ marginBottom: '16px', margin: '0 auto' }} />
                <h3 style={{ fontSize: '16px', color: '#171717', marginBottom: '8px', fontWeight: 500 }}>Upload syllabus</h3>
                <p style={{ fontSize: '14px', color: '#626267', marginBottom: '24px' }}>PDF, DOCX, JPG</p>
                <Button type="button" variant="secondary" onClick={(e) => { e.stopPropagation(); syllabusInputRef.current?.click(); }}>Browse files</Button>
                <input 
                  ref={syllabusInputRef}
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  onChange={e => setSyllabusFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: '#FFFFFF' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#111111', margin: '0 0 4px 0' }}>{syllabusFile.name}</p>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>{(syllabusFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button type="button" onClick={() => setSyllabusFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B6B6B', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#333333', marginBottom: '12px' }}>Previous Year Question Papers (PYQs)</label>
            {(!pyqFiles || pyqFiles.length === 0) ? (
              <div 
                style={{ border: '1px dashed #BFC0C5', background: '#FAFAFB', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer' }}
                onClick={() => pyqInputRef.current?.click()}
              >
                <UploadCloud size={28} color="#6B6B6B" style={{ marginBottom: '16px', margin: '0 auto' }} />
                <h3 style={{ fontSize: '16px', color: '#171717', marginBottom: '8px', fontWeight: 500 }}>Upload past papers</h3>
                <p style={{ fontSize: '14px', color: '#626267', marginBottom: '24px' }}>Upload multiple files simultaneously</p>
                <Button type="button" variant="secondary" onClick={(e) => { e.stopPropagation(); pyqInputRef.current?.click(); }}>Browse files</Button>
                <input 
                  ref={pyqInputRef}
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png,.docx"
                  multiple
                  onChange={e => setPyqFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Array.from(pyqFiles).map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: '#FFFFFF' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#111111', margin: '0 0 4px 0' }}>{file.name}</p>
                      <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setPyqFiles(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#d93025', fontSize: '14px', fontWeight: 500, padding: '8px', alignSelf: 'flex-start', marginTop: '8px' }}>
                  Clear all PYQs
                </button>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
            <Button type="submit" isLoading={loading} icon={<FileUp size={18} />}>
              Process Documents
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
