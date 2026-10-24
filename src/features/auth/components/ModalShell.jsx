import { useEffect } from "react";
import { X } from "lucide-react";

export default function ModalShell({ children, onClose, titleId }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
