import React from 'react';
import ClientLayoutShell from './ClientLayoutShell';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <ClientLayoutShell>
        {/* `min-h-[calc(100dvh-8rem)]` keeps the content region a
            consistent height across pages (roughly viewport minus
            navbar + footer) so short pages don't leave a gap and the
            footer always sits at a predictable place. `flex-1` keeps
            long content expanding past that floor naturally. */}
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-6 lg:px-8 2xl:px-16 py-8 min-h-[calc(100dvh-6rem)] animate-in fade-in duration-500">
          {children}
        </main>
      </ClientLayoutShell>
      <Footer />
    </div>
  );
};
