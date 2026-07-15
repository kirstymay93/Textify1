import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  notify: (options: ToastOptions) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 4500;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toastClasses(variant: ToastVariant): string {
  switch (variant) {
    case "success":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-50";
    case "error":
      return "border-rose-500/30 bg-rose-500/10 text-rose-50";
    case "info":
      return "border-sky-500/30 bg-sky-500/10 text-sky-50";
    default:
      return "border-white/10 bg-white/8 text-white";
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeout = timeoutsRef.current[id];
    if (timeout) {
      window.clearTimeout(timeout);
      delete timeoutsRef.current[id];
    }
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
    Object.values(timeoutsRef.current).forEach((timeout) => window.clearTimeout(timeout));
    timeoutsRef.current = {};
  }, []);

  const notify = useCallback<ToastContextValue["notify"]>((options) => {
    const id = createId();
    const nextToast: ToastItem = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? "default",
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    };

    setToasts((current) => [nextToast, ...current].slice(0, 4));
    timeoutsRef.current[id] = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return id;
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (title, description) => notify({ title, description, variant: "success" }),
      error: (title, description) => notify({ title, description, variant: "error" }),
      info: (title, description) => notify({ title, description, variant: "info" }),
      dismiss,
      clear,
    }),
    [clear, dismiss, notify]
  );

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3"
      >
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all",
              toastClasses(toast.variant ?? "default")
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="text-sm/5 opacity-90">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                Close
              </button>
            </div>

            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                className="mt-3 inline-flex rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/10"
                onClick={() => {
                  toast.onAction?.();
                  dismiss(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
