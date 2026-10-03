import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';

export const MockExams: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [papers, setPapers] = useState<any[]>([]);
  
  const [activePaper, setActivePaper] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluations, setEvaluations] = useState<Record<number, any>>({});
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCoursesAndPapers = async () => {
    try {
      const cRes = await apiClient.get('/courses');
      setCourses(cRes.data);
      if (cRes.data.length > 0) setSelectedCourse(cRes.data[0].id.toString());
      
      const pRes = await apiClient.get('/mock_papers');
      setPapers(pRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCoursesAndPapers();
  }, []);

  const handleGenerate = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      await apiClient.post(`/mock_papers/generate/${selectedCourse}?difficulty=MEDIUM&total_marks=50`);
      setMessage('Mock paper generated!');
      fetchCoursesAndPapers();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleTakeExam = async (paperId: number) => {
    try {
      const res = await apiClient.get(`/mock_papers/${paperId}`);
      setActivePaper(res.data);
      setAnswers({});
      setEvaluations({});
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitAnswer = async (questionId: number) => {
    const text = answers[questionId];
    if (!text) return;
    
    try {
      const res = await apiClient.post('/evaluations/submit', {
        mock_question_id: questionId,
        text_content: text
      });
      setEvaluations(prev => ({ ...prev, [questionId]: res.data.evaluation }));
    } catch (e) {
      console.error(e);
    }
  };

  if (activePaper) {
    return (
      <div>
        <Button onClick={() => setActivePaper(null)} style={{ marginBottom: '1rem', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>&larr; Back to Exams</Button>
        <h1 style={{ marginBottom: '1rem' }}>Mock Exam</h1>
        
        {activePaper.questions.map((q: any, index: number) => (
          <Card key={q.id} style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Q{index + 1}: {q.text} <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>({q.marks} Marks)</span></h3>
            
            <textarea 
              value={answers[q.id] || ''} 
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Type your answer here..."
              style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1rem', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
            />
            
            <Button onClick={() => handleSubmitAnswer(q.id)}>Submit Answer for AI Evaluation</Button>
            
            {evaluations[q.id] && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  <CheckCircle size={18} /> AI Evaluation
                </h4>
                <p style={{ marginBottom: '0.25rem' }}><strong>Estimated Marks:</strong> {evaluations[q.id].obtained_marks} / {q.marks}</p>
                <p style={{ marginBottom: '0.25rem' }}><strong>Feedback:</strong> {evaluations[q.id].feedback}</p>
                {evaluations[q.id].missing_concepts && (
                  <p><strong>Missing Concepts:</strong> {evaluations[q.id].missing_concepts}</p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Mock Exams</h1>
      
      <Card style={{ marginBottom: '2rem' }}>
        <h2>Generate New Mock Exam</h2>
        {message && <div style={{ color: 'var(--success-color)', marginTop: '1rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius)' }}>{message}</div>}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
          <select 
            value={selectedCourse} 
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', minWidth: '200px' }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
          <Button onClick={handleGenerate} isLoading={loading}>Generate Paper</Button>
        </div>
      </Card>

      <h2>Your Mock Exams</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {papers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No mock exams generated yet.</p>
        ) : (
          papers.map(p => (
            <Card key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <BookOpen size={20} color="var(--primary-color)" /> 
                  Exam #{p.id}
                </h3>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {new Date(p.generated_at).toLocaleDateString()}
                </span>
              </div>
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: '0.25rem 0' }}>Course ID: {p.course_id}</p>
                <p style={{ margin: '0.25rem 0' }}>Total Marks: {p.total_marks}</p>
                <p style={{ margin: '0.25rem 0' }}>Difficulty: {p.difficulty}</p>
              </div>
              <Button onClick={() => handleTakeExam(p.id)} style={{ width: '100%' }}>Take Exam</Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
