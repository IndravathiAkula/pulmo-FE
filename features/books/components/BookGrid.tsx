// BookGrid – simple responsive grid wrapper.
// Separated from BookCard so either can change independently.

import { ReactNode } from 'react';

interface BookGridProps {
  children: ReactNode;
}

export function BookGrid({ children }: BookGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
      {children}
    </div>
  );
}
