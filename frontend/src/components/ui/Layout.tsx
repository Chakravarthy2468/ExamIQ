import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, FileText, BookOpen, PenTool, BarChart3, GraduationCap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return <>{children}</>;

  const links = [
    { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={18} /> },
    { name: 'Documents', path: '/student/documents', icon: <FileText size={18} /> },
    { name: 'Study Plans', path: '/student/plans', icon: <BookOpen size={18} /> },
    { name: 'Mock Exams', path: '/student/exams', icon: <PenTool size={18} /> },
    { name: 'Reports', path: '/student/reports', icon: <BarChart3 size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          borderRight: '1px solid var(--border-color)',
          background: 'var(--bg-elevated)',
          padding: '1.5rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0 0.75rem',
            marginBottom: '2rem',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/student')}
        >
          <div style={{
            width: 32, height: 32,
            borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }} className="text-gradient">
            ExamIQ
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  background: isActive ? 'var(--primary-subtle)' : 'transparent',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.8625rem',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.icon}
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.8625rem',
              fontFamily: 'var(--font-sans)',
              transition: 'color var(--transition-fast)',
              width: '100%',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          marginLeft: '240px',
          padding: '2rem 2.5rem',
          flex: 1,
          maxWidth: '1100px',
        }}
        className="animate-fade-in"
      >
        {children}
      </main>
    </div>
  );
};
