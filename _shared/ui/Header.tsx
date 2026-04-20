import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { AuthNav } from '@/features/auth/components/AuthNav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 2xl:px-16">
        <div className="flex items-center justify-between h-[68px]">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--color-primary)]">
              PulmoPrep
            </span>
          </Link>

          <AuthNav />

        </div>
      </div>
    </header>
  );
}
