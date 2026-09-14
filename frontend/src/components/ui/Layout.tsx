import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, BookOpen, User, Users, Activity, FileText, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return <>{children}</>;

  const sidebarStyle: React.CSSProperties = {
    width: '250px',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    borderRight: '1px solid var(--border-color)',
    background: 'var(--surface-color)',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const contentStyle: React.CSSProperties = {
    marginLeft: '250px',
    padding: '2rem',
    minHeight: '100vh',
  };

  const getLinks = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/student', icon: <User size={18} /> },
          { name: 'Mock Exams', path: '/student/exams', icon: <BookOpen size={18} /> },
          { name: 'Reports', path: '/student/reports', icon: <FileText size={18} /> },
        ];
      case 'FACULTY':
        return [
          { name: 'Dashboard', path: '/faculty', icon: <Users size={18} /> },
          { name: 'Review Queue', path: '/faculty/review', icon: <CheckCircle size={18} /> },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: <Activity size={18} /> },
          { name: 'Users', path: '/admin/users', icon: <Users size={18} /> },
        ];
      default:
        return [];
    }
  };

  return (
    <div>
      <div style={sidebarStyle} className="animate-fade-in">
        <h2 className="text-gradient" style={{ marginBottom: '2rem', paddingLeft: '1rem' }}>ExamIQ</h2>
        {getLinks().map(link => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: isActive ? 'var(--primary-color)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                fontWeight: isActive ? 600 : 400,
              }}
              className="hover-scale"
            >
              {link.icon}
              {link.name}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'transparent',
            color: 'var(--danger-color)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          className="hover-scale"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
      <div style={contentStyle} className="animate-fade-in">
        {children}
      </div>
    </div>
  );
};
