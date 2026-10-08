import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
      {label && <label>{label}</label>}
      <input
        className={className}
        style={{
          borderColor: error ? 'var(--danger-color)' : undefined,
          ...props.style
        }}
        {...props}
      />
      {hint && !error && <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{hint}</span>}
      {error && <span style={{ fontSize: '13px', color: 'var(--danger-color)' }}>{error}</span>}
    </div>
  );
};
