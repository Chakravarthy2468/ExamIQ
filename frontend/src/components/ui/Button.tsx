import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyle = {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  };

  const variants = {
    primary: {
      background: 'var(--primary-color)',
      color: '#fff',
      boxShadow: 'var(--shadow-glow)',
    },
    secondary: {
      background: 'var(--surface-color-light)',
      color: 'var(--text-primary)',
    },
    danger: {
      background: 'var(--danger-color)',
      color: '#fff',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    }
  };

  const style = { ...baseStyle, ...variants[variant], opacity: isLoading ? 0.7 : 1, ...props.style };

  return (
    <button style={style} disabled={isLoading || props.disabled} className={`hover-scale ${className}`} {...props}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
