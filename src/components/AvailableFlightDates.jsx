
import { useEffect, useId, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";

export default function AvailableFlightDates({
  label,
  value,
  dates = [],
  onChange,
  loading = false,
  disabled = false,
  placeholder = "Selecciona una fecha",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();

  const formatDate = (date) => {
    const [year, month, day] = date.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
      "es-GT",
      {
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectedDate = dates.find((date) => date === value);
  const emptyMessage = loading
    ? "Consultando fechas..."
    : dates.length === 0
      ? "Sin fechas disponibles"
      : placeholder;

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-w-0 ${open ? "z-40" : "z-0"}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${selectedDate ? formatDate(selectedDate) : emptyMessage}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled || loading}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full min-w-0 items-center gap-4 rounded-2xl border bg-white px-5 py-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#3333CC] ${
          open
            ? "border-[#3333CC] ring-2 ring-[#3333CC]/10"
            : "border-[#DCE3EF] hover:border-[#3333CC]"
        } ${
          disabled || loading
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        }`}
      >
        <CalendarDays className="h-8 w-8 shrink-0 text-slate-600" />

        <span className="min-w-0 flex-1">
          <span className="mb-1 block text-xs text-slate-400">
            {label}
          </span>

          <span
            className={`block truncate text-sm font-semibold sm:text-base ${
              selectedDate ? "text-[#101936]" : "text-[#64748B]"
            }`}
          >
            {selectedDate ? formatDate(selectedDate) : emptyMessage}
          </span>
        </span>

        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-600" />
        ) : (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#455675] transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {open && (
        <div
          id={listId}
          role="group"
          aria-label={`Fechas disponibles para ${label.toLowerCase()}`}
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-[#DCE3EF] bg-white p-3 shadow-[0_15px_40px_rgba(51,51,153,0.20)]"
        >
          <p className="px-2 py-3 text-[11px] font-semibold tracking-wider text-slate-400">
            FECHAS DISPONIBLES
          </p>

          <div className="max-h-60 space-y-1 overflow-y-auto">
            {dates.map((date) => {
              const selected = date === value;

              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(date);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#3333CC] ${
                    selected
                      ? "bg-[#EEEDFF] text-[#3333CC]"
                      : "text-[#101936] hover:bg-[#F5F4FF]"
                  }`}
                >
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">{formatDate(date)}</span>
                  {selected && (
                    <Check className="h-4 w-4 shrink-0 text-[#3333CC]" />
                  )}
                </button>
              );
            })}

            {dates.length === 0 && (
              <p className="py-5 text-center text-sm text-slate-500">
                Sin fechas disponibles
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
