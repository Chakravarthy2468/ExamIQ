import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import apiClient from '../../api/client';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Register User
      await apiClient.post('/auth/register', {
        email: email,
        password: password,
        full_name: fullName,
        role: "STUDENT"
      });

      // 2. Automatically Login
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
      setError(typeof detail === 'string' ? detail : 'Failed to register. Please try again.');
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
      padding: '24px'
    }}>
      <div className="animate-fade-in-up" style={{
        width: '100%', maxWidth: '420px',
      }}>
        <Card style={{ padding: '40px 32px' }}>
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: 48, height: 48, margin: '0 auto 16px',
              borderRadius: '12px',
              background: '#111111',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#111111' }}>Create an Account</h1>
            <p style={{ fontSize: '15px', color: '#555555' }}>Join ExamIQ to boost your grades.</p>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-subtle)', color: 'var(--danger-color)',
              padding: '12px 16px', borderRadius: '8px',
              marginBottom: '24px', fontSize: '14px',
              border: '1px solid rgba(217, 48, 37, 0.2)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@university.edu"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button type="submit" style={{ width: '100%', marginTop: '8px' }} isLoading={loading}>
              Sign Up
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#555555' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#111111', fontWeight: 500, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
