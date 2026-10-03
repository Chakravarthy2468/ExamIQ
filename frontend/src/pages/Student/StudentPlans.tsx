import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';
import { Calendar, Clock, BookOpen, CheckCircle, Sparkles } from 'lucide-react';

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

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Study Plans</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Generate AI-optimized schedules based on syllabus and PYQ analysis.</p>
      </div>

      {error && (
        <div style={{ padding: '0.875rem 1rem', background: 'var(--danger-subtle)', border: '1px solid rgba(248, 113, 113, 0.2)', color: 'var(--danger-color)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <Card style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--accent-subtle)', padding: '0.5rem', borderRadius: 'var(--radius)', color: 'var(--accent-color)' }}>
            <Calendar size={20} />
          </div>
          <h2 style={{ fontSize: '1.125rem' }}>Plan Parameters</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-start' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Select Course</label>
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button 
            onClick={handleGenerate}
            disabled={loading || !selectedCourse}
            icon={<Sparkles size={16} />}
          >
            Generate Optimized Plan
          </Button>
        </div>
      </Card>

      {plan && plan.schedule && (
        <div className="animate-fade-in-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <CheckCircle size={20} className="text-primary" /> 
            <h2 style={{ fontSize: '1.125rem', margin: 0 }}>Your Generated Schedule</h2>
          </div>
          
          {JSON.parse(plan.schedule).days.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>No topics found for this course.</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Please make sure a Syllabus document is uploaded and processed first.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {JSON.parse(plan.schedule).days.map((day: any) => (
                <Card key={day.day} hover style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.9375rem', color: 'var(--primary-color)', margin: 0 }}>Day {day.day}</h3>
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    {day.tasks.map((task: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-sm)', transition: 'background var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <BookOpen size={16} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{task.topic_name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', background: 'var(--bg-elevated)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                          <Clock size={14} />
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
