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
  const baseClass = `btn btn-${variant}`;
  
  const style: React.CSSProperties = {
    padding: size === 'sm' ? '8px 14px' : size === 'lg' ? '14px 24px' : '10px 18px',
    fontSize: size === 'sm' ? '14px' : size === 'lg' ? '16px' : '15px',
    ...props.style,
  };

  return (
    <button
      className={`${baseClass} ${className}`}
      style={style}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'currentColor', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
          Wait...
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
