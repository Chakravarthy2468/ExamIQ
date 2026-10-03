import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Calendar, Clock, BookOpen, CheckCircle } from 'lucide-react';

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
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="text-gradient" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar /> Smart Study Planner
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Generate an AI-optimized study schedule based on syllabus importance.
      </p>

      {error && (
        <div style={{ background: 'var(--danger-color)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'end' }}>
          <div>
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
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Days Available</label>
            <input 
              type="number"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hours per Day</label>
            <input 
              type="number"
              step="0.5"
              value={hoursPerDay}
              onChange={e => setHoursPerDay(Number(e.target.value))}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', background: 'var(--background-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        
        <button 
          onClick={handleGenerate}
          disabled={loading || !selectedCourse}
          style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }}
          className="btn btn-primary"
        >
          {loading ? 'Generating Plan...' : 'Generate Optimized Plan'}
        </button>
      </div>

      {plan && plan.schedule && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle className="text-primary" /> Your Generated Schedule</h2>
          {JSON.parse(plan.schedule).days.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
              <p>No topics found for this course.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Please make sure a Syllabus document is uploaded and processed first.</p>
            </div>
          ) : (
            JSON.parse(plan.schedule).days.map((day: any) => (
              <div key={day.day} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Day {day.day}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {day.tasks.map((task: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <BookOpen size={16} className="text-secondary" />
                      <span>{task.topic_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Clock size={16} />
                      <span>{task.hours} hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
