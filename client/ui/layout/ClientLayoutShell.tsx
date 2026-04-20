'use client';

import React from 'react';
import { NavigationBar } from '../navigation/NavigationBar';

interface ClientLayoutShellProps {
  children: React.ReactNode;
}

/**
 * ClientLayoutShell acts as a boundary for interactive global components.
 * This prevents Server Layouts (app/layout.tsx) from importing client components directly.
 */
export default function ClientLayoutShell({ children }: ClientLayoutShellProps) {
  return (
    <>
      <NavigationBar />
      {children}
    </>
  );
}
