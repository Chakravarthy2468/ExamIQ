import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
      {label && (
        <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        style={{
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius)',
          border: `1px solid ${error ? 'var(--danger-color)' : 'var(--border-color)'}`,
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          outline: 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          width: '100%',
        }}
        className={className}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--border-focus)';
          e.target.style.boxShadow = '0 0 0 3px rgba(99, 133, 255, 0.08)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger-color)' : 'var(--border-color)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {hint && !error && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</span>}
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--danger-color)' }}>{error}</span>}
    </div>
  );
};
