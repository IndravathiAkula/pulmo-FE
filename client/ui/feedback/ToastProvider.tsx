"use client";

/**
 * Application-level toast system.
 *
 * Mount <ToastProvider> once near the top of the tree (root layout). Any
 * descendant client component can then call `useToast()` and fire toasts:
 *
 *   const toast = useToast();
 *   toast.success("Profile updated");
 *   toast.error("Something went wrong");
 *
 * For Server Action results wired via `useActionState`, prefer the
 * `useActionStateToast(state)` hook — it watches the state object and
 * fires the appropriate toast whenever a new result arrives.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
} from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
}

interface ToastRecord {
  id: string;
  variant: ToastVariant;
  message: string;
  duration: number;
  exiting: boolean;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const EXIT_ANIMATION_MS = 220;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const clearTimer = (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  };

  const dismiss = useCallback((id: string) => {
    clearTimer(id);
    // Mark as exiting so the slide-out animation can play, then unmount.
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    const removeTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, EXIT_ANIMATION_MS);
    timersRef.current.set(id, removeTimer);
  }, []);

  const show = useCallback(
    (message: string, options?: ToastOptions) => {
      const id =
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      const variant = options?.variant ?? "info";
      const duration = options?.duration ?? DEFAULT_DURATION;

      setToasts((prev) => [
        ...prev,
        { id, variant, message, duration, exiting: false },
      ]);

      const autoDismissTimer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, autoDismissTimer);
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (m: string, d?: number) => show(m, { variant: "success", duration: d }),
    [show]
  );
  const error = useCallback(
    (m: string, d?: number) => show(m, { variant: "error", duration: d }),
    [show]
  );
  const info = useCallback(
    (m: string, d?: number) => show(m, { variant: "info", duration: d }),
    [show]
  );
  const warning = useCallback(
    (m: string, d?: number) => show(m, { variant: "warning", duration: d }),
    [show]
  );

  // Clean up any pending timers on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, warning, dismiss }}
    >
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast must be used within <ToastProvider>. Mount the provider in the root layout."
    );
  }
  return ctx;
}

/**
 * Convenience hook for Server Action results. Pair with `useActionState`:
 *
 *   const [state, action, pending] = useActionState(myAction, initial);
 *   useActionStateToast(state);
 *
 * Fires a success or error toast whenever the state reference changes
 * (i.e. after a dispatch settles). The initial empty state is ignored.
 */
export function useActionStateToast<
  S extends { success: boolean; message: string }
>(state: S) {
  const toast = useToast();
  const lastProcessedRef = useRef<S | null>(null);

  useEffect(() => {
    if (lastProcessedRef.current === state) return;
    lastProcessedRef.current = state;
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state, toast]);
}

/* ── Toaster UI ─────────────────────────────────────────────── */

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconFg: string;
    border: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconBg: "var(--color-accent-light)",
    iconFg: "var(--color-accent-hover)",
    border: "rgba(34, 197, 94, 0.35)",
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    iconBg: "#FEE2E2",
    iconFg: "var(--color-error)",
    border: "rgba(220, 38, 38, 0.30)",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    iconBg: "var(--color-sky-light)",
    iconFg: "var(--color-blue-500)",
    border: "rgba(56, 189, 248, 0.35)",
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBg: "var(--color-peach-light)",
    iconFg: "var(--color-peach-deep)",
    border: "rgba(249, 168, 88, 0.40)",
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const config = VARIANT_CONFIG[toast.variant];

  return (
    <div
      role="status"
      className={`pointer-events-auto min-w-[260px] max-w-[380px] flex items-start gap-3 px-4 py-3 rounded-xl bg-white shadow-lg border ${
        toast.exiting ? "animate-toast-out" : "animate-toast-in"
      }`}
      style={{ borderColor: config.border }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: config.iconBg, color: config.iconFg }}
      >
        {config.icon}
      </div>
      <p className="flex-1 text-sm font-semibold text-[var(--color-text-body)] leading-relaxed pt-1.5 break-words">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 mt-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-md hover:bg-[var(--color-surface)] transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
