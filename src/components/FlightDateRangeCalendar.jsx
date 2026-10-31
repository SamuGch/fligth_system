import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";

const weekdays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const toISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromISO = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getDays = (monthDate) => {
  const offset = (new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1
  ).getDay() + 6) % 7;
  const totalDays = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0
  ).getDate();

  return Array.from({ length: offset + totalDays }, (_, index) => {
    const day = index - offset + 1;
    return day < 1 ? null : new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
  });
};

const formatMonthTitle = (monthDate) =>
  new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(monthDate).replace(" de ", " ");

const formatPrice = (price) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return null;
  return `$${Math.round(amount).toLocaleString("en-US")}`;
};

const normalizeDateOptions = (options) =>
  options
    .map((option) =>
      typeof option === "string"
        ? { departureDate: option, price: null }
        : option
    )
    .filter((option) => option?.departureDate)
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate));

const getMonthStart = (value) => {
  const date = value instanceof Date ? value : fromISO(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const isSameMonth = (date, monthDate) =>
  date.getFullYear() === monthDate.getFullYear() &&
  date.getMonth() === monthDate.getMonth();

const getInitialMonth = (departureDate, availableDates, phase) => {
  const base = getMonthStart(departureDate || new Date());
  const today = toISO(new Date());
  const futureOptions = normalizeDateOptions(availableDates).filter(
    (option) =>
      option.departureDate >= today &&
      !(phase === "return" &&
        departureDate &&
        option.departureDate < departureDate)
  );

  if (
    futureOptions.some((option) =>
      isSameMonth(fromISO(option.departureDate), base)
    )
  ) {
    return base;
  }

  return futureOptions[0]
    ? getMonthStart(futureOptions[0].departureDate)
    : base;
};

export default function FlightDateRangeCalendar({
  departureDate,
  returnDate,
  phase,
  onSelect,
  onClose,
  onClear,
  availableDates = [],
  loading = false,
  emptyMessage = "No hay vuelos programados en esta ruta para la cabina seleccionada.",
}) {
  const [month, setMonth] = useState(() =>
    getInitialMonth(departureDate, availableDates, phase)
  );
  const availabilityRef = useRef(null);
  const [hoveredDate, setHoveredDate] = useState("");
  const today = toISO(new Date());
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const normalizedDateOptions = normalizeDateOptions(availableDates);
  const dateOptions = new Map(
    normalizedDateOptions.map((option) => [option.departureDate, option])
  );
  const validDateOptions = normalizedDateOptions.filter(
    (option) =>
      option.departureDate >= today &&
      !(phase === "return" &&
        departureDate &&
        option.departureDate < departureDate)
  );
  const nextAvailableDate = validDateOptions[0] ?? null;

  useEffect(() => {
    if (availabilityRef.current === availableDates) return;

    availabilityRef.current = availableDates;
    if (validDateOptions.length === 0) return;

    const hasFlightInVisibleMonth = validDateOptions.some((option) =>
      isSameMonth(fromISO(option.departureDate), month)
    );

    if (!hasFlightInVisibleMonth) {
      const nextMonth = getMonthStart(nextAvailableDate.departureDate);
      const timer = setTimeout(() => setMonth(nextMonth), 0);
      return () => clearTimeout(timer);
    }
  }, [
    availableDates,
    departureDate,
    month,
    nextAvailableDate,
    phase,
    validDateOptions,
  ]);

  const rangeEnd =
    returnDate ||
    (phase === "return" && departureDate && hoveredDate >= departureDate
      ? hoveredDate
      : "");
  const visibleAvailableDates = getDays(month).filter((date) => {
    if (!date) return false;
    const iso = toISO(date);
    return (
      dateOptions.has(iso) &&
      iso >= today &&
      !(phase === "return" && departureDate && iso < departureDate)
    );
  });
  const totalVuelosValidosEnRuta = validDateOptions.length;
  const vuelosEnMesVisible = visibleAvailableDates.length;
  const hasGlobalAvailability = totalVuelosValidosEnRuta > 0;
  const hasMonthlyAvailability = vuelosEnMesVisible > 0;

  const goToNextAvailableDate = () => {
    if (nextAvailableDate) {
      setMonth(getMonthStart(nextAvailableDate.departureDate));
    }
  };

  const changeMonth = (amount) => {
    setMonth((current) => new Date(
      current.getFullYear(),
      current.getMonth() + amount,
      1
    ));
  };

  const handleClear = () => {
    setHoveredDate("");
    const now = new Date();
    setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onClear();
  };

  const previousDisabled = month < currentMonth;

  return (
    <div
      role="dialog"
      aria-label="Seleccionar fechas del vuelo"
      onClick={(event) => event.stopPropagation()}
      className="w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-5 shadow-2xl sm:max-w-md"
    >
      {loading && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#3333CC]/30 border-t-[#3333CC]" />
          Consultando fechas disponibles...
        </div>
      )}

      {!loading && !hasGlobalAvailability && (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/80 p-3.5 text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-xs font-medium leading-snug text-amber-800">
            {emptyMessage}
          </p>
        </div>
      )}

      {!loading && hasGlobalAvailability && !hasMonthlyAvailability && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-blue-200/60 bg-blue-50/70 p-3 text-xs text-blue-900">
          <p>
            Sin vuelos en este mes. Próximo vuelo disponible en{" "}
            <span className="font-semibold capitalize">
              {formatMonthTitle(fromISO(nextAvailableDate.departureDate))}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={goToNextAvailableDate}
            className="ml-2 shrink-0 text-xs font-semibold text-blue-700 underline hover:text-blue-900"
          >
            Ver fecha próxima
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={previousDisabled}
          onClick={() => changeMonth(-1)}
          aria-label="Mes anterior"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all duration-150 hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-center text-base font-bold capitalize text-gray-800">
          {formatMonthTitle(month)}
        </h2>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all duration-150 hover:border-blue-200 hover:bg-blue-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
        <p className="text-xs font-medium text-slate-500">
          {phase === "departure" ? "Fecha de salida" : "Fecha de regreso"}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClear}
            disabled={!departureDate && !returnDate}
            aria-label="Limpiar fechas"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar calendario"
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <span key={day} className="text-center text-[11px] font-semibold text-slate-500">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {getDays(month).map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className="h-12" />;

          const iso = toISO(date);
          const option = dateOptions.get(iso);
          const isSelected = iso === departureDate || iso === returnDate;
          const inRange = Boolean(departureDate && rangeEnd && iso > departureDate && iso < rangeEnd);
          const isAvailable = Boolean(option);
          const disabled =
            loading ||
            iso < today ||
            !isAvailable ||
            (phase === "return" && departureDate && iso < departureDate);
          const price = option ? formatPrice(option.price) : null;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-label={`${new Intl.DateTimeFormat("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(date)}${price ? `, ${price}` : ""}`}
              aria-pressed={isSelected}
              aria-current={iso === today ? "date" : undefined}
              onMouseEnter={() => setHoveredDate(iso)}
              onClick={() => {
                setHoveredDate("");
                onSelect(iso);
              }}
              className={`group flex h-12 w-full flex-col items-center justify-center rounded-xl transition-all duration-150 ${
                disabled
                  ? "pointer-events-none cursor-not-allowed bg-transparent text-gray-400 opacity-20"
                  : isSelected
                    ? "bg-blue-900 text-white shadow-md shadow-blue-900/20"
                    : inRange
                      ? "bg-blue-50 text-blue-900"
                      : "cursor-pointer border border-blue-200/60 bg-blue-50/70 text-gray-900 hover:bg-blue-600 hover:text-white"
              }`}
            >
              <span className={`text-sm font-bold ${!isSelected && !disabled ? "group-hover:text-white" : ""}`}>
                {date.getDate()}
              </span>
              {price && (
                <span className={`mt-0.5 text-[10px] font-bold leading-none ${
                  isSelected ? "text-white" : "text-emerald-600 group-hover:text-white"
                }`}>
                  {price}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
