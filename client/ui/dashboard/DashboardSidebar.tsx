"use client";

/**
 * DashboardSidebar — traditional collapsible sidebar.
 *
 * - Sits at the left edge of the screen, below the navbar, above the footer
 * - Plain white background with a right border
 * - Expanded (240px): avatar + name + section titles + icon+label nav items
 * - Collapsed (64px): avatar + icon-only nav items + tooltips on hover
 * - Smooth 200ms width transition
 * - Toggle: chevron button on the bottom of the sidebar
 * - State persisted in localStorage
 * - Mobile: stacks full-width above content (no collapse)
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  BookOpen,
  PlusCircle,
  ShieldCheck,
  Users,
  Tags,
  ClipboardCheck,
  Library as LibraryIcon,
  Receipt,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: SidebarIconKey;
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

export type SidebarIconKey =
  | "user"
  | "bookOpen"
  | "plusCircle"
  | "shieldCheck"
  | "users"
  | "tags"
  | "clipboardCheck"
  | "library"
  | "receipt";

const ICON_MAP: Record<SidebarIconKey, LucideIcon> = {
  user: User,
  bookOpen: BookOpen,
  plusCircle: PlusCircle,
  shieldCheck: ShieldCheck,
  users: Users,
  tags: Tags,
  clipboardCheck: ClipboardCheck,
  library: LibraryIcon,
  receipt: Receipt,
};

const STORAGE_KEY = "sidebar-collapsed";

interface DashboardSidebarProps {
  sections: SidebarSection[];
}

export function DashboardSidebar({ sections }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isCollapsed = mounted && collapsed;

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={`relative hidden lg:flex flex-col flex-shrink-0 bg-white border-r border-[var(--color-border)] transition-[width] duration-200 ease-in-out overflow-visible ${
          isCollapsed ? "w-20" : "w-60"
        }`}
      >
        {/* Collapse toggle — half in, half out on the right edge,
            anchored to the aside (the identity block that used to host
            it has been removed so the nav starts directly with Account). */}
        <button
          type="button"
          onClick={toggle}
          className="absolute -right-3 top-1 w-6 h-6 rounded-full bg-[var(--color-primary)] text-white shadow-md flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors z-10"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Nav — no overflow clipping so tooltips can extend beyond the sidebar edge */}
        <nav className="flex-1 py-4 px-2">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
              {/* Section title */}
              {section.title && !isCollapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {section.title}
                </p>
              )}
              {isCollapsed && sIdx > 0 && (
                <div className="mx-2 mb-2 h-px bg-[var(--color-border)]" />
              )}

              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isActive(item.href);
                  return (
                    <li key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        className={`flex items-center rounded-lg transition-all duration-150 ${
                          isCollapsed
                            ? "justify-center w-10 h-10 mx-auto"
                            : "gap-3 px-3 py-2"
                        } ${
                          active
                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                            : "text-[var(--color-text-body)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                          active ? "text-white" : "text-[var(--color-text-muted)]"
                        }`} />
                        {!isCollapsed && (
                          <span className="text-[13px] font-semibold truncate">
                            {item.label}
                          </span>
                        )}
                      </Link>

                      {/* Tooltip */}
                      {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-md bg-[var(--color-text-main)] text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                          {item.label}
                          {/* Arrow */}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--color-text-main)]" />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

      </aside>

      {/* ── Mobile sidebar (stacks above content) ── */}
      <div className="lg:hidden border-b border-[var(--color-border)] bg-white">
        <nav className="flex overflow-x-auto gap-1 px-3 py-3 no-scrollbar">
          {sections.flatMap((s) => s.items).map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-text-body)] hover:text-[var(--color-primary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
