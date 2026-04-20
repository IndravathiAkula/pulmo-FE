"use client";

import { useEffect, useRef, useState } from 'react';

// ── DevTools detection ────────────────────────────────────────────────────────
function detectDevTools(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.outerWidth - window.innerWidth > 160) return true;

    let getterFired = false;
    const img = new Image();
    Object.defineProperty(img, 'id', { get() { getterFired = true; } });
     
    console.log(img);
    return getterFired;
}

interface SecurityOptions {
    devToolsBlur?: boolean;
    blurOnFocusLost?: boolean;
    holdToReveal?: boolean;
}

export function useReaderSecurity(options: SecurityOptions = {}) {
    const { devToolsBlur = true, blurOnFocusLost = true, holdToReveal = false } = options;

    const [devToolsOpen, setDevToolsOpen] = useState<boolean>(() =>
        devToolsBlur ? detectDevTools() : false
    );
    const [windowBlurred, setWindowBlurred] = useState(false);
    const [securityInterlock, setSecurityInterlock] = useState(false);
    const [screenSharingActive, setScreenSharingActive] = useState(false);
    const [revealContent, setRevealContent] = useState(!holdToReveal);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const devToolsOpenRef = useRef<boolean>(devToolsOpen);
    
    // NEW: Grace period to prevent false positives during mount/fullscreen transition
    const gracePeriodRef = useRef<boolean>(true);
    const lastChromeDeltaRef = useRef<number>(typeof window !== 'undefined' ? window.outerHeight - window.innerHeight : 0);

    // Sync ref on every render so listeners catch the latest state
    useEffect(() => {
        devToolsOpenRef.current = devToolsOpen;
    }, [devToolsOpen]);

    useEffect(() => {
        // Initialize grace period on mount
        const timer = setTimeout(() => {
            gracePeriodRef.current = false;
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // ── 1. Right-click and Basic Events ──────────────────────────────
        const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
        const handleDragStart = (e: DragEvent) => e.preventDefault();
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            e.clipboardData?.setData('text/plain', '');
        };

        // ── 2. Screen Sharing Detection (Monkey-patching) ────────────────
        let originalGetDisplayMedia: typeof navigator.mediaDevices.getDisplayMedia | null = null;
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
            navigator.mediaDevices.getDisplayMedia = async (options?: DisplayMediaStreamOptions) => {
                try {
                    // @ts-ignore
                    const stream = await originalGetDisplayMedia!.call(navigator.mediaDevices, options);
                    setScreenSharingActive(true);
                    stream.getTracks().forEach(track => {
                        const handleEnd = () => setScreenSharingActive(false);
                        track.addEventListener('ended', handleEnd);
                        track.addEventListener('mute', handleEnd);
                    });
                    return stream;
                } catch (err) {
                    setScreenSharingActive(false);
                    throw err;
                }
            };
        }

        // ── 3. Keyboard and Security Shortcuts ──────────────────────────
        const forceBlur = async () => {
            if (blurOnFocusLost) {
                setWindowBlurred(true);
                setSecurityInterlock(true);
                try { await navigator.clipboard?.writeText(''); } catch {}
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            if (ctrl && ['c', 'p', 's', 'a'].includes(e.key.toLowerCase())) { e.preventDefault(); return; }
            if (e.key === 'F12' || (ctrl && shift && ['i', 'j', 'c'].includes(e.key.toLowerCase()))) { e.preventDefault(); return; }
            if (ctrl && e.key.toLowerCase() === 'u') { e.preventDefault(); return; }
            if (e.key === 'PrintScreen') { e.preventDefault(); forceBlur(); return; }
            if (ctrl && shift && e.key.toLowerCase() === 's') { forceBlur(); return; }
            if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) { e.preventDefault(); forceBlur(); return; }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') { e.preventDefault(); forceBlur(); }
        };

        // ── 4. DevTools Polling ──────────────────────────────────────────
        let devToolsCheckInterval: ReturnType<typeof setInterval> | null = null;
        if (devToolsBlur) {
            devToolsCheckInterval = setInterval(() => {
                const isOpen = detectDevTools();
                setDevToolsOpen(isOpen);
                // IF DevTools was open but now it is closed, automatically clear interlocks
                if (!isOpen && devToolsOpenRef.current) {
                    setSecurityInterlock(false);
                    setWindowBlurred(false);
                }
            }, 1500);
        }

        // ── 5. Focus/Blur Deterrents (with Timer Interlock) ──────────────
        // If focus is lost for more than 1.5s, we suspect a screen-share or 
        // screenshot tool selection dialog was used.
        const handleBlur = () => {
            if (blurOnFocusLost) {
                setWindowBlurred(true);
                // If DevTools is ALREADY open, don't set the security interlock
                // as the DevTools overlay will handle the protection.
                if (devToolsOpenRef.current) return;

                if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                blurTimerRef.current = setTimeout(() => {
                    // Only interlock (latch) if we aren't in a transition grace period
                    if (!gracePeriodRef.current) {
                        setSecurityInterlock(true);
                    }
                }, 1500);
            }
        };

        const handleFocus = () => {
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
            if (blurOnFocusLost) {
                setWindowBlurred(false);
            }
        };

        const handleVisibilityChange = () => {
            if (blurOnFocusLost) {
                const isHidden = document.hidden;
                setWindowBlurred(isHidden);
                if (isHidden) {
                    setScreenSharingActive(false);
                    if (!devToolsOpenRef.current && !gracePeriodRef.current) {
                        if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                        blurTimerRef.current = setTimeout(() => setSecurityInterlock(true), 1500);
                    }
                }
            }
        };

        const handleResize = () => {
            // DEPRECATED: Blanket forceBlur on resize is the main cause of false positives 
            // during fullscreen transitions. We now rely on dimension delta polling instead.
            // if (blurOnFocusLost && !document.hidden) forceBlur();
        };

        // ── 6. Dimension Delta Polling (Aggressive) ─────────────────────
        const dimensionCheckInterval = setInterval(() => {
            if (typeof window === 'undefined') return;
            const currentDelta = window.outerHeight - window.innerHeight;
            
            // SECURITY LOGIC:
            // Catch sharing banners (Chrome/Edge) which add a ~40-60px toolbar.
            // We ignore transitions where the delta DECREASES (like going fullscreen).
            // We only alert if delta INCREASES significantly after the grace period.
            if (!gracePeriodRef.current && currentDelta > lastChromeDeltaRef.current + 40) {
                forceBlur();
            }
            lastChromeDeltaRef.current = currentDelta;
        }, 1000);

        // ── Listeners Registration ───────────────────────────────────────
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('webkitvisibilitychange', handleVisibilityChange);
        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('keyup', handleKeyUp, true);
        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('copy', handleCopy, true);

        // Printing
        const printStyle = document.createElement('style');
        printStyle.innerHTML = `@media print { body { display: none !important; } }`;
        document.head.appendChild(printStyle);

        // Hold to Reveal
        const handleMouseDown = () => { if (holdToReveal) setRevealContent(true); };
        const handleMouseUp = () => { if (holdToReveal) setRevealContent(false); };
        if (holdToReveal) {
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mouseleave', handleMouseUp);
            window.addEventListener('touchstart', handleMouseDown);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            if (originalGetDisplayMedia && navigator.mediaDevices) {
                navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
            }
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current);

            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('webkitvisibilitychange', handleVisibilityChange);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('keyup', handleKeyUp, true);
            document.removeEventListener('dragstart', handleDragStart, true);
            document.removeEventListener('copy', handleCopy, true);
            document.head.removeChild(printStyle);

            if (holdToReveal) {
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('mouseleave', handleMouseUp);
                window.removeEventListener('touchstart', handleMouseDown);
                window.removeEventListener('touchend', handleMouseUp);
            }
            if (devToolsCheckInterval) clearInterval(devToolsCheckInterval);
            if (dimensionCheckInterval) clearInterval(dimensionCheckInterval);
        };
    }, [devToolsBlur, blurOnFocusLost, holdToReveal]);

    const resumeReading = () => {
        setWindowBlurred(false);
        setSecurityInterlock(false);
        setScreenSharingActive(false);
    };

    const isPaused = windowBlurred || securityInterlock || screenSharingActive;

    return { devToolsOpen, windowBlurred: isPaused, screenSharingActive, containerRef, resumeReading, revealContent };
}


