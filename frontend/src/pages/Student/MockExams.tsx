import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';
import { BookOpen, CheckCircle, PenTool, Sparkles, Send, ArrowLeft } from 'lucide-react';

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
    setMessage('');
    try {
      await apiClient.post(`/mock_papers/generate/${selectedCourse}?difficulty=MEDIUM&total_marks=50`);
      setMessage('Mock paper generated successfully!');
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
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitAnswer = async (questionId: number) => {
    const text = answers[questionId];
    if (!text) return;
    
    // Optimistic UI update or loading state could go here
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
      <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button variant="ghost" size="sm" onClick={() => setActivePaper(null)} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Exam Mode</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Answer questions to receive AI evaluation.</p>
          </div>
        </div>
        
        {activePaper.questions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>No questions found for this course's mock exam.</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please make sure a Question Paper (PYQ) document is uploaded and processed.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activePaper.questions.map((q: any, index: number) => (
              <Card key={q.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.0625rem', lineHeight: 1.5, margin: 0, flex: 1 }}>
                    <span style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>Q{index + 1}.</span>
                    {q.text}
                  </h3>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
                    background: 'var(--bg-elevated)', padding: '0.25rem 0.5rem', 
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                    marginLeft: '1rem', whiteSpace: 'nowrap'
                  }}>
                    {q.marks} Marks
                  </span>
                </div>
              
                <textarea 
                  value={answers[q.id] || ''} 
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer here..."
                  style={{ 
                    width: '100%', minHeight: '120px', padding: '0.875rem', 
                    borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', 
                    marginBottom: '1rem', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)', fontSize: '0.875rem', resize: 'vertical'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={() => handleSubmitAnswer(q.id)} 
                    icon={<Send size={14} />} 
                    disabled={!answers[q.id]}
                  >
                    Evaluate Answer
                  </Button>
                </div>
              
                {evaluations[q.id] && (
                  <div className="animate-fade-in-up" style={{ 
                    marginTop: '1.5rem', padding: '1.25rem', 
                    background: 'var(--surface-hover)', borderRadius: 'var(--radius)', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', marginBottom: '1rem', fontSize: '0.9375rem' }}>
                      <CheckCircle size={18} /> AI Evaluation Results
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Marks Awarded</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{evaluations[q.id].obtained_marks} <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ {q.marks}</span></span>
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Completeness</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{evaluations[q.id].completeness}%</span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Feedback:</strong>
                      <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>{evaluations[q.id].feedback}</p>
                    </div>
                    
                    {evaluations[q.id].missing_concepts && (
                      <div>
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--warning-color)', display: 'block', marginBottom: '0.25rem' }}>Missing Concepts:</strong>
                        <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>{evaluations[q.id].missing_concepts}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Mock Exams</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Generate and take practice exams tailored to your syllabus and PYQs.</p>
      </div>
      
      <Card style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--success-subtle)', padding: '0.5rem', borderRadius: 'var(--radius)', color: 'var(--success-color)' }}>
            <Sparkles size={20} />
          </div>
          <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Generate New Paper</h2>
        </div>
        
        {message && (
          <div className="animate-fade-in-up" style={{ padding: '0.75rem 1rem', background: 'var(--success-subtle)', border: '1px solid rgba(52, 211, 153, 0.2)', color: 'var(--success-color)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {message}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Select Course</label>
            <select 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
              {courses.length === 0 && <option value="" disabled>No courses available</option>}
            </select>
          </div>
          <Button onClick={handleGenerate} isLoading={loading} icon={<PenTool size={16} />}>
            Generate Paper
          </Button>
        </div>
      </Card>

      <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Available Papers</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {papers.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', gridColumn: '1 / -1' }}>No mock exams generated yet.</p>
        ) : (
          papers.map(p => (
            <Card key={p.id} hover style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--primary-subtle)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary-color)' }}>
                    <BookOpen size={18} />
                  </div>
                  <h3 style={{ fontSize: '1rem', margin: 0 }}>Exam #{p.id}</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(p.generated_at).toLocaleDateString()}
                </span>
              </div>
              
              <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Course ID</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.course_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Marks</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.total_marks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Difficulty</span>
                  <span style={{ fontWeight: 500, color: 'var(--warning-color)' }}>{p.difficulty}</span>
                </div>
              </div>
              
              <div style={{ marginTop: 'auto' }}>
                <Button onClick={() => handleTakeExam(p.id)} variant="secondary" style={{ width: '100%' }}>
                  Take Exam
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
