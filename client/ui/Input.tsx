'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)]
            py-2.5 ${icon ? 'pl-10' : 'px-4'} pr-4
            text-[var(--color-text-main)] placeholder:text-[var(--color-text-light)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:border-[var(--color-primary)]
            transition-all duration-200
            ${error ? 'border-[var(--color-error)] focus:ring-[var(--color-error)]/15 focus:border-[var(--color-error)]' : ''}
            ${className}
          `}
          {...props}
        />

      </div>
      {error && (
        <span className="text-xs text-rose-500 mt-1 ml-1">{error}</span>
      )}
    </div>
  );
};
