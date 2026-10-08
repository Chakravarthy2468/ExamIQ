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

  const [evaluating, setEvaluating] = useState<Record<number, boolean>>({});

  const handleSubmitAnswer = async (questionId: number) => {
    const text = answers[questionId];
    if (!text) return;
    
    setEvaluating(prev => ({ ...prev, [questionId]: true }));
    try {
      const res = await apiClient.post('/evaluations/submit', {
        mock_question_id: questionId,
        text_content: text
      });
      setEvaluations(prev => ({ ...prev, [questionId]: res.data.evaluation }));
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(prev => ({ ...prev, [questionId]: false }));
    }
  };

  if (activePaper) {
    const paperCourse = courses.find(c => c.id === activePaper.course_id);
    
    return (
      <div className="animate-fade-in-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="secondary" onClick={() => setActivePaper(null)} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>{paperCourse ? paperCourse.name : 'Exam Mode'}</h1>
            <p style={{ color: '#555555', fontSize: '15px', margin: 0 }}>Answer questions and receive detailed evaluations.</p>
          </div>
        </div>
        
        {activePaper.questions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '64px 32px' }}>
            <p style={{ color: '#111111', fontWeight: 500, fontSize: '16px' }}>No questions found for this course's mock exam.</p>
            <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px' }}>Please make sure a Question Paper (PYQ) document is uploaded and processed.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {activePaper.questions.map((q: any, index: number) => (
              <Card key={q.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '17px', lineHeight: 1.5, margin: 0, flex: 1, fontWeight: 500, color: '#111111' }}>
                    <span style={{ color: '#6B6B6B', marginRight: '12px' }}>Q{index + 1}.</span>
                    {q.text}
                  </h3>
                  <span style={{ 
                    fontSize: '13px', fontWeight: 600, color: '#333333',
                    background: '#FAFAFB', padding: '6px 12px', 
                    borderRadius: '8px', border: '1px solid var(--border-color)',
                    marginLeft: '24px', whiteSpace: 'nowrap'
                  }}>
                    {q.marks} Marks
                  </span>
                </div>
              
                <textarea 
                  value={answers[q.id] || ''} 
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Type your answer here..."
                  style={{ 
                    width: '100%', minHeight: '140px', padding: '16px', 
                    borderRadius: '10px', border: '1px solid #CFCFD4', 
                    marginBottom: '20px', background: '#FFFFFF', color: '#171717',
                    fontFamily: 'var(--font-sans)', fontSize: '15px', resize: 'vertical',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#111111'; e.target.style.boxShadow = '0 0 0 2px #111111'; }}
                  onBlur={e => { e.target.style.borderColor = '#CFCFD4'; e.target.style.boxShadow = 'none'; }}
                />
              
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    onClick={() => handleSubmitAnswer(q.id)} 
                    icon={<Send size={16} />} 
                    disabled={!answers[q.id]}
                    isLoading={evaluating[q.id]}
                  >
                    Evaluate Answer
                  </Button>
                </div>
              
                {evaluations[q.id] && (
                  <div className="animate-fade-in-up" style={{ 
                    marginTop: '32px', padding: '24px', 
                    background: '#FAFAFB', borderRadius: '12px', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#111111', marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>
                      <CheckCircle size={20} color="var(--success-color)" /> Evaluation Results
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div style={{ border: '1px solid var(--border-color)', background: '#FFFFFF', padding: '16px', borderRadius: '10px' }}>
                        <span style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 500 }}>Marks Awarded</span>
                        <span style={{ fontSize: '24px', fontWeight: 600, color: '#111111' }}>{evaluations[q.id].obtained_marks} <span style={{ fontSize: '15px', color: '#777777', fontWeight: 500 }}>/ {q.marks}</span></span>
                      </div>
                      <div style={{ border: '1px solid var(--border-color)', background: '#FFFFFF', padding: '16px', borderRadius: '10px' }}>
                        <span style={{ display: 'block', fontSize: '13px', color: '#6B6B6B', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 500 }}>Completeness</span>
                        <span style={{ fontSize: '24px', fontWeight: 600, color: '#111111' }}>{evaluations[q.id].completeness}%</span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '14px', color: '#111111', display: 'block', marginBottom: '6px' }}>Feedback:</strong>
                      <p style={{ fontSize: '15px', margin: 0, lineHeight: 1.6, color: '#4F4F52' }}>{evaluations[q.id].feedback}</p>
                    </div>
                    
                    {evaluations[q.id].missing_concepts && (
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <strong style={{ fontSize: '14px', color: '#111111', display: 'block', marginBottom: '6px' }}>Missing Concepts:</strong>
                        <p style={{ fontSize: '15px', margin: 0, lineHeight: 1.6, color: '#4F4F52' }}>{evaluations[q.id].missing_concepts}</p>
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
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '8px' }}>Mock Exams</h1>
        <p style={{ color: '#555555', fontSize: '16px' }}>Generate and take practice exams tailored to your course material.</p>
      </div>
      
      <Card style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ border: '1px solid var(--border-color)', background: '#FAFAFB', padding: '10px', borderRadius: '10px', color: '#111111' }}>
            <Sparkles size={20} />
          </div>
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 600, color: '#111111' }}>Generate New Paper</h2>
        </div>
        
        {message && (
          <div className="animate-fade-in-up" style={{ padding: '16px', background: 'var(--success-subtle)', border: '1px solid rgba(30, 142, 62, 0.2)', color: 'var(--success-color)', borderRadius: '10px', marginBottom: '24px', fontSize: '15px', fontWeight: 500 }}>
            {message}
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#333333', marginBottom: '8px' }}>Select Course</label>
            <select 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CFCFD4', background: '#FFFFFF', color: '#171717', fontSize: '15px', outline: 'none' }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {courses.length === 0 && <option value="" disabled>No courses available</option>}
            </select>
          </div>
          <Button onClick={handleGenerate} isLoading={loading}>
            Generate Paper
          </Button>
        </div>
      </Card>

      <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600, color: '#171717' }}>Available Papers</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {papers.length === 0 ? (
          <p style={{ color: '#6B6B6B', fontSize: '15px', gridColumn: '1 / -1' }}>No mock exams generated yet.</p>
        ) : (
          papers.map(p => {
            const paperCourse = courses.find(c => c.id === p.course_id);
            return (
              <Card key={p.id} hover style={{ display: 'flex', flexDirection: 'column', padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', color: '#111111', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
                    {paperCourse ? paperCourse.name : `Exam #${p.id}`}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6B6B6B', margin: 0, lineHeight: 1.5 }}>
                    {p.total_marks} questions · {p.total_marks} marks<br/>
                    {p.difficulty} difficulty
                  </p>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <Button onClick={() => handleTakeExam(p.id)} variant="secondary" style={{ width: '100%' }}>
                    Take Exam
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
