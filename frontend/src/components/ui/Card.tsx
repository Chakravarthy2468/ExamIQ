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
      className={`glass ${hover ? 'hover-lift' : ''} ${className}`}
      style={{ padding: '1.25rem', ...style }}
    >
      {title && (
        <div style={{ marginBottom: subtitle ? '0.25rem' : '1rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
