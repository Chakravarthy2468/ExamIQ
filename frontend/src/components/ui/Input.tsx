import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    marginBottom: '1rem',
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.75rem',
    borderRadius: 'var(--radius)',
    border: `1px solid ${error ? 'var(--danger-color)' : 'var(--border-color)'}`,
    background: 'var(--bg-color)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={containerStyle}>
      {label && <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</label>}
      <input 
        style={inputStyle} 
        className={className} 
        {...props} 
        onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; }}
        onBlur={(e) => { e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--border-color)'; }}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{error}</span>}
    </div>
  );
};
