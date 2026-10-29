
import { CalendarDays, ChevronDown, Loader2 } from "lucide-react";

export default function AvailableFlightDates({
  label,
  value,
  dates = [],
  onChange,
  loading = false,
  disabled = false,
  placeholder = "Selecciona una fecha",
}) {
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

  return (
    <div className="relative min-w-0">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 pl-5 transition-all hover:border-[#3333CC] focus-within:ring-2 focus-within:ring-indigo-100">
        <CalendarDays className="h-7 w-7 shrink-0 text-slate-600" />

        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs text-slate-500">
            {label}
          </label>

          <div className="relative">
            <select
              value={value || ""}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled || loading}
              className="w-full appearance-none bg-transparent pr-6 text-sm font-semibold text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <option value="">
                {loading
                  ? "Consultando fechas..."
                  : dates.length === 0
                    ? "Sin fechas disponibles"
                    : placeholder}
              </option>

              {dates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>

            {loading ? (
              <Loader2 className="pointer-events-none absolute right-0 top-0 h-4 w-4 animate-spin text-indigo-600" />
            ) : (
              <ChevronDown className="pointer-events-none absolute right-0 top-0 h-4 w-4 text-slate-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
