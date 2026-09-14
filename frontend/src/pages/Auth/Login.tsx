import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';

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
      
      const res = await apiClient.post('/auth/login', data);
      // Decode JWT to get role (simple base64 decode for payload)
      const token = res.data.access_token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      
      login(token, role);
      
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'FACULTY') navigate('/faculty');
      else navigate('/student');
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
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
      background: 'radial-gradient(circle at top right, var(--surface-color-light), var(--bg-color))'
    }}>
      <Card className="animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>ExamIQ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue your journey</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <Input 
            label="Email Address"
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="student@examiq.com"
          />
          <Input 
            label="Password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="••••••••"
          />
          <Button type="submit" style={{ width: '100%', marginTop: '1rem' }} isLoading={loading}>
            Sign In
          </Button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <p>Demo Accounts:</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <span onClick={() => {setEmail('student@examiq.com'); setPassword('student123')}} style={{cursor:'pointer', color:'var(--primary-color)'}}>Student</span>
            <span onClick={() => {setEmail('faculty@examiq.com'); setPassword('faculty123')}} style={{cursor:'pointer', color:'var(--primary-color)'}}>Faculty</span>
            <span onClick={() => {setEmail('admin@examiq.com'); setPassword('admin123')}} style={{cursor:'pointer', color:'var(--primary-color)'}}>Admin</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
