import { useEffect, useRef, useState } from "react";
import { MapPinned, X } from "lucide-react";

export default function Toast({
  message,
  onClose,
  duration = 4500,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => setIsVisible(true));
    const dismissTimer = setTimeout(() => setIsVisible(false), duration);
    const removeTimer = setTimeout(() => onClose(), duration + 300);

    return () => {
      cancelAnimationFrame(enterFrame);
      clearTimeout(dismissTimer);
      clearTimeout(removeTimer);
      clearTimeout(closeTimerRef.current);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    closeTimerRef.current = setTimeout(onClose, 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border border-indigo-100 bg-white p-4 text-slate-700 shadow-lg transition-all duration-300 ease-out ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <MapPinned className="h-5 w-5" aria-hidden="true" />
      </div>

      <p className="flex-1 pt-2 text-sm font-medium leading-5">
        {message}
      </p>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar notificación"
        className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
