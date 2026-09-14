import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string }> = ({ children, title, className = '' }) => {
  return (
    <div className={`glass ${className}`} style={{ padding: '1.5rem', marginBottom: '1rem' }}>
      {title && <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>{title}</h3>}
      {children}
    </div>
  );
};
