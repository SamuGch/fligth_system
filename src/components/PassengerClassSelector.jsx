import { useId, useRef, useState } from "react";
import { ChevronDown, Minus, Plus, Users, X } from "lucide-react";

const MAX_PASSENGERS = 10;
const DEFAULT_DETAILS = { adults: 1, children: 0, infants: 0 };

function getSelection(value) {
  const details = {
    ...DEFAULT_DETAILS,
    ...(value?.passengerDetails ?? {}),
  };
  const totalPassengers =
    Number(value?.totalPassengers) ||
    details.adults + details.children + details.infants;

  return {
    passengerDetails: {
      adults: Math.max(1, Number(details.adults) || 1),
      children: Math.max(0, Number(details.children) || 0),
      infants: Math.max(0, Number(details.infants) || 0),
    },
    totalPassengers: Math.max(1, Math.min(MAX_PASSENGERS, totalPassengers)),
  };
}

export default function PassengerClassSelector({ value, onChange, onFocus, onClose, active = false, compact = false }) {
  const open = active;
  const [draft, setDraft] = useState(() => getSelection(value));
  const triggerRef = useRef(null);
  const listId = useId();

  const totalPassengers = Object.values(draft.passengerDetails).reduce(
    (total, count) => total + count,
    0
  );

  const updatePassengerCount = (type, increment) => {
    setDraft((current) => {
      const currentCount = current.passengerDetails[type];
      const nextCount = currentCount + increment;
      if (nextCount < (type === "adults" ? 1 : 0)) return current;

      const nextTotal = totalPassengers - currentCount + nextCount;
      if (nextTotal > MAX_PASSENGERS || nextTotal < 1) return current;

      return {
        ...current,
        totalPassengers: nextTotal,
        passengerDetails: {
          ...current.passengerDetails,
          [type]: nextCount,
        },
      };
    });
  };

  const confirmSelection = () => {
    onChange({ ...draft, totalPassengers });
    onClose?.();
    triggerRef.current?.focus();
  };

  const labels = [
    ["adults", "Adultos", "12 años o más"],
    ["children", "Niños", "De 2 a 11 años"],
    ["infants", "Bebés", "Menores de 2 años"],
  ];

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={`relative w-full min-w-0 ${open ? "z-50" : "z-0"}`}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Pasajeros: ${totalPassengers} ${totalPassengers === 1 ? "pasajero" : "pasajeros"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (!active) onFocus?.();
        }}
        className={`
          flex w-full min-w-0 box-border items-center gap-3
          rounded-2xl border bg-white text-left
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3333CC]/20
          ${compact ? "h-[56px] min-h-0 px-3 py-2" : "h-[64px] min-h-0 px-4 py-2"}
          ${open
            ? "border-[#3333CC] ring-2 ring-[#3333CC]/10"
            : "border-[#DCE3EF] hover:border-[#3333CC]"
          }
        `}
      >
        <Users className="h-7 w-7 shrink-0 text-[#455675]" />
        <span className="flex min-w-0 flex-1 flex-col justify-center text-left">
          <span className="mb-1 block text-xs font-normal normal-case tracking-normal leading-tight text-[#8292B0]">
            Pasajeros
          </span>
          <span className="block truncate whitespace-nowrap text-[14px] font-semibold leading-tight text-[#101936]">
            {totalPassengers} pax
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#455675] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={listId}
          role="dialog"
          aria-label="¿Quiénes vuelan?"
          className="absolute right-0 top-full z-50 mt-2 w-[min(390px,calc(100vw-2rem))] origin-top-right rounded-2xl border border-[#DCE3EF] bg-white p-4 shadow-[0_15px_40px_rgba(51,51,153,0.2)] transition-all duration-200"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#101936]">¿Quiénes vuelan?</h2>
              <p className="mt-1 text-xs text-slate-500">Máximo 10 pasajeros por reserva</p>
            </div>
            <button type="button" aria-label="Cerrar selector" onClick={() => onClose?.()} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {labels.map(([type, label, description]) => {
              const count = draft.passengerDetails[type];
              return (
                <div key={type} className="min-w-0 rounded-lg bg-slate-50 p-2">
                  <div className="mb-1.5">
                    <p className="truncate text-xs font-semibold text-[#101936]">{label}</p>
                    <p className="truncate text-[10px] text-slate-500">{description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <button type="button" aria-label={`Disminuir ${label}`} disabled={count <= (type === "adults" ? 1 : 0)} onClick={() => updatePassengerCount(type, -1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DCE3EF] text-[#333399] transition hover:bg-[#EEEDFF] disabled:cursor-not-allowed disabled:opacity-40">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-[#101936]">{count}</span>
                    <button type="button" aria-label={`Aumentar ${label}`} disabled={totalPassengers >= MAX_PASSENGERS} onClick={() => updatePassengerCount(type, 1)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#333399] text-[#333399] transition hover:bg-[#EEEDFF] disabled:cursor-not-allowed disabled:opacity-40">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={confirmSelection} className="mt-3 w-full rounded-xl bg-[#333399] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2D2DA8] focus-visible:outline-2 focus-visible:outline-[#3333CC] focus-visible:outline-offset-2">
            Listo
          </button>
        </div>
      )}
    </div>
  );
}
