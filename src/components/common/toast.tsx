'use client';

import { CircleCheck, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * The success toast (Document 6, 8.10, D6-23): bottom on compact, bottom-left on expanded, visible for 6 seconds and
 * announced as a status message, with a Dismiss button. The timer pauses while it is hovered, focused or touched, and
 * a touch holds it until dismissed. Errors are never only in a toast: forms show them in the summary.
 */
interface Toast {
  id: number;
  text: string;
}

const ToastContext = createContext<(text: string) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({
  children,
  dismissLabel,
}: {
  children: ReactNode;
  dismissLabel: string;
}) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [held, setHeld] = useState(false);
  const counter = useRef(0);
  const show = useCallback((text: string) => {
    counter.current += 1;
    setHeld(false);
    setToast({ id: counter.current, text });
  }, []);

  useEffect(() => {
    if (!toast || held) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast, held]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Always present, so a new message is announced (Document 6, section 11). */}
      <div
        role="status"
        className="pointer-events-none fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-50 flex justify-center lg:inset-x-auto lg:start-6 lg:justify-start"
      >
        {toast ? (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-[480px] items-center gap-3 rounded-3 border border-success-edge bg-success-fill py-2 ps-4 pe-1 text-ink shadow-overlay"
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={() => setHeld(false)}
            onTouchStart={() => setHeld(true)}
          >
            <CircleCheck aria-hidden="true" className="size-5 shrink-0 text-success" />
            <p className="type-small">{toast.text}</p>
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-2 text-ink-2 transition-colors duration-100 hover:bg-sunken"
              onClick={() => setToast(null)}
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{dismissLabel}</span>
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
