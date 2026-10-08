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
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '240px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          borderRight: '1px solid var(--border-color)',
          background: '#FFFFFF',
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0 12px',
            marginBottom: '32px',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/student')}
        >
          <div style={{
            width: 28, height: 28,
            borderRadius: '6px',
            background: '#111111',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em', color: '#111111' }}>
            ExamIQ
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {links.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/student' && location.pathname.startsWith(link.path));
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: isActive ? '#E9E9EC' : 'transparent',
                  color: isActive ? '#111111' : '#555555',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-sans)',
                  transition: 'background var(--transition-fast), color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) { e.currentTarget.style.background = '#EEEEF0'; e.currentTarget.style.color = '#333333'; }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555555'; }
                }}
              >
                {React.cloneElement(link.icon as React.ReactElement, { color: isActive ? '#111111' : '#555555' })}
                {link.name}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'transparent',
              color: '#555555',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              transition: 'background var(--transition-fast), color var(--transition-fast)',
              width: '100%',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#EEEEF0'; e.currentTarget.style.color = 'var(--danger-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555555'; }}
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
          padding: '40px 48px',
          flex: 1,
          maxWidth: '1200px',
        }}
        className="animate-fade-in"
      >
        {children}
      </main>
    </div>
  );
};
