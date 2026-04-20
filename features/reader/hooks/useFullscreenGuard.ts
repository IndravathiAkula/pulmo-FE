"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useFullscreenGuard Hook
 * 
 * Manages the browser Fullscreen API lifecycle with a focus on security.
 * Detects forced exits (e.g., browser UI exit) vs. intentional application exits.
 * 
 * @param onSecurityExit Callback triggered when fullscreen is exited unexpectedly.
 */
export function useFullscreenGuard(onSecurityExit: () => void) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isIntentionalExit = useRef(false);

  // Cross-browser fullscreen request
  const enterFullscreen = useCallback(async (element: HTMLElement) => {
    setError(null);
    try {
      // Check for user activation if supported (Chrome 72+)
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.isActive) {
        console.warn("Fullscreen request skipped: No user activation detected.");
        setError("User activation required. Please click the button to enter secure mode.");
        return;
      }

      const request = 
        element.requestFullscreen || 
        (element as any).webkitRequestFullscreen || 
        (element as any).msRequestFullscreen;

      if (!request) {
        setError("Fullscreen API not supported in this browser.");
        return;
      }

      await request.call(element);
      setIsFullscreen(true);
      isIntentionalExit.current = false;
    } catch (err: any) {
      console.error("Fullscreen entry failed:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permissions')) {
        setError("Browser blocked fullscreen. This usually happens if not triggered by a click.");
      } else {
        setError(err.message || "An unexpected error occurred during fullscreen entry.");
      }
    }
  }, []);

  // Application-controlled exit
  const exitFullscreen = useCallback(async () => {
    isIntentionalExit.current = true;
    try {
      const exit = 
        document.exitFullscreen || 
        (document as any).webkitExitFullscreen || 
        (document as any).msExitFullscreen;

      if (exit) {
        await exit.call(document);
      }
    } catch (err) {
      console.error("Fullscreen exit failed:", err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentFullscreenElement = 
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).msFullscreenElement;

      const active = !!currentFullscreenElement;
      setIsFullscreen(active);

      // If we are no longer in fullscreen, check if it was intended
      if (!active && !isIntentionalExit.current) {
        // Unexpected exit (e.g. Browser "X" button or ESC)
        // We treat ESC the same as an intentional exit if handled by the shell, 
        // but by default, any abrupt loss of fullscreen triggers security exit.
        onSecurityExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onSecurityExit]);

  return {
    isFullscreen,
    error,
    enterFullscreen,
    exitFullscreen,
  };
}
