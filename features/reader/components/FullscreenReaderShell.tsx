"use client";

import React, { useEffect, useRef } from 'react';
import { X, Maximize2, ShieldAlert } from 'lucide-react';
import { useFullscreenGuard } from '@/features/reader/hooks/useFullscreenGuard';

interface FullscreenReaderShellProps {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}

/**
 * FullscreenReaderShell Component
 * 
 * Provides a secure wrapper that enforces browser fullscreen mode for the PDF.
 * - Automatically requests fullscreen on mount.
 * - Provides a "Hard Exit" button.
 * - Locks body scrolling.
 * - Triggers onClose (security exit) if fullscreen is exited unexpectedly.
 * 
 * @param children The SecureReader component.
 * @param onClose Callback when exiting fullscreen (intentional or security event).
 * @param title Book title for the overlay.
 */
export function FullscreenReaderShell({ children, onClose, title }: FullscreenReaderShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  
  // Initialize fullscreen guard with the onClose callback as the security exit
  const { isFullscreen, error, enterFullscreen, exitFullscreen } = useFullscreenGuard(onClose);

  // Handle ESC and Navigation shortcuts
  useEffect(() => {
    const handleEvents = (e: KeyboardEvent) => {
      // Prevent Alt+Right/Left navigation
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
      }
    };

    // Body scroll lock
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleEvents);
    
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleEvents);
    };
  }, []);

  const handleManualExit = async () => {
    await exitFullscreen();
    onClose();
  };

  return (
    <div 
      ref={shellRef} 
      className="fixed inset-0 z-[9999] bg-black flex flex-col overflow-hidden select-none"
    >
      {/* ── Top Floating Overlay ────────────────────────────────────── */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 h-14 z-[10000] flex items-center justify-between px-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="flex items-center gap-3 animate-fade-in pointer-events-auto">
            <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-400/20 outline-none select-none">
              <Maximize2 className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight truncate max-w-xs">{title}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-1">
                <ShieldAlert className="w-2.5 h-2.5 text-amber-500" /> Secure Reader Mode
              </p>
            </div>
          </div>

          <button
            onClick={handleManualExit}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-gray-300 transition-all active:scale-95 group"
          >
            <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            Exit Fullscreen
          </button>
        </div>
      )}

      {/* ── Reader Content ─────────────────────────────────────────── */}
      <div className="flex-1 w-full h-full relative overflow-hidden min-h-0">
        {children}
      </div>

      {/* ── Gesture Initiation Overlay ──────────────────────────────── */}
      {!isFullscreen && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-[10001] animate-fade-in">
          <div className="text-center p-10 bg-white border border-[var(--color-border)] rounded-xl max-w-md w-full shadow-lg">
            <div className="w-20 h-20 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-[var(--color-primary)]/20">
              <ShieldAlert className="w-10 h-10 text-[var(--color-primary)]" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Secure Reader Mode</h2>
            <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed">
              To proceed, the browser must enter fullscreen mode. This ensures a protected environment for the digital content.
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[var(--color-error)] animate-shake">
                {error}
              </div>
            )}

            <button
              onClick={() => shellRef.current && enterFullscreen(shellRef.current)}
              className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 group transition-all"
            >
              <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Start Reading Now
            </button>

            <button
              onClick={onClose}
              className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors uppercase tracking-widest font-bold"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
