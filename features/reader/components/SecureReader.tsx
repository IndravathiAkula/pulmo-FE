"use client";

// SecureReader – the core protected PDF viewer.
// This component should ONLY be mounted when access control is confirmed.
// It combines: react-pdf rendering + useReaderSecurity + Watermark overlay.
//
// Security measures active in this component:
//   • user-select:none (CSS)
//   • pointer-events blocked on page canvas layer
//   • All keyboard shortcuts blocked (via hook)
//   • Right-click disabled (via hook)
//   • DevTools detection + blur effect
//   • SVG watermark tiles across every page
//   • PDF.js text layer disabled (no DOM text → no Ctrl+A/C on text)

import { useState, useCallback, useEffect, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

import { useReaderSecurity } from '@/features/reader/security/useReaderSecurity';
import { Watermark } from '@/features/reader/security/Watermark';
import { ChevronLeft, ChevronRight, BookOpen, Shield, AlertTriangle, ZoomIn, ZoomOut } from 'lucide-react';

// Configure pdf.js worker (must be done once; BookPreview also sets this
// but it's idempotent so safe to repeat here)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SecureReaderProps {
    /** Blob URL (tab-local, never the real PDF path) created from the proxy response */
    pdfUrl: string;
    totalPages: number;
    userName: string;
    userEmail: string;
    bookTitle: string;
}

export const SecureReader = memo(function SecureReader({
    pdfUrl,
    totalPages,
    userName: _userName,
    userEmail: _userEmail,
    bookTitle,
}: SecureReaderProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0);
    const [loadError, setLoadError] = useState(false);

    const { devToolsOpen, windowBlurred, screenSharingActive, containerRef, resumeReading } = useReaderSecurity({
        devToolsBlur: true,
        blurOnFocusLost: true,
        holdToReveal: true
    });

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    }, []);


    // Keyboard navigation for page controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle when not in input fields
            if (document.activeElement?.tagName === 'INPUT') return;

            switch (e.key) {
                case 'ArrowLeft':
                    setCurrentPage(p => Math.max(1, p - 1));
                    break;
                case 'ArrowRight':
                    setCurrentPage(p => Math.min(numPages || totalPages, p + 1));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [numPages, totalPages]);

    // Lock body scroll while any security overlay is visible
    useEffect(() => {
        const locked = windowBlurred || devToolsOpen || screenSharingActive;
        document.body.style.overflow = locked ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [windowBlurred, devToolsOpen, screenSharingActive]);

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        // Also scroll the container just in case it's the one scrolling
        if (containerRef.current) {
            containerRef.current.parentElement?.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [currentPage]);

    const pageWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth - 80 : 700, 700);

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col h-full flex-1 min-h-0 bg-gray-950"
            // CSS-level security: block selection, gestures, drag
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                // @ts-ignore – vendor prefix
                msUserSelect: 'none',
            }}
            // Belt-and-suspenders for context menu
            onContextMenu={(e) => e.preventDefault()}
        >

            {/* ── DevTools Blur Overlay ──────────────────────────────────── */}
            {/* When DevTools is suspected open, content blurs to deter screen reading */}
            {devToolsOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
                    style={{ backdropFilter: 'blur(24px)', background: 'hsl(220 18% 8% / 0.85)' }}
                >
                    <AlertTriangle className="w-12 h-12 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Developer Tools Detected</h2>
                    <p className="text-gray-400 text-sm text-center max-w-sm">
                        Please close browser developer tools to continue reading.
                        Content is protected by PulmoPrep DRM.
                    </p>
                </div>
            )}

            {/* ── Screen Sharing / Security Overlay ────────────────────────── */}
            {(screenSharingActive || windowBlurred) && !devToolsOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 cursor-pointer"
                    style={{ backdropFilter: 'blur(24px)', background: 'hsl(220 18% 8% / 0.85)' }}
                    onClick={resumeReading}
                >
                    <Shield className="w-12 h-12 text-amber-400" />
                    <h2 className="text-xl font-bold text-white">Security Protection Active</h2>
                    <p className="text-gray-400 text-sm text-center max-w-sm px-4">
                        Unusual activity detected. Content hidden for protection.
                        Click here to resume reading.
                    </p>

                </div>
            )}

            {/* ── Hold to Reveal Overlay ─────────────────────────────────── */}
            {/* {!revealContent && !windowBlurred && !devToolsOpen && (
                <div
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 cursor-pointer"
                    style={{ backdropFilter: 'blur(24px)', background: 'hsl(220 18% 8% / 0.85)' }}
                >
                    <Eye className="w-12 h-12 text-blue-400 animate-pulse" />
                    <h2 className="text-xl font-bold text-white">Hold to Read</h2>
                    <p className="text-gray-400 text-sm text-center max-w-sm">
                        To protect this content, you must click and hold your mouse button to read it.
                        If you let go, the content will be hidden.
                    </p>
                </div>
            )} */}

            {/* ── Top Reader Toolbar ─────────────────────────────────────── */}
            <div className="sticky top-0 z-30 border-b border-white/10 backdrop-blur-xl"
                style={{ background: 'hsl(220 18% 10% / 0.95)' }}>
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
                    {/* Book title */}
                    <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-200 truncate">{bookTitle}</span>
                    </div>

                    {/* Page nav */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button> */}

                        <span className="text-sm text-gray-300 tabular-nums">
                            {currentPage} / {numPages || totalPages}
                        </span>

                        {/* <button
                            onClick={() => setCurrentPage(p => Math.min(numPages || totalPages, p + 1))}
                            disabled={currentPage >= (numPages || totalPages)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button> */}
                    </div>

                    {/* Zoom + DRM badge */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setScale(s => Math.max(0.6, +(s - 0.1).toFixed(1)))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(2.0, +(s + 0.1).toFixed(1)))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-emerald-300"
                            style={{ background: 'hsl(150 80% 40% / 0.1)', border: '1px solid hsl(150 80% 40% / 0.25)' }}>
                            <Shield className="w-3 h-3" />
                            Secure
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PDF Render Area ────────────────────────────────────────── */ }
            <div className="flex-1 overflow-auto py-8 px-4 min-h-0">
                <div className="max-w-4xl mx-auto flex justify-center">
                    <div className="relative">
                        {/* Watermark sits on top of every page */}
                        <Watermark userName={_userName} userEmail={_userEmail} />
                        {/* <Watermark /> */}

                        {/* Interaction shield: users can't select/drag canvas, but pointer-events:none ensures mouse wheel reaches the scroll container */}
                        <div
                            className="absolute inset-0 z-20"
                            style={{ pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                        />

                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={() => setLoadError(true)}
                            loading={
                                <div className="flex items-center justify-center w-[700px] h-[900px] text-gray-500 gap-3">
                                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                    <span className="text-sm">Loading secure content…</span>
                                </div>
                            }
                            error={
                                loadError ? (
                                    <div className="flex flex-col items-center justify-center w-[700px] h-[500px] gap-4 text-gray-400">
                                        <BookOpen className="w-12 h-12 opacity-30" />
                                        <p className="font-medium">Could not load the book.</p>
                                        <p className="text-sm text-gray-500">Please contact support if the issue persists.</p>
                                    </div>
                                ) : undefined
                            }
                        >
                            <Page
                                pageNumber={currentPage}
                                width={pageWidth * scale}
                                // Disable text layer → no DOM text nodes → Ctrl+A/C won't select anything
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-2xl"
                            />
                        </Document>
                    </div>
                </div>
            </div>

            {/* ── Bottom Page Navigation ─────────────────────────────────── */}
            <div className="sticky bottom-0 border-t border-white/10 py-3 px-4 backdrop-blur-xl z-30"
                style={{ background: 'hsl(220 18% 10% / 0.95)' }}>
                <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="btn-secondary px-4 py-2 text-sm gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <span className="text-sm text-gray-400 tabular-nums px-4">
                        Page {currentPage} of {numPages || totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(numPages || totalPages, p + 1))}
                        disabled={currentPage >= (numPages || totalPages)}
                        className="btn-secondary  px-4 py-2 text-sm gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
});
