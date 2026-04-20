'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, BookOpen, LogOut, ChevronDown, ArrowRight, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/client/auth/SessionProvider';
import { logoutAction } from '@/features/auth/actions/logout.action';
import { CartIconButton } from './CartIconButton';

const NAV_LINKS = [
  { label: 'Study Materials', href: '/departments/all-departments' },
  { label: 'About Author', href: '/doctors/dr.-rohan' },
];

export const NavigationBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = user ? `${user.firstName} ${user.lastName}` : '';
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key closes everything
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16">
          <div className="flex items-center justify-between h-16">

            {/* ── Left: Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--color-primary)]">
                PulmoPrep
              </span>
            </Link>

            {/* ── Center: Desktop Nav Links (lg+) ── */}
            {/* <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive(link.href)
                      ? 'text-[var(--color-primary)] font-semibold bg-[var(--color-primary-light)]'
                      : 'text-[var(--color-text-body)] hover:text-[var(--color-primary)] hover:bg-slate-50'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div> */}

            {/* ── Right: Desktop Auth (lg+) + Hamburger (<lg) ── */}
            <div className="flex items-center gap-3">
              {/* Desktop auth — only at lg+ */}
              {!isAuthenticated ? (
                <div className="hidden lg:flex items-center gap-3">
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 text-sm font-semibold text-[var(--color-orange)] border border-[var(--color-orange)] rounded-lg hover:bg-[var(--color-orange-light)] transition-all duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="px-5 py-2 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  {/* Cart icon — present whenever authenticated */}
                  <CartIconButton />

                  <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 hover:border-[var(--color-primary)]/30 bg-white hover:bg-slate-50 transition-all duration-200"
                  >
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--color-text-main)] leading-tight">{displayName}</p>
                      <p className="text-[10px] font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                        {user?.userType === 'AUTHOR' ? 'Author' : 'Reader'}
                      </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {initials || <User className="h-4 w-4" />}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg shadow-slate-200/50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="px-3 py-3 mb-1">
                        <p className="text-sm font-semibold text-[var(--color-text-main)] truncate">{displayName}</p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
                      </div>
                      <div className="h-px bg-slate-100 mx-1 mb-1" />
                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-text-body)] hover:bg-slate-50 rounded-lg transition-colors group"
                      >
                        <LayoutDashboard className="h-4 w-4 text-slate-400 group-hover:text-[var(--color-primary)] transition-colors" />
                        Dashboard
                      </Link>
                      <div className="h-px bg-slate-100 mx-1 my-1" />
                      <form action={async () => {
                        setIsProfileOpen(false);
                        await logoutAction();
                      }}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-error)] hover:bg-red-50 rounded-lg transition-colors group"
                        >
                          <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                          Log Out
                        </button>
                      </form>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* Hamburger — visible below lg */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 -mr-1 rounded-lg text-[var(--color-text-body)] hover:bg-slate-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Slide-out Drawer (right side) ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 lg:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-72 max-w-[80vw] bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${isMobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
          <Link href="/" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--color-primary)]">PulmoPrep</span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 -mr-2 rounded-lg text-[var(--color-text-muted)] hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex flex-col h-[calc(100%-64px)]">
          {/* Nav links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {/* {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive(link.href)
                    ? 'text-[var(--color-primary)] font-semibold bg-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-body)] hover:bg-slate-50 hover:text-[var(--color-primary)]'
                  }
                `}
              >
                {link.label}
              </Link>
            ))} */}

            {isAuthenticated && (
              <>
                <div className="h-px bg-slate-100 mx-2 my-2" />
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text-body)] hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  Dashboard
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--color-text-body)] hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <ShoppingCart className="h-4 w-4 text-slate-400" />
                  Cart
                </Link>
              </>
            )}
          </div>

          {/* Drawer footer — auth actions */}
          <div className="border-t border-slate-100 px-4 py-5 space-y-3">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => { setIsMobileOpen(false); router.push('/login'); }}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-[var(--color-orange)] border border-[var(--color-orange)] rounded-lg hover:bg-[var(--color-orange-light)] transition-colors text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsMobileOpen(false); router.push('/register'); }}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors text-center flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-1 mb-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials || <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-main)] truncate">{displayName}</p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
                  </div>
                </div>
                <form action={async () => {
                  setIsMobileOpen(false);
                  await logoutAction();
                }}>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--color-error)] border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
