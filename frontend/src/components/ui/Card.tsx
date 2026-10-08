import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, className = '', style = {}, hover = false }) => {
  return (
    <div
      className={`surface ${hover ? 'hover-lift' : ''} ${className}`}
      style={{ padding: '32px', ...style }}
    >
      {title && (
        <div style={{ marginBottom: subtitle ? '8px' : '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111111' }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '14px', color: '#6B6B6B', margin: '6px 0 16px' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
