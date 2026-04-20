import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-card
        ${hoverable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] hover:border-[var(--color-border-hover)] transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 mb-0 border-b border-[var(--color-border)] ${className}`}>{children}</div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 bg-[var(--color-surface)] border-t border-[var(--color-border)] ${className}`}>{children}</div>
);

