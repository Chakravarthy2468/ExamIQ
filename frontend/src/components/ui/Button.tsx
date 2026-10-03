import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.625rem 1.25rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '0.9375rem' },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--primary-color)',
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: 'var(--surface-hover)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
    },
    danger: {
      background: 'var(--danger-subtle)',
      color: 'var(--danger-color)',
      border: '1px solid rgba(248, 113, 113, 0.2)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-color)',
    },
  };

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    cursor: (isLoading || disabled) ? 'not-allowed' : 'pointer',
    opacity: (isLoading || disabled) ? 0.55 : 1,
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
    ...sizes[size],
    ...variants[variant],
    ...props.style,
  };

  return (
    <button
      style={style}
      disabled={isLoading || disabled}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
          Processing…
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};
