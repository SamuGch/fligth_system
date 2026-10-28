
import { useState } from "react";
import {
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
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: 42 }, (_, index) => {
    const day = index - offset + 1;

    if (day < 1 || day > totalDays) return null;

    return new Date(year, month, day);
  });
};

export default function FlightDateRangeCalendar({
  departureDate,
  returnDate,
  phase,
  tripType,
  onSelect,
  onClose,
  onClear,
}) {
  const [month, setMonth] = useState(() => {
    const base = departureDate
      ? fromISO(departureDate)
      : new Date();

    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const [hoveredDate, setHoveredDate] = useState("");

  const today = toISO(new Date());
  const isRound = tripType === "round";

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const previousDisabled = month <= currentMonth;

  const secondMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    1
  );

  const rangeEnd =
    returnDate ||
    (phase === "return" &&
      departureDate &&
      hoveredDate >= departureDate
      ? hoveredDate
      : "");

  const handleClear = () => {
    // Elimina el rango visual temporal
    setHoveredDate("");

    // Vuelve al mes actual
    const today = new Date();

    setMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );

    // Limpia las fechas del formulario
    onClear();
  };

  const renderMonth = (monthDate, position) => (
    <div className="min-w-0 flex-1">

      {/* Encabezado del mes con navegación */}
      <div className="mb-2 flex items-center justify-between gap-2">

        {/* Flecha anterior: primer mes */}
        {position === "first" ? (
          <button
            type="button"
            disabled={previousDisabled}
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
            className="
        w-8 h-8 shrink-0
        flex items-center justify-center
        rounded-full border border-slate-200
        hover:bg-indigo-50
        disabled:opacity-30
      "
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <span className="w-8 h-8 shrink-0" />
        )}

        {/* Nombre del mes */}
        <h4 className="text-center text-sm font-semibold text-[#101936] capitalize">
          {new Intl.DateTimeFormat("es-ES", {
            month: "long",
            year: "numeric",
          }).format(monthDate)}
        </h4>

        {/* En móvil: siguiente mes en el primer calendario */}
        {position === "first" ? (
          <>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Mes siguiente"
              className="
          md:hidden w-8 h-8 shrink-0
          items-center justify-center
          rounded-full border border-slate-200
          hover:bg-indigo-50
          flex
        "
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="hidden md:block w-8 h-8 shrink-0" />
          </>
        ) : (
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mes siguiente"
            className="
        w-8 h-8 shrink-0
        flex items-center justify-center
        rounded-full border border-slate-200
        hover:bg-indigo-50
      "
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

      </div>


      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((day) => (
          <span
            key={day}
            className="text-center text-xs font-semibold text-slate-600"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {getDays(monthDate).map((date, index) => {
          if (!date) {
            return <span key={`empty-${index}`} />;
          }

          const iso = toISO(date);

          const isDeparture = iso === departureDate;
          const isReturn = iso === returnDate;

          const isSelected = isDeparture || isReturn;

          const inRange = Boolean(
            departureDate &&
            rangeEnd &&
            iso > departureDate &&
            iso < rangeEnd
          );

          const disabled =
            iso < today ||
            (phase === "return" &&
              departureDate &&
              iso < departureDate);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              aria-label={new Intl.DateTimeFormat("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(date)}
              aria-pressed={isSelected}
              aria-current={iso === today ? "date" : undefined}
              onMouseEnter={() => setHoveredDate(iso)}
              onClick={() => {
                setHoveredDate("");
                onSelect(iso);
              }}
              className={`
                h-9 sm:h-8 w-full
                flex items-center justify-center
                text-sm
                transition-colors
                cursor-pointer
                disabled:cursor-not-allowed
                disabled:text-slate-300

                ${isSelected
                  ? "rounded-full bg-[#333399] text-white font-bold"
                  : inRange
                    ? "bg-[#E9E8FF] text-[#333399]"
                    : "rounded-full text-slate-700 hover:bg-indigo-50"
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-label="Seleccionar fechas del vuelo"
      className="
        w-full
        max-h-[78dvh] overflow-y-auto
        rounded-[24px]
        border border-[#DCE3EF]
        bg-white
        p-4 sm:p-4
        shadow-[0_20px_60px_rgba(25,20,90,0.25)]
      "
    >

      {/* Encabezado del calendario */}
      <div className="grid grid-cols-[64px_minmax(0,1fr)_64px] items-center gap-2">

        {/* Botón limpiar - izquierda */}

        <button
          type="button"
          onClick={handleClear}
          disabled={!departureDate && !returnDate}
          aria-label="Limpiar fechas seleccionadas"
          title="Limpiar fechas"
          className="
                      w-9 h-9
                      flex items-center justify-center
                      rounded-full
                      border border-slate-200
                      text-[#64748B]
                      hover:bg-indigo-50
                      hover:border-[#3333CC]
                      hover:text-[#3333CC]
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                      transition-all duration-200
                      cursor-pointer
                    ">
          <RotateCcw className="w-4 h-4" strokeWidth={1.8} />
        </button>


        {/* Título centrado */}
        <p className=" text-center text-[14px] sm:text-[17px] font-bold leading-tight text-[#101936] ">
          {phase === "departure"
            ? "Fecha de salida"
            : "Fecha de regreso"}
        </p>

        {/* Cerrar - derecha */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar calendario"
          className="justify-self-end rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer ">
          <X className="w-5 h-5" />
        </button>

      </div>




      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {renderMonth(month, "first")}

        <div className="hidden md:block">
          {renderMonth(secondMonth, "second")}
        </div>
      </div>

    </div>
  );
}
