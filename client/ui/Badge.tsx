import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const variants = {
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
    secondary: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]',
    success: 'bg-[var(--color-accent-light)] text-[var(--color-success)]',
    warning: 'bg-amber-50 text-[var(--color-warning)]',
    error: 'bg-red-50 text-[var(--color-error)]',
  };

  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
