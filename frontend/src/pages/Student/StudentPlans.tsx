import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';
import { Calendar, Clock, BookOpen, Check, Sparkles } from 'lucide-react';

export const StudentPlans: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [days, setDays] = useState<number>(30);
  const [hoursPerDay, setHoursPerDay] = useState<number>(2.0);
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/courses')
      .then(res => {
        setCourses(res.data);
        if (res.data.length > 0) setSelectedCourse(res.data[0].id.toString());
      })
      .catch(err => console.error('Failed to load courses', err));
  }, []);

  const handleGenerate = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post(`/study_plans/generate/${selectedCourse}?days=${days}&hours_per_day=${hoursPerDay}`);
      setPlan(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCourse = async () => {
    if (!selectedCourse) return;
    if (!window.confirm('Are you sure you want to permanently DELETE this course and ALL its associated PYQs, syllabus, study plans, and analytics? This action cannot be undone.')) return;
    
    setLoading(true);
    setError('');
    try {
      await apiClient.delete(`/courses/${selectedCourse}/reset`);
      setPlan(null);
      setCourses(prev => prev.filter(c => c.id.toString() !== selectedCourse));
      setSelectedCourse('');
      alert('Course successfully deleted!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset course data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '8px' }}>Study Plans</h1>
        <p style={{ color: '#555555', fontSize: '16px' }}>Generate a personalized schedule based on your course syllabus and past papers.</p>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'var(--danger-subtle)', border: '1px solid rgba(217, 48, 37, 0.2)', color: 'var(--danger-color)', borderRadius: '10px', marginBottom: '32px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <Card style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ border: '1px solid var(--border-color)', padding: '10px', borderRadius: '10px', color: '#111111', background: '#FAFAFB' }}>
            <Calendar size={20} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#111111' }}>Plan Parameters</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#333333', marginBottom: '8px' }}>Select Course</label>
            <select 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #CFCFD4', background: '#FFFFFF', color: '#171717', fontSize: '15px', outline: 'none', marginBottom: '20px' }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {courses.length === 0 && <option value="" disabled>No courses available</option>}
            </select>
          </div>
          <Input 
            label="Days Available"
            type="number"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            min={1}
            max={180}
          />
          <Input 
            label="Hours per Day"
            type="number"
            step="0.5"
            value={hoursPerDay}
            onChange={e => setHoursPerDay(Number(e.target.value))}
            min={0.5}
            max={16}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
          <Button
            onClick={handleResetCourse}
            disabled={loading || !selectedCourse}
            variant="secondary"
            style={{ color: '#D93025', borderColor: 'rgba(217, 48, 37, 0.3)', background: 'rgba(217, 48, 37, 0.05)' }}
          >
            Delete Course
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={loading || !selectedCourse}
          >
            Generate Study Plan
          </Button>
        </div>
      </Card>

      {!plan ? (
        <Card style={{ textAlign: 'center', padding: '64px 32px', background: '#FAFAFB', borderStyle: 'dashed' }}>
          <h3 style={{ fontSize: '18px', color: '#111111', fontWeight: 500, marginBottom: '8px' }}>No Plan Generated</h3>
          <p style={{ color: '#6B6B6B', fontSize: '15px', marginBottom: '24px' }}>Your personalized study plan will appear here.</p>
          <Button onClick={handleGenerate} variant="secondary" disabled={loading || !selectedCourse}>Generate Study Plan</Button>
        </Card>
      ) : (
        <div className="animate-fade-in-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--success-color)', color: '#FFFFFF', borderRadius: '50%' }}>
              <Check size={18} strokeWidth={3} /> 
            </div>
            <h2 style={{ fontSize: '20px', margin: 0, fontWeight: 600, color: '#111111' }}>Your Personalized Schedule</h2>
          </div>
          
          {JSON.parse(plan.schedule).days.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '64px 32px', background: '#FAFAFB' }}>
              <p style={{ color: '#111111', fontWeight: 500, fontSize: '16px' }}>No topics found for this course.</p>
              <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px' }}>Please make sure a Syllabus document is uploaded and processed first.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {JSON.parse(plan.schedule).days.map((day: any) => (
                <Card key={day.day} style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ background: '#FAFAFB', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', color: '#111111', margin: 0, fontWeight: 600 }}>Day {day.day}</h3>
                  </div>
                  <div style={{ padding: '12px' }}>
                    {day.tasks.map((task: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px', transition: 'background var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = '#F2F2F4'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', background: '#E3E3E8', color: '#333333', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                              {task.module_name || 'General Module'}
                            </span>
                            {task.marks > 0 && (
                              <span style={{ fontSize: '12px', background: 'rgba(25, 118, 210, 0.1)', color: '#1976D2', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                {task.marks} Marks from PYQs
                              </span>
                            )}
                            {task.frequency > 0 && (
                              <span style={{ fontSize: '12px', background: 'rgba(217, 48, 37, 0.1)', color: '#D93025', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                Asked {task.frequency} time{task.frequency > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <BookOpen size={18} color="#777777" />
                            <span style={{ fontSize: '15px', color: '#111111', fontWeight: 500 }}>{task.topic_name}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555555', fontSize: '14px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', alignSelf: 'flex-start' }}>
                          <Clock size={16} />
                          <span>{task.hours} hrs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
