import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new URLSearchParams();
      data.append('username', email);
      data.append('password', password);

      const res = await apiClient.post('/auth/login', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const token = res.data.access_token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      login(token, role);
      navigate('/student');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-color)',
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99, 133, 255, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', left: '-5%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in-up" style={{
        width: '100%', maxWidth: '380px',
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 1rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }} className="text-gradient">ExamIQ</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>AI-powered exam preparation</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-subtle)', color: 'var(--danger-color)',
            padding: '0.625rem 0.75rem', borderRadius: 'var(--radius)',
            marginBottom: '1rem', fontSize: '0.8125rem',
            border: '1px solid rgba(248, 113, 113, 0.15)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@university.edu"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
          <Button type="submit" style={{ width: '100%', marginTop: '0.5rem' }} isLoading={loading} icon={<ArrowRight size={16} />}>
            Sign In
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '0.375rem' }}>Quick access:</p>
          <button
            onClick={() => { setEmail('student@examiq.com'); setPassword('student123'); }}
            style={{
              background: 'none', border: '1px solid var(--border-color)',
              color: 'var(--primary-color)', cursor: 'pointer',
              padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
              transition: 'background var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            Demo Student
          </button>
        </div>
      </div>
    </div>
  );
};
